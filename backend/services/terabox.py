"""TeraBox service layer – orchestrates extractors and provides caching.

Uses MongoDB for persistent cache (survives pod restarts).
Falls back to in-memory cache when MongoDB is not configured.
"""
from __future__ import annotations

import os
import re
import time
import logging
from datetime import datetime, timezone
from typing import Any

from pymongo import ReplaceOne

from .extractors import resolve_terabox, is_terabox_url
from .native_extractor import extract_native

logger = logging.getLogger(__name__)

# In-memory cache fallback (used when MongoDB is not configured)
_MEMORY_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

# Will be set by get_preview() on first call
_db = None


def _set_db(database) -> None:
    """Allow server.py to inject the database handle after module load."""
    global _db
    _db = database


# Load COOKIE_JSON from env
COOKIE_JSON = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS") or ""


def parse_share_input(text: str) -> tuple[str, str]:
    """Extract the clean URL and any inline password from a shared TeraBox note.

    Handles common share formats such as:
      "<url> Password:xxxx"
      "<url> password: xxxx"
      "<url> pwd=xxxx"
      "<url>|xxxx"
    """
    if not text:
        return "", ""
    s = text.strip()

    # inline password appended after URL
    m = re.search(r"\s+(?:password|pwd|pass|pwd is)\s*[:=]?\s*(\S+)\s*$", s, re.IGNORECASE)
    if m:
        pwd = m.group(1).strip("'\"").strip()
        return s[: m.start()].strip(), pwd

    # url|password style
    if "|" in s and " " not in s:
        parts = s.rsplit("|", 1)
        if parts[0].startswith("http"):
            return parts[0].strip(), parts[1].strip()

    return s, ""


async def _get_cached(cache_key: str) -> dict[str, Any] | None:
    """Retrieve cached result from Mongo (or in-memory fallback)."""
    if _db is not None:
        doc = await _db.cache.find_one({"_key": cache_key})
        if doc:
            age = time.time() - doc["cached_at"]
            if age < CACHE_TTL_SECONDS:
                return doc["data"]
            # Expired – delete it
            await _db.cache.delete_one({"_key": cache_key})
        return None

    # In-memory fallback
    cached = _MEMORY_CACHE.get(cache_key)
    if cached:
        age = time.time() - cached[0]
        if age < CACHE_TTL_SECONDS:
            return cached[1]
        del _MEMORY_CACHE[cache_key]
    return None


async def _set_cached(cache_key: str, data: dict[str, Any]) -> None:
    """Store result in Mongo (or in-memory fallback)."""
    if _db is not None:
        await _db.cache.bulk_write([
            ReplaceOne(
                {"_key": cache_key},
                {
                    "_key": cache_key,
                    "data": data,
                    "cached_at": time.time(),
                    "expires_at": datetime.now(timezone.utc),
                },
                upsert=True,
            ),
        ])
        return

    _MEMORY_CACHE[cache_key] = (time.time(), data)


async def get_preview(url: str, password: str = "") -> dict[str, Any]:
    """Resolve a TeraBox URL and return preview data with caching."""
    raw_url, inline_pwd = parse_share_input(url or "")
    if not raw_url:
        return {"ok": False, "error": "Empty URL"}
    if inline_pwd and not password:
        password = inline_pwd
    url = raw_url

    if not is_terabox_url(url):
        return {
            "ok": False,
            "error": "Not a valid TeraBox link. Please paste a link from terabox.com or a supported mirror.",
        }

    cache_key = f"{url}::{password}"

    # Check cache
    cached = await _get_cached(cache_key)
    if cached:
        logger.info("Cache hit for %s", url)
        return cached

    # Extract via orchestrator
    data = await resolve_terabox(url, password=password)
    if data.get("ok"):
        await _set_cached(cache_key, data)
        return data

    # If all community extractors failed, try native TeraBox API extraction as a
    # final fallback — but ONLY when an ndus cookie is configured. Production uses
    # the xAPIverse API as the primary path and must NOT require a personal cookie.
    if not data.get("ok") and not data.get("password_required") and COOKIE_JSON:
        logger.info("Community extractors failed, trying native TeraBox API extraction...")
        try:
            native = await extract_native(url, password=password, cookie_json=COOKIE_JSON)
            if native.get("ok"):
                await _set_cached(cache_key, native)
                return native
            if native.get("error"):
                data["error"] = f"{data.get('error', '')}; native: {native['error']}"
            if native.get("password_required"):
                return native
        except Exception as exc:
            logger.warning("Native extractor failed: %s", exc)
            data["error"] = f"{data.get('error', '')}; native: {exc}"

    return data


def clear_cache() -> None:
    """Clear all cached extraction results."""
    _MEMORY_CACHE.clear()
