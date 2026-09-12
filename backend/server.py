"""TeraPlayer FastAPI backend — production-ready configuration.

Uses lifespan context manager (replaced deprecated @on_event).
Supports MongoDB-backed rate limiting, auth, persistent cache,
and structured JSON logging for observability on Render/Railway.
"""
from __future__ import annotations

import asyncio
import contextvars
import ipaddress
import json
import logging
import os
import platform
import socket
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
from models.site import (
    SiteSettings,
    AnnouncementSettings,
    AnnouncementButton,
    MaintenanceSchedule,
    OperatingMode,
)
from models.search_console import (
    SearchAnalyticsQuery,
    DateRange,
    get_date_range,
)
from services.terabox import get_preview, _set_db as _set_cache_db, CACHE_TTL_SECONDS
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
from services.audit_log import record_audit, list_audit, count_audit, get_audit_actions
from services.site_settings import (
    get_site_settings,
    set_site_settings,
    get_public_site_status,
    get_maintenance_history,
    check_and_apply_scheduled_maintenance,
)
from services.search_console_service import (
    get_connection_status,
    save_connection,
    disconnect_search_console,
    query_search_analytics,
    get_overview,
    get_top_queries,
    get_top_pages,
    get_countries,
    get_devices,
    get_search_appearance,
    get_chart_data,
    SearchConsoleError,
)
from services.metrics import (
    record_metric,
    dashboard_summary,
    analytics_series,
    analytics_series_by_kind,
    get_kind_breakdown,
    get_failure_reasons,
    get_extraction_analytics,
    get_api_analytics,
    export_analytics_csv,
    record_error,
    get_errors,
    count_errors,
    get_error_summary,
)
from services.system_health import (
    run_all_health_checks,
    get_system_info,
    HealthCheckResult,
)
from services.notifications import (
    get_notifications,
    count_unread_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    archive_notification,
    create_notification,
)

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


# Background task for scheduled maintenance
_scheduler_task: asyncio.Task | None = None


async def _scheduled_maintenance_checker() -> None:
    """Background task that periodically checks and applies scheduled maintenance."""
    while True:
        try:
            await asyncio.sleep(60)  # Check every minute
            if db is not None:
                await check_and_apply_scheduled_maintenance(db)
        except asyncio.CancelledError:
            break
        except Exception as exc:  # noqa: BLE001
            logger.warning("Scheduled maintenance checker error", exc_info=exc)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup tasks → yield → shutdown tasks."""
    global _scheduler_task
    # ---- Startup ----
    logger.info("TeraPlayer starting up")
    if db is not None:
        try:
            await ensure_rl_indexes(db)
            await _ensure_session_ttl_index(db)
            await _ensure_cache_ttl_index(db)
            await ensure_extension_jobs_indexes(db)
            await ensure_admin_indexes(db)
            await bootstrap_super_admin(db)
            _set_cache_db(db)
            _set_extension_jobs_db(db)

            # Create indexes for new collections
            await db.site_settings.create_index("updated_at")
            await db.maintenance_history.create_index([("started_at", -1)])
            await db.maintenance_history.create_index("ended_at")

            logger.info("MongoDB indexes ready")
        except Exception as exc:
            logger.warning("Index setup failed (non-fatal)", exc_info=exc)

    # Start scheduled maintenance checker
    _scheduler_task = asyncio.create_task(_scheduled_maintenance_checker())
    logger.info("Scheduled maintenance checker started")

    yield
    # ---- Shutdown ----
    logger.info("TeraPlayer shutting down")
    if _scheduler_task:
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
        logger.info("Scheduled maintenance checker stopped")
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


async def _ensure_cache_ttl_index(db) -> None:
    """TTL index on cache.expires_at so cached extraction results (whose keys
    embed the share password and whose values embed signed CDN URLs) expire on
    their own, even when never read again after the cache window."""
    existing = await db.cache.index_information()
    if "expires_at_ttl" not in existing:
        await db.cache.create_indexes([
            IndexModel([("expires_at", ASCENDING)],
                       name="expires_at_ttl",
                       expireAfterSeconds=CACHE_TTL_SECONDS),
        ])
        logger.info("Created TTL index on cache.expires_at")


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


class SiteModeRequest(BaseModel):
    """Body for POST /api/admin/site/mode — matches frontend adminApi."""

    operating_mode: OperatingMode
    confirmation: bool = False


class SearchConsoleConnectRequest(BaseModel):
    """Body for POST /api/admin/search-console/connect — matches frontend adminApi."""

    property_url: str
    service_account_email: str


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
        except Exception:
            checks["mongo"] = "error"
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
    return await get_public_site_status(db)


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


_PRIVATE_NETWORKS = tuple(
    ipaddress.ip_network(net)
    for net in (
        "0.0.0.0/8",
        "10.0.0.0/8",
        "100.64.0.0/10",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "172.16.0.0/12",
        "192.0.0.0/24",
        "192.168.0.0/16",
        "198.18.0.0/15",
        "224.0.0.0/4",
        "240.0.0.0/4",
        "::1/128",
        "fc00::/7",
        "fe80::/10",
    )
)


async def _is_unsafe_ssrf_target(url: str) -> bool:
    """Reject stream targets that could reach internal infrastructure.

    Blocks non-http(s) schemes, embedded credentials, private/loopback/
    link-local/reserved IP literals, and hostnames that resolve to any such
    address (covers DNS-rebinding and literal names like localhost).
    Legitimate public TeraBox/CDN hosts are unaffected.
    """
    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return True
        if parsed.username or parsed.password:
            return True
        host = (parsed.hostname or "").lower().rstrip(".")
        if not host:
            return True
        try:
            addr = ipaddress.ip_address(host)
        except ValueError:
            addr = None
        if addr is not None:
            return any(addr in net for net in _PRIVATE_NETWORKS)
        loop = asyncio.get_running_loop()
        try:
            infos = await loop.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        except Exception:
            return True
        for info in infos:
            try:
                resolved = ipaddress.ip_address(info[4][0])
            except ValueError:
                continue
            if any(resolved in net for net in _PRIVATE_NETWORKS):
                return True
        return False
    except Exception:
        return True


# ---------------------------------------------------------------------------
# Streaming proxy
# ---------------------------------------------------------------------------


@api.get("/stream")
async def stream(request: Request, url: str = Query(...)):
    await check_rate_limit(db, request, scope="stream")
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid stream URL")
    if await _is_unsafe_ssrf_target(url):
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
                if await _is_unsafe_ssrf_target(next_url):
                    await client_.aclose()
                    raise HTTPException(
                        status_code=502,
                        detail="The requested stream could not be reached. Please try again.",
                    )
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
        raise HTTPException(
            status_code=502,
            detail="The requested stream could not be reached. Please try again.",
        ) from exc

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
        secure=os.environ.get("NODE_ENV") == "production",
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

    # Run health checks
    health_checks = await run_all_health_checks(db)

    # Get system info
    system_info = await get_system_info(db)

    # Determine overall status
    overall_status = "healthy"
    for check in health_checks:
        if check.status == "unhealthy":
            overall_status = "unhealthy"
            break
        elif check.status == "degraded" and overall_status == "healthy":
            overall_status = "degraded"

    # Legacy secret vars for backward compatibility
    secret_vars = {
        "XAPIVERSE_API_KEY": bool(os.environ.get("XAPIVERSE_API_KEY")),
        "TERABOX_WORKER_URL": bool(os.environ.get("TERABOX_WORKER_URL")),
        "COOKIE_JSON": bool(os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS")),
        "EXTENSION_HMAC_SECRET": bool(os.environ.get("EXTENSION_HMAC_SECRET")),
        "GOOGLE_SEARCH_CONSOLE_CREDENTIALS": bool(os.environ.get("GOOGLE_SEARCH_CONSOLE_CREDENTIALS")),
    }

    return {
        "status": overall_status,
        "version": "2.0.0",
        "health_checks": [check.to_dict() for check in health_checks],
        "system_info": system_info,
        "secret_vars": secret_vars,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@admin_router.get("/system/health")
async def admin_system_health(request: Request) -> dict[str, Any]:
    """Get detailed health check results."""
    await require_admin(request, db)
    health_checks = await run_all_health_checks(db)
    system_info = await get_system_info(db)
    overall_status = "healthy"
    for check in health_checks:
        if check.status == "unhealthy":
            overall_status = "unhealthy"
            break
        elif check.status == "degraded" and overall_status == "healthy":
            overall_status = "degraded"
    return {
        "status": overall_status,
        "checks": [check.to_dict() for check in health_checks],
        "system_info": system_info,
    }


@admin_router.get("/system/info")
async def admin_system_info(request: Request) -> dict[str, Any]:
    """Get detailed system information."""
    await require_admin(request, db)
    system_info = await get_system_info(db)
    return system_info


# ---------------------------------------------------------------------------
# Notifications (admin only)
# ---------------------------------------------------------------------------


@admin_router.get("/notifications")
async def admin_notifications(
    request: Request,
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
) -> dict[str, Any]:
    """Get notifications for the current admin."""
    admin = await require_admin(request, db)
    notifications = await get_notifications(db, admin_id=admin.admin_id, unread_only=unread_only, limit=limit, skip=skip)
    unread_count = await count_unread_notifications(db, admin.admin_id)
    return {"notifications": notifications, "unread_count": unread_count, "limit": limit, "skip": skip}


@admin_router.post("/notifications/{notification_id}/read")
async def admin_notification_mark_read(
    request: Request,
    notification_id: str,
) -> dict[str, Any]:
    """Mark a notification as read."""
    admin = await require_admin(request, db)
    success = await mark_notification_read(db, notification_id, admin.admin_id)
    return {"success": success}


@admin_router.post("/notifications/read-all")
async def admin_notifications_mark_all_read(
    request: Request,
) -> dict[str, Any]:
    """Mark all notifications as read."""
    admin = await require_admin(request, db)
    count = await mark_all_notifications_read(db, admin.admin_id)
    return {"marked_read": count}


@admin_router.post("/notifications/{notification_id}/archive")
async def admin_notification_archive(
    request: Request,
    notification_id: str,
) -> dict[str, Any]:
    """Archive a notification."""
    admin = await require_admin(request, db)
    success = await archive_notification(db, notification_id, admin.admin_id)
    return {"success": success}


@admin_router.get("/notifications/unread-count")
async def admin_notifications_unread_count(request: Request) -> dict[str, Any]:
    """Get unread notification count for the current admin."""
    admin = await require_admin(request, db)
    count = await count_unread_notifications(db, admin.admin_id)
    return {"unread_count": count}


@admin_router.post("/notifications/test")
async def admin_notification_test(
    request: Request,
    type: str = "info",
    category: str = "system",
    title: str = "Test Notification",
    message: str = "This is a test notification",
) -> dict[str, Any]:
    """Create a test notification (for development)."""
    admin = await require_admin(request, db)
    notification = await create_notification(
        db,
        type=type,
        category=category,
        title=title,
        message=message,
        admin_id=admin.admin_id,
    )
    return {"notification": notification}


# ---------------------------------------------------------------------------
# Errors (admin only)
# ---------------------------------------------------------------------------


@admin_router.get("/errors")
async def admin_errors(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    kind: Optional[str] = Query(None),
    error_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get errors with filtering and pagination."""
    await require_admin(request, db)
    errors = await get_errors(db, limit=limit, skip=skip, kind=kind, error_type=error_type, start_date=start_date, end_date=end_date, search=search)
    total = await count_errors(db, kind=kind, error_type=error_type, start_date=start_date, end_date=end_date, search=search)
    return {"errors": errors, "total": total, "limit": limit, "skip": skip}


@admin_router.get("/errors/summary")
async def admin_errors_summary(
    request: Request,
    days: int = Query(7, ge=1, le=90),
) -> dict[str, Any]:
    """Get error summary for the last N days."""
    await require_admin(request, db)
    summary = await get_error_summary(db, days)
    return summary


@admin_router.get("/errors/export")
async def admin_errors_export(
    request: Request,
    kind: Optional[str] = Query(None),
    error_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> Response:
    """Export errors as CSV."""
    await require_admin(request, db)
    errors = await get_errors(db, limit=10000, skip=0, kind=kind, error_type=error_type, start_date=start_date, end_date=end_date, search=search)

    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Kind", "Error Type", "Message", "Detail"])
    for error in errors:
        writer.writerow([
            error.get("created_at", ""),
            error.get("kind", ""),
            error.get("error_type", ""),
            error.get("message", ""),
            str(error.get("detail", "")),
        ])

    csv_data = output.getvalue()
    filename = f"teraplayer_errors_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Activity (admin only)
# ---------------------------------------------------------------------------
@admin_router.get("/activity")
async def admin_activity(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    admin_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get audit log entries with filtering and pagination."""
    await require_admin(request, db)
    entries = await list_audit(db, limit=limit, skip=skip, admin_id=admin_id, action=action, start_date=start_date, end_date=end_date, search=search)
    total = await count_audit(db, admin_id=admin_id, action=action, start_date=start_date, end_date=end_date, search=search)
    actions = await get_audit_actions(db)
    return {"entries": entries, "total": total, "limit": limit, "skip": skip, "actions": actions}


@admin_router.get("/activity/export")
async def admin_activity_export(
    request: Request,
    admin_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> Response:
    """Export audit log as CSV."""
    await require_admin(request, db)
    entries = await list_audit(db, limit=10000, skip=0, admin_id=admin_id, action=action, start_date=start_date, end_date=end_date, search=search)

    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Action", "Admin Email", "Admin Name", "Role", "Target", "Detail", "IP"])
    for entry in entries:
        writer.writerow([
            entry.get("created_at", ""),
            entry.get("action", ""),
            entry.get("admin_email", ""),
            entry.get("admin_name", ""),
            entry.get("role", ""),
            entry.get("target", ""),
            entry.get("detail", ""),
            entry.get("ip", ""),
        ])

    csv_data = output.getvalue()
    filename = f"teraplayer_audit_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


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
    settings = await get_site_settings(db)
    return settings.model_dump()


@admin_router.patch("/site")
async def admin_site_update(request: Request, body: dict[str, Any]) -> dict[str, Any]:
    acting = await require_admin(request, db)
    require_csrf_header(request)

    # Parse nested objects
    announcement = None
    if "announcement" in body:
        announcement = AnnouncementSettings(**body["announcement"])

    schedule = None
    if "schedule" in body:
        schedule = MaintenanceSchedule(**body["schedule"])

    settings = await set_site_settings(
        db,
        operating_mode=body.get("operating_mode"),
        maintenance_mode=body.get("maintenance_mode"),
        announcement=announcement,
        schedule=schedule,
        updated_by=acting.admin_id,
    )
    await record_audit(db, acting, "update_site", detail=settings.operating_mode, ip=_client_ip(request))
    return settings.model_dump()


@admin_router.post("/site/mode")
async def admin_site_set_mode(
    request: Request,
    body: SiteModeRequest,
) -> dict[str, Any]:
    """Set site operating mode with confirmation for emergency mode."""
    acting = await require_admin(request, db)
    require_csrf_header(request)

    operating_mode = body.operating_mode
    confirmation = body.confirmation

    current = await get_site_settings(db)

    # Require explicit confirmation for emergency mode
    if operating_mode == "emergency" and not confirmation:
        raise HTTPException(
            status_code=400,
            detail="Emergency mode requires explicit confirmation. Set confirmation=true to proceed.",
        )

    # If enabling emergency mode, record current state for potential rollback
    if operating_mode == "emergency" and current.operating_mode != "emergency":
        await record_audit(
            db,
            acting,
            "enable_emergency_mode",
            detail=f"Previous mode: {current.operating_mode}",
            ip=_client_ip(request),
        )

    settings = await set_site_settings(
        db,
        operating_mode=operating_mode,
        updated_by=acting.admin_id,
    )
    await record_audit(db, acting, "set_operating_mode", detail=operating_mode, ip=_client_ip(request))
    return settings.model_dump()


@admin_router.get("/site/history")
async def admin_site_history(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
) -> dict[str, Any]:
    """Get maintenance history with pagination."""
    await require_admin(request, db)
    entries = await get_maintenance_history(db, limit=limit, skip=skip)
    total = 0
    if db is not None:
        total = await db.maintenance_history.count_documents({})
    return {"entries": [e.model_dump() for e in entries], "total": total, "limit": limit, "skip": skip}


@admin_router.post("/site/preview")
async def admin_site_preview(request: Request, body: dict[str, Any]) -> dict[str, Any]:
    """Generate a preview of the maintenance page."""
    await require_admin(request, db)

    announcement = None
    if "announcement" in body:
        announcement = AnnouncementSettings(**body["announcement"])

    # Return the data that would be shown on the maintenance page
    return {
        "operating_mode": body.get("operating_mode", "maintenance"),
        "announcement": announcement.model_dump() if announcement else (await get_site_settings(db)).announcement.model_dump(),
        "scheduled": body.get("scheduled", False),
        "schedule_end": body.get("schedule_end"),
    }


@admin_router.post("/site/schedule/check")
async def admin_site_schedule_check(request: Request) -> dict[str, Any]:
    """Manually trigger scheduled maintenance check (for testing)."""
    acting = await require_admin(request, db)
    require_csrf_header(request)

    changed = await check_and_apply_scheduled_maintenance(db)
    settings = await get_site_settings(db)

    return {"changed": changed, "settings": settings.model_dump()}


# ---------------------------------------------------------------------------
# Search Console (admin only)
# ---------------------------------------------------------------------------


@admin_router.get("/search-console/status")
async def admin_search_console_status(request: Request) -> dict[str, Any]:
    """Get Search Console connection status."""
    await require_admin(request, db)
    connection = await get_connection_status(db)
    return connection.model_dump()


@admin_router.post("/search-console/connect")
async def admin_search_console_connect(
    request: Request,
    body: SearchConsoleConnectRequest,
) -> dict[str, Any]:
    """Connect Search Console with service account credentials.

    Credentials must be set in GOOGLE_SEARCH_CONSOLE_CREDENTIALS env var.
    """
    acting = await require_admin(request, db)
    require_csrf_header(request)

    property_url = (body.property_url or "").strip()
    service_account_email = (body.service_account_email or "").strip()

    if not property_url or not (
        property_url.startswith(("http://", "https://"))
        or property_url.startswith("sc-domain:")
    ):
        raise HTTPException(
            status_code=400,
            detail="Valid property URL required (http://, https://, or sc-domain:)"
        )

    try:
        connection = await save_connection(db, property_url, service_account_email)
        await record_audit(db, acting, "connect_search_console", target=property_url, ip=_client_ip(request))
        return connection.model_dump()
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console connect failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Connection failed: {exc}")


@admin_router.post("/search-console/disconnect")
async def admin_search_console_disconnect(request: Request) -> dict[str, Any]:
    """Disconnect Search Console."""
    acting = await require_admin(request, db)
    require_csrf_header(request)

    connection = await disconnect_search_console(db)
    await record_audit(db, acting, "disconnect_search_console", ip=_client_ip(request))
    return connection.model_dump()


@admin_router.get("/search-console/overview")
async def admin_search_console_overview(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get Search Console overview metrics."""
    await require_admin(request, db)
    try:
        result = await get_overview(db, range, custom_start, custom_end)
        return result
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console overview failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch overview: {exc}")


@admin_router.get("/search-console/chart")
async def admin_search_console_chart(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
    metrics: str = Query("clicks,impressions,ctr,position"),
) -> dict[str, Any]:
    """Get chart data for Search Console metrics."""
    await require_admin(request, db)
    try:
        metric_list = [m.strip() for m in metrics.split(",") if m.strip()]
        chart_data = await get_chart_data(db, range, metric_list, custom_start, custom_end)
        return {"data": chart_data}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console chart failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart data: {exc}")


@admin_router.get("/search-console/queries")
async def admin_search_console_queries(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
) -> dict[str, Any]:
    """Get top search queries."""
    await require_admin(request, db)
    try:
        queries = await get_top_queries(db, range, limit, custom_start, custom_end)
        return {"queries": queries}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console queries failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch queries: {exc}")


@admin_router.get("/search-console/pages")
async def admin_search_console_pages(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
) -> dict[str, Any]:
    """Get top pages."""
    await require_admin(request, db)
    try:
        pages = await get_top_pages(db, range, limit, custom_start, custom_end)
        return {"pages": pages}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console pages failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch pages: {exc}")


@admin_router.get("/search-console/countries")
async def admin_search_console_countries(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get country breakdown."""
    await require_admin(request, db)
    try:
        countries = await get_countries(db, range, custom_start, custom_end)
        return {"countries": countries}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console countries failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch countries: {exc}")


@admin_router.get("/search-console/devices")
async def admin_search_console_devices(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get device breakdown."""
    await require_admin(request, db)
    try:
        devices = await get_devices(db, range, custom_start, custom_end)
        return {"devices": devices}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console devices failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {exc}")


@admin_router.get("/search-console/search-appearance")
async def admin_search_console_search_appearance(
    request: Request,
    range: str = Query("7d", pattern="^(24h|7d|28d|3m|custom)$"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get search appearance breakdown."""
    await require_admin(request, db)
    try:
        appearances = await get_search_appearance(db, range, custom_start, custom_end)
        return {"appearances": appearances}
    except SearchConsoleError as exc:
        raise HTTPException(status_code=exc.code or 500, detail=exc.message)
    except Exception as exc:
        logger.error("Search Console search appearance failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch search appearance: {exc}")


# ---------------------------------------------------------------------------
# Advanced Analytics (admin only)
# ---------------------------------------------------------------------------


@admin_router.get("/analytics/extraction")
async def admin_analytics_extraction(
    request: Request,
    days: int = Query(14, ge=1, le=90),
) -> dict[str, Any]:
    """Get extraction analytics."""
    await require_admin(request, db)
    try:
        result = await get_extraction_analytics(db, days)
        return result
    except Exception as exc:
        logger.error("Extraction analytics failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch extraction analytics: {exc}")


@admin_router.get("/analytics/api")
async def admin_analytics_api(
    request: Request,
    days: int = Query(14, ge=1, le=90),
) -> dict[str, Any]:
    """Get API analytics."""
    await require_admin(request, db)
    try:
        result = await get_api_analytics(db, days)
        return result
    except Exception as exc:
        logger.error("API analytics failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch API analytics: {exc}")


@admin_router.get("/analytics/breakdown")
async def admin_analytics_breakdown(
    request: Request,
    days: int = Query(14, ge=1, le=90),
) -> dict[str, Any]:
    """Get breakdown by kind."""
    await require_admin(request, db)
    try:
        breakdown = await get_kind_breakdown(db, days)
        return {"breakdown": breakdown}
    except Exception as exc:
        logger.error("Analytics breakdown failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch breakdown: {exc}")


@admin_router.get("/analytics/failures")
async def admin_analytics_failures(
    request: Request,
    days: int = Query(14, ge=1, le=90),
) -> dict[str, Any]:
    """Get failure reasons."""
    await require_admin(request, db)
    try:
        failures = await get_failure_reasons(db, days)
        return {"failures": failures}
    except Exception as exc:
        logger.error("Failure reasons failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch failure reasons: {exc}")


@admin_router.get("/analytics/series-by-kind")
async def admin_analytics_series_by_kind(
    request: Request,
    days: int = Query(14, ge=1, le=90),
    kind: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Get time series broken down by kind."""
    await require_admin(request, db)
    try:
        series = await analytics_series_by_kind(db, days, kind)
        return {"series": series}
    except Exception as exc:
        logger.error("Series by kind failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch series: {exc}")


@admin_router.get("/analytics/export")
async def admin_analytics_export(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    kind: Optional[str] = Query(None),
) -> Response:
    """Export analytics as CSV."""
    await require_admin(request, db)
    try:
        csv_data = await export_analytics_csv(db, days, kind)
        filename = f"teraplayer_analytics_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        logger.error("Analytics export failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Failed to export analytics: {exc}")


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
    """Block all non-admin API traffic based on site operating mode.

    The admin API and the public /api/site/status (used by the frontend to
    render the maintenance screen) and /api/health (platform probes) stay up.
    """
    path = request.url.path
    if db is not None and path.startswith("/api") and not path.startswith("/api/admin"):
        if path not in ("/api/site/status", "/api/health"):
            try:
                status = await get_public_site_status(db)
                operating_mode = status.get("operating_mode", "normal")
                if operating_mode in ("maintenance", "emergency"):
                    return JSONResponse(
                        status_code=503,
                        content={
                            "detail": "TeraPlayer is under maintenance. Please try again later.",
                            "maintenance": True,
                            "operating_mode": operating_mode,
                            "announcement": status.get("announcement"),
                            "schedule_end": status.get("schedule_end"),
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
