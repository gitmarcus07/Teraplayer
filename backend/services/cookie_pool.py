"""Additive cookie pool for self-hosted TeraBox extraction (shadow mode).

- Reads ONLY from env: COOKIE_POOL_JSON (preferred), COOKIE_JSON, TERABOX_NDUS.
- Never logs or returns raw cookie values in diagnostics (hashes only).
- Round-robin + temporary blacklist for cookies that hit errno 400141/-21.
- Zero changes to existing extractors; they opt-in by calling next_cookie_header().
"""
from __future__ import annotations

import hashlib
import itertools
import json
import os
import threading

_lock = threading.Lock()
_pool: list[str] = []
_bad_hashes: set[str] = set()
_cursor = itertools.count()


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]


def _parse_one(raw: str) -> str | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    # Accept {"ndus": "..."} or raw "ndus=..." or bare token
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            ndus = parsed.get("ndus", "")
            if ndus:
                return f"ndus={ndus}; lang=en;"
            # generic dict of cookies
            parts = [f"{k}={v}" for k, v in parsed.items() if v]
            return "; ".join(parts) if parts else None
        if isinstance(parsed, str) and parsed.strip():
            raw = parsed.strip()
    except (json.JSONDecodeError, ValueError):
        pass
    if "ndus=" in raw or "=" in raw:
        return raw if raw.endswith(";") else raw + (";" if ";" in raw else "; lang=en;")
    return f"ndus={raw}; lang=en;"


def _load_from_env() -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def _add(header: str | None) -> None:
        if not header:
            return
        h = _hash(header)
        if h not in seen:
            seen.add(h)
            out.append(header)

    pool_raw = os.environ.get("COOKIE_POOL_JSON", "").strip()
    if pool_raw:
        try:
            parsed = json.loads(pool_raw)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        _add(_parse_one(json.dumps(item)))
                    else:
                        _add(_parse_one(str(item)))
            elif isinstance(parsed, dict):
                _add(_parse_one(json.dumps(parsed)))
            else:
                _add(_parse_one(str(parsed)))
        except (json.JSONDecodeError, ValueError):
            # Fallback: semicolon-separated raw headers
            for chunk in pool_raw.split(";;"):
                _add(_parse_one(chunk))

    # Legacy single-cookie envs (kept for backward compat, lowest priority)
    for key in ("COOKIE_JSON", "TERABOX_NDUS"):
        _add(_parse_one(os.environ.get(key, "")))

    return out


def refresh() -> int:
    """Reload pool from env. Returns pool size. Additive-only, safe to call anytime."""
    global _pool
    with _lock:
        _pool = _load_from_env()
        # Drop blacklist entries that no longer exist
        live = {_hash(h) for h in _pool}
        _bad_hashes.intersection_update(live)
        return len(_pool)


def _ensure_loaded() -> None:
    if not _pool:
        refresh()


def get_pool() -> list[str]:
    """Return a copy of configured headers (internal use; never log)."""
    _ensure_loaded()
    with _lock:
        return list(_pool)


def pool_size() -> int:
    _ensure_loaded()
    with _lock:
        return len(_pool)


def available_count() -> int:
    _ensure_loaded()
    with _lock:
        return sum(1 for h in _pool if _hash(h) not in _bad_hashes)


def next_cookie_header() -> str:
    """Round-robin next healthy cookie header, or '' when none configured."""
    _ensure_loaded()
    with _lock:
        healthy = [h for h in _pool if _hash(h) not in _bad_hashes]
        if not healthy:
            # All blacklisted -> allow retry of full pool rather than hard fail
            healthy = list(_pool)
        if not healthy:
            return ""
        idx = next(_cursor) % len(healthy)
        return healthy[idx]


def mark_bad(header: str) -> None:
    """Temporarily blacklist a cookie that hit verification/errno errors."""
    if not header:
        return
    with _lock:
        _bad_hashes.add(_hash(header))


def reset_bad() -> None:
    with _lock:
        _bad_hashes.clear()


def diagnostics() -> dict:
    """Safe diagnostics: counts + hashes only, NEVER raw values."""
    _ensure_loaded()
    with _lock:
        return {
            "size": len(_pool),
            "available": sum(1 for h in _pool if _hash(h) not in _bad_hashes),
            "hashes": [_hash(h) for h in _pool],
            "bad_hashes": sorted(_bad_hashes),
        }
