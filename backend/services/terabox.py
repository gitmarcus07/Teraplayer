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

from .extractors import resolve_terabox, is_terabox_url, extract_share_id
from .native_extractor import extract_native

logger = logging.getLogger(__name__)

# In-memory cache fallback (used when MongoDB is not configured)
_MEMORY_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
# Shadow-mode economy: share metadata is immutable, so cache long (default
# 12h, override via CACHE_TTL_SECONDS) to cut repeat paid upstream calls at
# 6-7k req/day. Mongo TTL index cleanup is separate; the app-level age check
# below is what governs cache hits.
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "43200") or 43200)

# Will be set by get_preview() on first call
_db = None


def _set_db(database) -> None:
    """Allow server.py to inject the database handle after module load."""
    global _db
    _db = database


# Load COOKIE_JSON from env
COOKIE_JSON = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS") or ""


def _native_cookie() -> str:
    """Cookie for the native fallback: single env first, then pool header."""
    if COOKIE_JSON:
        return COOKIE_JSON
    try:
        from . import cookie_pool

        return cookie_pool.next_cookie_header()
    except Exception:
        return ""


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


def canonical_cache_key(url: str, password: str = "") -> str:
    """Normalize cache keys so the same share hits one entry.

    Strips mirror differences (1024terabox vs terabox), the leading '1' in
    /s/1xxx paths, and tracking query params. Password stays part of the key.
    Falls back to the lowercased raw URL when no share id is found.
    """
    u = (url or "").strip()
    try:
        sid = extract_share_id(u)
    except Exception:
        sid = None
    if sid:
        sid = sid[1:] if sid.startswith("1") else sid
        return f"surl:{sid}::{password or ''}"
    return f"{u.lower()}::{password or ''}"


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

    cache_key = canonical_cache_key(url, password)

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
    _cookie = _native_cookie()
    if not data.get("ok") and not data.get("password_required") and _cookie:
        logger.info("Community extractors failed, trying native TeraBox API extraction...")
        try:
            native = await extract_native(url, password=password, cookie_json=_cookie)
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


async def find_cached_stream(surl: str, fs_id: str, database=None) -> str | None:
    """Best-effort lookup of a previously resolved stream URL by share+file.

    Scans the in-memory cache, then (bounded) Mongo cache docs whose keys
    match this share. Returns the stream/download URL or None. Used by the
    self-API fast_stream route so recently resolved links serve playlists
    without extra upstream calls. Never raises.
    """
    try:
        prefix = f"surl:{surl}::"
        for key, (_, data) in list(_MEMORY_CACHE.items()):
            if not key.startswith(prefix):
                continue
            for f in data.get("files") or []:
                if isinstance(f, dict) and str(f.get("fs_id") or "") == str(fs_id):
                    url = f.get("stream_url") or f.get("download_url")
                    if url:
                        return url
        db = database if database is not None else _db
        if db is not None:
            cursor = db.cache.find({"_key": {"$regex": f"^surl:{surl}::"}}).sort("cached_at", -1).limit(20)
            async for doc in cursor:
                for f in (doc.get("data") or {}).get("files") or []:
                    if isinstance(f, dict) and str(f.get("fs_id") or "") == str(fs_id):
                        url = f.get("stream_url") or f.get("download_url")
                        if url:
                            return url
    except Exception:
        pass
    return None
