"""TeraPlayer FastAPI backend — production-ready configuration.

Uses lifespan context manager (replaced deprecated @on_event).
Supports MongoDB-backed rate limiting, auth, persistent cache,
and structured JSON logging for observability on Render/Railway.
"""
from __future__ import annotations

import contextvars
import json
import logging
import os
import platform
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncIterator, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response, Query
from fastapi.responses import JSONResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from models.terabox import (
    PreviewRequest,
    PreviewResponse,
)
from models.auth import UserCreate, UserLogin, GoogleAuthRequest
from models.admin import AdminLogin, AdminCreate, AdminUpdate, AdminPasswordUpdate
from services.terabox import get_preview, _set_db as _set_cache_db
from services.extractors import is_terabox_url, EXTRACTORS
from services.extension_jobs import (
    create_job,
    get_job,
    submit_job,
    _set_db as _set_extension_jobs_db,
    ensure_indexes as ensure_extension_jobs_indexes,
    JobNotFoundError,
    InvalidTokenError,
    PreviewValidationError,
)
from services.auth import (
    signup_user,
    login_user,
    google_authenticate,
    get_current_user,
    logout as auth_logout,
)
from services.rate_limit import check_rate_limit, ensure_indexes as ensure_rl_indexes
from services.admin_auth import (
    authenticate_admin,
    create_session,
    delete_session,
    get_current_admin,
    require_admin,
    require_super_admin,
    require_csrf_header,
    list_admins,
    create_admin,
    update_admin,
    set_admin_password,
    delete_admin,
    ensure_indexes as ensure_admin_indexes,
    bootstrap_super_admin,
    ADMIN_SESSION_COOKIE,
)
from services.audit_log import record_audit, list_audit
from services.site_settings import get_site_status, set_site_status
from services.metrics import record_metric, dashboard_summary, analytics_series

# ---------------------------------------------------------------------------
# Logging — structured JSON for production
# ---------------------------------------------------------------------------

_LOG_LEVEL = (os.environ.get("LOG_LEVEL") or "INFO").upper()


# Context variable for request ID — populated by middleware, read by logging filter
_request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="")


class RequestIDFilter(logging.Filter):
    """Add request_id from context variable to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_ctx.get()
        return True


class JsonFormatter(logging.Formatter):
    """Format log records as JSON lines for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        obj = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", ""),
        }
        if record.exc_info and record.exc_info[0]:
            obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(obj, default=str)


_handler = logging.StreamHandler()
_handler.setFormatter(JsonFormatter())
_handler.addFilter(RequestIDFilter())
logging.basicConfig(level=_LOG_LEVEL, handlers=[_handler], force=True)

logger = logging.getLogger("teraplayer")

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# ---------------------------------------------------------------------------
# MongoDB connection
# ---------------------------------------------------------------------------

mongo_url = os.environ.get("MONGO_URL", "")
mongo_client: AsyncIOMotorClient | None = None
db = None

if mongo_url:
    mongo_client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db = mongo_client[os.environ.get("DB_NAME", "teraplayer")]
    logger.info("MongoDB connected", extra={"mongo_url": mongo_url.split("@")[-1] if "@" in mongo_url else "local"})
else:
    logger.info("MongoDB not configured – running in extraction-only mode (no auth/rate-limit)")


# ---------------------------------------------------------------------------
# NDUS cookie loader (cached)
# ---------------------------------------------------------------------------

_NDUS_CACHE: str | None = None


def _load_ndus_cookie() -> str:
    global _NDUS_CACHE
    if _NDUS_CACHE is not None:
        return _NDUS_CACHE
    raw = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS") or ""
    if not raw:
        _NDUS_CACHE = ""
        return ""
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            _NDUS_CACHE = parsed.get("ndus", "")
        else:
            _NDUS_CACHE = str(parsed)
    except (json.JSONDecodeError, ValueError):
        _NDUS_CACHE = raw.strip()
    return _NDUS_CACHE


# ---------------------------------------------------------------------------
# Lifespan — replaces deprecated @app.on_event("startup"/"shutdown")
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup tasks → yield → shutdown tasks."""
    # ---- Startup ----
    logger.info("TeraPlayer starting up")
    if db is not None:
        try:
            await ensure_rl_indexes(db)
            await _ensure_session_ttl_index(db)
            await ensure_extension_jobs_indexes(db)
            await ensure_admin_indexes(db)
            await bootstrap_super_admin(db)
            _set_cache_db(db)
            _set_extension_jobs_db(db)
            logger.info("MongoDB indexes ready")
        except Exception as exc:
            logger.warning("Index setup failed (non-fatal)", exc_info=exc)
    yield
    # ---- Shutdown ----
    logger.info("TeraPlayer shutting down")
    if mongo_client is not None:
        mongo_client.close()
        logger.info("MongoDB connection closed")


async def _ensure_session_ttl_index(db) -> None:
    """TTL index on user_sessions.expires_at so stale sessions auto-expire."""
    existing = await db.user_sessions.index_information()
    if "expires_at_ttl" not in existing:
        await db.user_sessions.create_indexes([
            IndexModel([("expires_at", ASCENDING)],
                       name="expires_at_ttl",
                       expireAfterSeconds=0),
        ])
        logger.info("Created TTL index on user_sessions.expires_at")


# ---------------------------------------------------------------------------
# Request-ID middleware
# ---------------------------------------------------------------------------


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request_id to each request for traceability.

    Sets both request.state.request_id (for route handlers) and
    the _request_id_ctx context variable (for the logging filter).
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:12]
        request.state.request_id = request_id
        token = _request_id_ctx.set(request_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            _request_id_ctx.reset(token)


# ---------------------------------------------------------------------------
# App & router setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TeraPlayer API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _LOG_LEVEL == "DEBUG" else None,
    redoc_url="/redoc" if _LOG_LEVEL == "DEBUG" else None,
    openapi_url="/openapi.json" if _LOG_LEVEL == "DEBUG" else None,
)
api = APIRouter(prefix="/api")


class PreviewRequestWithPwd(BaseModel):
    url: str
    password: Optional[str] = None


class ExtensionCreateRequest(BaseModel):
    """Body for POST /api/extension/create — create a browser-extension job."""
    url: str
    password: Optional[str] = None


class ExtensionSubmitRequest(BaseModel):
    """Body for POST /api/extension/submit — extension hands back extraction result.

    `preview` is validated against the shared PreviewResponse schema and capped
    in size/file count inside services.extension_jobs.
    """
    job_id: str
    token: str
    preview: dict[str, Any]


async def _get_db():
    return db


# ---------------------------------------------------------------------------
# Health & root
# ---------------------------------------------------------------------------


@api.get("/")
async def root() -> dict[str, str]:
    return {"message": "TeraPlayer API online", "version": "2.0.0"}


@api.get("/health")
async def health(request: Request) -> dict[str, Any]:
    """Enhanced health check for platform liveness/readiness probes."""
    status = "ok"
    checks = {}

    # MongoDB check
    if db is not None:
        try:
            await db.command("ping")
            checks["mongo"] = "connected"
        except Exception as exc:
            checks["mongo"] = f"error: {exc}"
            status = "degraded"
    else:
        checks["mongo"] = "not_configured"

    return {
        "ok": status == "ok",
        "status": status,
        "service": "teraplayer",
        "version": "2.0.0",
        "checks": checks,
        "request_id": getattr(request.state, "request_id", None),
    }


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@api.post("/auth/signup")
async def auth_signup(payload: UserCreate, response: Response):
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not configured")
    user, token = await signup_user(db, payload)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )
    return {"user": user.model_dump(), "session_token": token}


@api.post("/auth/login")
async def auth_login(payload: UserLogin, response: Response):
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not configured")
    user, token = await login_user(db, payload)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )
    return {"user": user.model_dump(), "session_token": token}


@api.post("/auth/google")
async def auth_google(payload: GoogleAuthRequest, response: Response):
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not configured")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google authentication not configured")
    user, token = await google_authenticate(db, payload.credential, GOOGLE_CLIENT_ID)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )
    return {"user": user.model_dump(), "session_token": token}


@api.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()


@api.post("/auth/logout")
async def auth_logout_endpoint(request: Request, response: Response):
    if db is not None:
        await auth_logout(request, db)
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


def _client_ip(request: Request) -> str:
    """Best-effort client IP for audit entries."""
    xff = request.headers.get("x-forwarded-for") or ""
    return (
        xff.split(",")[0].strip()
        or request.headers.get("x-real-ip")
        or (request.client.host if request.client else "unknown")
    )


@api.get("/site/status")
async def site_status() -> dict[str, Any]:
    """Public endpoint so the frontend can render a maintenance screen."""
    return await get_site_status(db)


# ---------------------------------------------------------------------------
# Preview / Watch / Download / Folder
# ---------------------------------------------------------------------------


@api.post("/preview", response_model=PreviewResponse)
async def preview(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    await record_metric(db, "preview", bool(data.get("ok")))
    return PreviewResponse(**data)


@api.post("/watch", response_model=PreviewResponse)
async def watch(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    await record_metric(db, "watch", bool(data.get("ok")))
    return PreviewResponse(**data)


@api.post("/download", response_model=PreviewResponse)
async def download(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    await record_metric(db, "download", bool(data.get("ok")))
    return PreviewResponse(**data)


@api.post("/folder", response_model=PreviewResponse)
async def folder(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    await record_metric(db, "folder", bool(data.get("ok")))
    return PreviewResponse(**data)


# ---------------------------------------------------------------------------
# Browser-extension extraction bridge
#
# TeraBox blocks datacenter IPs, so extraction happens in the user's own
# browser session on www.terabox.com via a browser extension. The frontend
# creates a short-lived job (create), the extension submits the resolved
# preview (submit), and the frontend polls for the result (result).
# ---------------------------------------------------------------------------


@api.post("/extension/create")
async def extension_create(payload: ExtensionCreateRequest, request: Request) -> dict[str, Any]:
    """Create a browser-extension extraction job.

    Returns a short-lived job_id, an HMAC submit token bound to that job_id,
    and the canonical terabox.com URL for the extension to open. The HMAC
    secret itself is never exposed.
    """
    await check_rate_limit(db, request, scope="extension_create")
    url = (payload.url or "").strip()

    if not url:
        raise HTTPException(status_code=400, detail="url is required")

    if not is_terabox_url(url):
        raise HTTPException(
            status_code=400,
            detail="Not a valid TeraBox link. Please paste a link from terabox.com or a supported mirror.",
        )

    result = await create_job(url, password=payload.password or "")
    await record_metric(db, "extension_create", True)
    return result


@api.post("/extension/submit")
async def extension_submit(payload: ExtensionSubmitRequest, request: Request) -> dict[str, Any]:
    """Accept an extraction result from the browser extension.

    Verifies the HMAC submit token, rejects missing/expired jobs, validates the
    preview against the shared PreviewResponse schema, and caps payload size.
    """
    await check_rate_limit(db, request, scope="extension_submit")
    try:
        result = await submit_job(payload.job_id, payload.token, payload.preview)
        await record_metric(db, "extension_submit", True)
        return result
    except JobNotFoundError:
        raise HTTPException(status_code=404, detail="Extension job not found or expired.")
    except InvalidTokenError:
        raise HTTPException(status_code=403, detail="Invalid submit token.")
    except PreviewValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@api.get("/extension/result/{job_id}")
async def extension_result(job_id: str, request: Request) -> dict[str, Any]:
    """Fetch the current state of a job: {status: pending|done, preview?}.

    Returns 404 once the job is missing or expired so the frontend can stop
    polling and offer to create a fresh job.
    """
    await check_rate_limit(db, request, scope="extension_result")
    result = await get_job(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Extension job not found or expired.")
    await record_metric(db, "extension_result", True)
    return result


TRUSTED_CDN_DOMAINS = (
    "terabox.com",
    "1024terabox.com",
    "terabox.app",
    "1024tera.com",
    "nephobox.com",
    "4funbox.com",
    "mirrobox.com",
    "momerybox.com",
    "baidupcs.com",
    "teraboxcdn.com",
    "terastaticc.com",
    "dubox.com",
)


def _is_trusted_cdn(url: str) -> bool:
    try:
        from urllib.parse import urlparse
        host = (urlparse(url).hostname or "").lower()
        return any(host == domain or host.endswith("." + domain) for domain in TRUSTED_CDN_DOMAINS)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Streaming proxy
# ---------------------------------------------------------------------------


@api.get("/stream")
async def stream(request: Request, url: str = Query(...)):
    await check_rate_limit(db, request, scope="stream")
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid stream URL")

    range_header = request.headers.get("range")
    upstream_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
        "Referer": "https://www.terabox.com/",
    }

    _ndus = _load_ndus_cookie()
    if _ndus:
        upstream_headers["Cookie"] = f"ndus={_ndus}; lang=en;"

    if range_header:
        upstream_headers["Range"] = range_header

    curr_url = url
    curr_headers = dict(upstream_headers)
    client_ = httpx.AsyncClient(timeout=None, follow_redirects=False)
    redirect_count = 0
    max_redirects = 5

    try:
        while True:
            cm = client_.stream("GET", curr_url, headers=curr_headers)
            req = await cm.__aenter__()
            if (
                req.status_code in (301, 302, 303, 307, 308)
                and "location" in req.headers
                and redirect_count < max_redirects
            ):
                from urllib.parse import urljoin
                next_url = urljoin(curr_url, req.headers["location"])
                await cm.__aexit__(None, None, None)
                redirect_count += 1
                curr_url = next_url
                if _is_trusted_cdn(curr_url):
                    if _ndus:
                        curr_headers["Cookie"] = f"ndus={_ndus}; lang=en;"
                else:
                    curr_headers.pop("Cookie", None)
            else:
                break
    except Exception as exc:
        await client_.aclose()
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}") from exc

    async def _iter():
        try:
            async for chunk in req.aiter_bytes():
                yield chunk
        finally:
            await cm.__aexit__(None, None, None)
            await client_.aclose()

    resp_headers = {}
    for h in ("content-length", "content-range", "accept-ranges", "content-type"):
        if h in req.headers:
            resp_headers[h] = req.headers[h]
    resp_headers.setdefault("accept-ranges", "bytes")

    await record_metric(db, "stream", req.status_code < 400)

    return StreamingResponse(
        _iter(),
        status_code=req.status_code,
        headers=resp_headers,
        media_type=req.headers.get("content-type", "application/octet-stream"),
    )


# ---------------------------------------------------------------------------
# Admin (private premium control center)
# ---------------------------------------------------------------------------

admin_router = APIRouter(prefix="/api/admin")


def _extractor_status() -> list[dict[str, Any]]:
    """Extractor names + enabled/configured flags. Values of secrets never leak."""
    _config_checks = {
        "xapiverse": lambda: bool(os.environ.get("XAPIVERSE_API_KEY")),
        "playwright": lambda: bool(os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS")),
        "cf_worker": lambda: bool(os.environ.get("TERABOX_WORKER_URL")),
        "hnn": lambda: True,
        "teradl": lambda: True,
    }
    return [
        {
            "name": name,
            "enabled": True,
            "configured": bool(_config_checks.get(name, lambda: False)()),
        }
        for name, _ in EXTRACTORS
    ]


@admin_router.post("/login")
async def admin_login(payload: AdminLogin, request: Request, response: Response) -> dict[str, Any]:
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not configured")
    await check_rate_limit(db, request, scope="admin_login")
    admin = await authenticate_admin(db, payload.email, payload.password)
    token = await create_session(db, admin.admin_id)
    response.set_cookie(
        key=ADMIN_SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )
    await record_audit(db, admin, "login", ip=_client_ip(request))
    return {"admin": admin.model_dump(), "session_token": token}


@admin_router.post("/logout")
async def admin_logout(request: Request, response: Response) -> dict[str, Any]:
    if db is not None:
        admin = await get_current_admin(request, db)
        await delete_session(db, request.cookies.get(ADMIN_SESSION_COOKIE))
        if admin:
            await record_audit(db, admin, "logout", ip=_client_ip(request))
    response.delete_cookie(key=ADMIN_SESSION_COOKIE, path="/", samesite="none", secure=True)
    return {"ok": True}


@admin_router.get("/me")
async def admin_me(request: Request) -> dict[str, Any]:
    admin = await require_admin(request, db)
    return admin.model_dump()


@admin_router.get("/dashboard")
async def admin_dashboard(request: Request) -> dict[str, Any]:
    await require_admin(request, db)
    return {
        "metrics": await dashboard_summary(db),
        "recent_activity": await list_audit(db, limit=10),
        "admin_count": await db.admins.count_documents({}),
        "extractors": _extractor_status(),
    }


@admin_router.get("/analytics")
async def admin_analytics(request: Request, days: int = Query(14, ge=1, le=90)) -> dict[str, Any]:
    await require_admin(request, db)
    return {
        "days": days,
        "series": await analytics_series(db, days=days),
        "summary": await dashboard_summary(db),
    }


@admin_router.get("/extraction")
async def admin_extraction(request: Request) -> dict[str, Any]:
    await require_admin(request, db)
    return {"extractors": _extractor_status()}


@admin_router.get("/system")
async def admin_system(request: Request) -> dict[str, Any]:
    await require_admin(request, db)
    mongo_status = "not_configured"
    if db is not None:
        try:
            await db.command("ping")
            mongo_status = "connected"
        except Exception:  # noqa: BLE001
            mongo_status = "degraded"
    return {
        "mongo": mongo_status,
        "db_name": os.environ.get("DB_NAME", "teraplayer"),
        "version": "2.0.0",
        "python": platform.python_version(),
        "secret_vars": {
            "XAPIVERSE_API_KEY": bool(os.environ.get("XAPIVERSE_API_KEY")),
            "TERABOX_WORKER_URL": bool(os.environ.get("TERABOX_WORKER_URL")),
            "COOKIE_JSON": bool(os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS")),
            "EXTENSION_HMAC_SECRET": bool(os.environ.get("EXTENSION_HMAC_SECRET")),
        },
    }


@admin_router.get("/activity")
async def admin_activity(request: Request, limit: int = Query(100, ge=1, le=500)) -> dict[str, Any]:
    await require_admin(request, db)
    return {"entries": await list_audit(db, limit=limit)}


@admin_router.get("/admins")
async def admin_list_admins(request: Request) -> dict[str, Any]:
    await require_admin(request, db)
    admins = await list_admins(db)
    return {"admins": [a.model_dump() for a in admins]}


@admin_router.post("/admins")
async def admin_create_admin(payload: AdminCreate, request: Request) -> dict[str, Any]:
    acting = await require_super_admin(request, db)
    require_csrf_header(request)
    created = await create_admin(db, payload)
    await record_audit(db, acting, "create_admin", target=created.email, detail=f"role={created.role}", ip=_client_ip(request))
    return {"admin": created.model_dump()}


@admin_router.patch("/admins/{admin_id}")
async def admin_update_admin(admin_id: str, payload: AdminUpdate, request: Request) -> dict[str, Any]:
    acting = await require_super_admin(request, db)
    require_csrf_header(request)
    updated = await update_admin(db, admin_id, payload, acting)
    await record_audit(db, acting, "update_admin", target=admin_id, detail=str(payload.model_dump()), ip=_client_ip(request))
    return {"admin": updated.model_dump()}


@admin_router.post("/admins/{admin_id}/password")
async def admin_set_admin_password(admin_id: str, payload: AdminPasswordUpdate, request: Request) -> dict[str, Any]:
    acting = await require_super_admin(request, db)
    require_csrf_header(request)
    await set_admin_password(db, admin_id, payload.new_password)
    await record_audit(db, acting, "set_admin_password", target=admin_id, ip=_client_ip(request))
    return {"ok": True}


@admin_router.delete("/admins/{admin_id}")
async def admin_delete_admin(admin_id: str, request: Request) -> dict[str, Any]:
    acting = await require_super_admin(request, db)
    require_csrf_header(request)
    await delete_admin(db, admin_id, acting)
    await record_audit(db, acting, "delete_admin", target=admin_id, ip=_client_ip(request))
    return {"ok": True}


@admin_router.get("/site")
async def admin_site_get(request: Request) -> dict[str, Any]:
    await require_admin(request, db)
    return await get_site_status(db)


@admin_router.patch("/site")
async def admin_site_update(request: Request, body: dict[str, Any]) -> dict[str, Any]:
    acting = await require_admin(request, db)
    require_csrf_header(request)
    status = await set_site_status(db, **body)
    await record_audit(db, acting, "update_site", detail=str(status), ip=_client_ip(request))
    return status


# ---------------------------------------------------------------------------
# Middleware: CORS, request ID, maintenance, security headers
# ---------------------------------------------------------------------------

# Production frontend origins. CORS_ORIGINS may override; an unset value must
# NEVER fall back to "*", because credentialed admin requests would then be
# allowed from any origin. As defense-in-depth, any "*" entry is also stripped.
_DEFAULT_CORS_ORIGINS = "https://teraplayer.in,https://www.teraplayer.in"
_cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", _DEFAULT_CORS_ORIGINS).split(",")
    if o.strip() and o.strip() != "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)


async def maintenance_dispatch(request: Request, call_next):
    """Block all non-admin API traffic while maintenance mode is enabled.

    The admin API and the public /api/site/status (used by the frontend to
    render the maintenance screen) and /api/health (platform probes) stay up.
    """
    path = request.url.path
    if db is not None and path.startswith("/api") and not path.startswith("/api/admin"):
        if path not in ("/api/site/status", "/api/health"):
            try:
                status = await get_site_status(db)
                if status.get("maintenance_mode"):
                    return JSONResponse(
                        status_code=503,
                        content={
                            "detail": "TeraPlayer is under maintenance. Please try again later.",
                            "maintenance": True,
                        },
                    )
            except Exception:  # noqa: BLE001
                pass
    return await call_next(request)


app.add_middleware(BaseHTTPMiddleware, dispatch=maintenance_dispatch)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to every response."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("X-XSS-Protection", "1; mode=block")
    response.headers.setdefault(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
    )
    return response

app.include_router(api)
app.include_router(admin_router)
