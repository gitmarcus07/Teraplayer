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
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncIterator, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from models.terabox import (
    FavoriteCreate,
    FavoriteEntry,
    HistoryCreate,
    HistoryEntry,
    PreviewRequest,
    PreviewResponse,
)
from services.terabox import get_preview, _set_db as _set_cache_db
from services.auth import (
    exchange_session_id,
    get_current_user,
    logout as auth_logout,
)
from services.rate_limit import check_rate_limit, ensure_indexes as ensure_rl_indexes

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
    logger.info("MongoDB not configured – running in extraction-only mode (no history/favorites/rate-limit)")


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
            await _set_cache_db(db)
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


class SessionExchange(BaseModel):
    session_id: str


async def _get_db():
    return db


async def _scope_id(request: Request, session_id: Optional[str]) -> tuple[str, str]:
    if db is None:
        return "session_id", session_id or ""
    user = await get_current_user(request, db)
    if user:
        return "user_id", user.user_id
    return "session_id", session_id or ""


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


@api.post("/auth/session")
async def auth_session(payload: SessionExchange, response: Response):
    user, token = await exchange_session_id(payload.session_id, db)
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
    await auth_logout(request, db)
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Preview / Watch / Download / Folder
# ---------------------------------------------------------------------------


@api.post("/preview", response_model=PreviewResponse)
async def preview(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    return PreviewResponse(**data)


@api.post("/watch", response_model=PreviewResponse)
async def watch(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    return PreviewResponse(**data)


@api.post("/download", response_model=PreviewResponse)
async def download(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    return PreviewResponse(**data)


@api.post("/folder", response_model=PreviewResponse)
async def folder(payload: PreviewRequestWithPwd, request: Request) -> PreviewResponse:
    await check_rate_limit(db, request, scope="preview")
    data = await get_preview(payload.url, password=payload.password or "")
    return PreviewResponse(**data)


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

    return StreamingResponse(
        _iter(),
        status_code=req.status_code,
        headers=resp_headers,
        media_type=req.headers.get("content-type", "application/octet-stream"),
    )


# ---------------------------------------------------------------------------
# History (user- or session-scoped)
# ---------------------------------------------------------------------------


@api.post("/history", response_model=HistoryEntry)
async def add_history(entry: HistoryCreate, request: Request) -> HistoryEntry:
    key, val = await _scope_id(request, entry.session_id)
    existing = await db.history.find_one({key: val, "url": entry.url}, {"_id": 0})
    if existing:
        merged = {**existing, **entry.model_dump(exclude_none=True)}
        merged[key] = val
        merged.pop("session_id" if key == "user_id" else "user_id", None)
        merged["created_at"] = HistoryEntry().created_at
        await db.history.update_one({key: val, "url": entry.url}, {"$set": merged})
        merged.setdefault("session_id", val if key == "session_id" else "")
        return HistoryEntry(**merged)
    obj = HistoryEntry(**{**entry.model_dump(), "session_id": val if key == "session_id" else ""})
    doc = obj.model_dump()
    doc[key] = val
    await db.history.insert_one(doc)
    return obj


@api.get("/history")
async def get_history(request: Request, session_id: str = "", limit: int = 50) -> list[dict[str, Any]]:
    key, val = await _scope_id(request, session_id)
    if not val:
        return []
    items = (
        await db.history.find({key: val}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(limit)
    )
    return items


@api.delete("/history")
async def clear_history(request: Request, session_id: str = "") -> dict[str, Any]:
    key, val = await _scope_id(request, session_id)
    if not val:
        return {"deleted": 0}
    result = await db.history.delete_many({key: val})
    return {"deleted": result.deleted_count}


@api.delete("/history/{item_id}")
async def delete_history_item(item_id: str, request: Request, session_id: str = "") -> dict[str, Any]:
    key, val = await _scope_id(request, session_id)
    result = await db.history.delete_one({"id": item_id, key: val})
    return {"deleted": result.deleted_count}


# ---------------------------------------------------------------------------
# Favorites (user- or session-scoped)
# ---------------------------------------------------------------------------


@api.post("/favorites", response_model=FavoriteEntry)
async def add_favorite(entry: FavoriteCreate, request: Request) -> FavoriteEntry:
    key, val = await _scope_id(request, entry.session_id)
    existing = await db.favorites.find_one({key: val, "url": entry.url}, {"_id": 0})
    if existing:
        existing.setdefault("session_id", val if key == "session_id" else "")
        return FavoriteEntry(**existing)
    obj = FavoriteEntry(**{**entry.model_dump(), "session_id": val if key == "session_id" else ""})
    doc = obj.model_dump()
    doc[key] = val
    await db.favorites.insert_one(doc)
    return obj


@api.get("/favorites")
async def get_favorites(request: Request, session_id: str = "") -> list[dict[str, Any]]:
    key, val = await _scope_id(request, session_id)
    if not val:
        return []
    items = (
        await db.favorites.find({key: val}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return items


@api.delete("/favorites/{item_id}")
async def delete_favorite(item_id: str, request: Request, session_id: str = "") -> dict[str, Any]:
    key, val = await _scope_id(request, session_id)
    result = await db.favorites.delete_one({"id": item_id, key: val})
    return {"deleted": result.deleted_count}


# ---------------------------------------------------------------------------
# Middleware: CORS, request ID, security headers
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)


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
