"""Extension job bridge — short-lived hand-off between TeraPlayer and the browser extension.

Why this exists:
  TeraBox blocks datacenter IPs (400141), so extraction only works from a
  user's own browser session on www.terabox.com. The browser extension performs
  the extraction there and hands the resolved preview back to TeraPlayer.

  This module stores a short-lived "job" created by the frontend, binds an
  HMAC submit-token to the job id (so only the extension that was given the
  token may submit), and lets the frontend poll for the result:
     1. Frontend -> POST /api/extension/create      (url, password)
     2. Extension -> POST /api/extension/submit     (job_id, token, preview)
     3. Frontend -> GET  /api/extension/result/{id} (poll until {status: done})

Storage uses MongoDB (TTL index auto-expires jobs ~10min) with an in-memory
fallback when MongoDB is not configured, mirroring services/terabox.py.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from pydantic import ValidationError
from pymongo import IndexModel, ASCENDING

from models.terabox import PreviewResponse

logger = logging.getLogger(__name__)

# Approximate job lifetime. Frontend + extension should resolve within this.
JOB_TTL_SECONDS = int(os.environ.get("EXTENSION_JOB_TTL_SECONDS", "600"))  # 10 minutes

# Cap submitted preview payloads to prevent abuse via the public submit endpoint.
MAX_FILES = 200
MAX_PREVIEW_BYTES = 1_000_000  # ~1MB of preview JSON

# HMAC secret configured via EXTENSION_HMAC_SECRET. Never exposed to clients;
# only a per-job submit token is ever sent out.
_HMAC_SECRET = os.environ.get("EXTENSION_HMAC_SECRET", "")
# Ephemeral fallback secret so the flow works out-of-the-box without config.
# Tokens minted from it only survive while the process lives.
_EPHEMERAL_SECRET: Optional[str] = None

# In-memory fallback keyed by job_id -> (expires_timestamp, doc)
_MEMORY_JOBS: dict[str, tuple[float, dict[str, Any]]] = {}

# Set by server.py via _set_db() when MongoDB is available.
_db = None


class ExtensionJobError(Exception):
    """Base class for extension job failures."""


class JobNotFoundError(ExtensionJobError):
    """:raised when a submitted job_id does not exist."""


class JobExpiredError(ExtensionJobError):
    """:raised when a job has exceeded its TTL."""


class InvalidTokenError(ExtensionJobError):
    """:raised when the submit token does not validate for a job."""


class PreviewValidationError(ExtensionJobError):
    """:raised when a submitted preview exceeds caps or fails schema validation."""


def _set_db(database) -> None:
    """Allow server.py to inject the database handle (mirrors terabox._set_db)."""
    global _db
    _db = database


async def ensure_indexes(db) -> None:
    """Create a TTL index on expires_at so stale jobs auto-purge (~10 min)."""
    existing = await db.extension_jobs.index_information()
    if "expires_at_ttl" not in existing:
        await db.extension_jobs.create_indexes([
            IndexModel([("expires_at", ASCENDING)],
                       name="expires_at_ttl",
                       expireAfterSeconds=0),
        ])
        logger.info("Created TTL index on extension_jobs.expires_at")


# ---------------------------------------------------------------------------
# HMAC submit-token helpers
# ---------------------------------------------------------------------------

def _hmac_secret() -> str:
    """Return the configured secret, or a process-local ephemeral fallback."""
    global _EPHEMERAL_SECRET
    if _HMAC_SECRET:
        return _HMAC_SECRET
    if _EPHEMERAL_SECRET is None:
        _EPHEMERAL_SECRET = secrets.token_hex(32)
        logger.warning(
            "EXTENSION_HMAC_SECRET not set - using ephemeral in-process secret "
            "(submit tokens will not survive a restart)"
        )
    return _EPHEMERAL_SECRET


def generate_submit_token(job_id: str) -> str:
    """Mint an HMAC token bound to a specific job_id."""
    message = f"teraplayer:extension:submit:{job_id}".encode("utf-8")
    return hmac.new(_hmac_secret().encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_submit_token(job_id: str, token: str) -> bool:
    """Constant-time check that token is valid for job_id."""
    if not token:
        return False
    expected = generate_submit_token(job_id)
    return hmac.compare_digest(expected, token)


# ---------------------------------------------------------------------------
# Storage helpers (MongoDB with in-memory fallback)
# ---------------------------------------------------------------------------

def _canonical_share_url(url: str) -> str:
    """Normalize any supported TeraBox URL to a www.terabox.com sharing link."""
    from services.extractors import extract_share_id
    sid = extract_share_id(url)
    if sid:
        return f"https://www.terabox.com/sharing/link?surl={sid}"
    return url


async def _load_job(job_id: str) -> Optional[dict[str, Any]]:
    """Fetch a job document, honoring TTL in both backends."""
    if _db is not None:
        doc = await _db.extension_jobs.find_one({"_id": job_id})
        if doc is None:
            return None
        expires_at = doc.get("expires_at")
        if expires_at and expires_at < datetime.now(timezone.utc):
            await _db.extension_jobs.delete_one({"_id": job_id})
            return None
        return doc

    entry = _MEMORY_JOBS.get(job_id)
    if not entry:
        return None
    expires_ts, doc = entry
    if time.time() >= expires_ts:
        del _MEMORY_JOBS[job_id]
        return None
    return doc


async def _save_job(doc: dict[str, Any]) -> None:
    """Insert a new job document (never overwrites an existing one)."""
    if _db is not None:
        return await _db.extension_jobs.insert_one(doc)
    _MEMORY_JOBS[doc["job_id"]] = (time.time() + JOB_TTL_SECONDS, doc)


async def _update_job(doc: dict[str, Any]) -> None:
    """Persist an in-place mutation of an existing job document."""
    if _db is not None:
        return await _db.extension_jobs.replace_one({"_id": doc["_id"]}, doc)
    _MEMORY_JOBS[doc["job_id"]] = (time.time() + JOB_TTL_SECONDS, doc)


# ---------------------------------------------------------------------------
# Preview payload validation
# ---------------------------------------------------------------------------

def _validate_preview(preview: Any) -> dict[str, Any]:
    """Validate and normalize a submitted preview; enforce size/file caps."""
    if not isinstance(preview, dict):
        raise PreviewValidationError("preview must be a JSON object")

    raw_size = len(json.dumps(preview, default=str))
    if raw_size > MAX_PREVIEW_BYTES:
        raise PreviewValidationError(
            f"preview payload too large: {raw_size} bytes (max {MAX_PREVIEW_BYTES})"
        )

    try:
        model = PreviewResponse(**preview)
    except ValidationError as exc:
        raise PreviewValidationError(f"preview failed validation: {exc}") from exc

    data = model.model_dump()
    if len(data.get("files") or []) > MAX_FILES:
        raise PreviewValidationError(f"too many files: {len(data['files'])} (max {MAX_FILES})")
    return data


# ---------------------------------------------------------------------------
# Public job API
# ---------------------------------------------------------------------------

async def create_job(url: str, password: str = "") -> dict[str, Any]:
    """Create a new extraction job and return the job_id + submit token.

    Only the job_id and its submit token are returned; the HMAC secret itself
    is never exposed. The frontend/extension use the canonical terabox_url to
    open the share page in the user's browser session.
    """
    job_id = f"ext_{uuid.uuid4().hex}"
    doc = {
        "_id": job_id,
        "job_id": job_id,
        "url": url,
        "password": password or "",
        "status": "pending",
        "preview": None,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=JOB_TTL_SECONDS),
    }
    await _save_job(doc)
    logger.info("Extension job created: %s", job_id)

    return {
        "job_id": job_id,
        "submit_token": generate_submit_token(job_id),
        "terabox_url": _canonical_share_url(url),
        "status": "pending",
    }


async def submit_job(job_id: str, token: str, preview: Any) -> dict[str, Any]:
    """Accept the extension's extraction result for a job.

    Rejects jobs that never existed or already expired. The token must verify
    against the job_id (see verify_submit_token). Never returns the password.
    """
    doc = await _load_job(job_id)
    if doc is None:
        raise JobNotFoundError("Job not found or expired")

    if not verify_submit_token(job_id, token):
        raise InvalidTokenError("Invalid submit token")

    data = _validate_preview(preview)
    doc["status"] = "done"
    doc["preview"] = data
    doc["submitted_at"] = datetime.now(timezone.utc)
    await _update_job(doc)
    logger.info("Extension job submitted: %s", job_id)

    return {
        "job_id": job_id,
        "status": "done",
        "preview": data,
    }


async def get_job(job_id: str) -> Optional[dict[str, Any]]:
    """Return the current public state of a job (or None if missing/expired).

    The password field is deliberately excluded from the public response.
    """
    doc = await _load_job(job_id)
    if doc is None:
        return None
    return {
        "job_id": doc["job_id"],
        "status": doc["status"],
        "preview": doc.get("preview"),
    }