"""Self-hosted TeraBox compat API layer (additive, shadow mode).

Provides xAPIverse-compatible JSON mapping + signed fast_stream tokens
so the frontend can switch from paid xAPIverse to our own backend
with a one-line base-URL change.

Shadow-mode guarantees:
- No changes to existing extractors, routes, or frontend.
- No secrets logged; tokens are opaque HMAC-signed blobs.
- All functions are pure except extract_self() which delegates to
  services.extractors.resolve_terabox (lazy import, no cycles).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any
from urllib.parse import quote

SELF_API_ENABLED = (os.environ.get("SELF_API_ENABLED", "true").strip().lower() not in ("0", "false", "no", "off"))
ALLOW_XAPIVERSE_FALLBACK = os.environ.get("ALLOW_XAPIVERSE_FALLBACK", "true").strip().lower() not in (
    "0", "false", "no", "off",
)
FAST_STREAM_TTL_SECONDS = int(os.environ.get("FAST_STREAM_TTL", "21600") or 21600)

_QUALITIES = ("360p", "480p")


def _secret() -> str:
    return os.environ.get("EXTENSION_HMAC_SECRET") or os.environ.get("FAST_STREAM_SECRET") or "teraplayer-dev-only"


def fmt_duration(seconds: Any) -> str | None:
    """Format seconds as MM:SS / H:MM:SS to match xAPIverse `duration` field."""
    try:
        if seconds is None:
            return None
        s = int(float(seconds))
    except (TypeError, ValueError):
        return None
    if s <= 0:
        return None
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h:02d}:{m:02d}:{sec:02d}"
    return f"{m:02d}:{sec:02d}"


def _b64e(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64d(token: str) -> bytes:
    pad = "=" * (-len(token) % 4)
    return base64.urlsafe_b64decode(token + pad)


def sign_fast_stream(surl: str, fs_id: str, quality: str, secret: str | None = None, ttl_seconds: int | None = None) -> str:
    """Create opaque fast_stream token: body.sig (HMAC-SHA256, no plaintext IDs)."""
    sec = secret or _secret()
    ttl = FAST_STREAM_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    body = {"surl": surl, "fs_id": str(fs_id), "q": quality, "exp": int(time.time()) + int(ttl)}
    raw = json.dumps(body, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(sec.encode("utf-8"), raw, hashlib.sha256).digest()
    return f"{_b64e(raw)}.{_b64e(sig)}"


def verify_fast_stream(token: str, secret: str | None = None) -> dict | None:
    """Verify token, return {surl, fs_id, quality, exp} or None."""
    try:
        sec = secret or _secret()
        body_b64, sig_b64 = token.split(".", 1)
        raw = _b64d(body_b64)
        sig = _b64d(sig_b64)
        expected = hmac.new(sec.encode("utf-8"), raw, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(raw.decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        surl = str(payload.get("surl", "")).strip()
        fs_id = str(payload.get("fs_id", "")).strip()
        quality = str(payload.get("q", "480p")).strip()
        if not surl or not fs_id:
            return None
        if quality not in _QUALITIES and quality not in ("720p", "1080p", "4k"):
            quality = "480p"
        return {"surl": surl, "fs_id": fs_id, "quality": quality, "exp": int(payload["exp"])}
    except Exception:
        return None


def build_fast_stream_url(base_url: str, surl: str, fs_id: str, quality: str) -> str:
    token = sign_fast_stream(surl, fs_id, quality)
    base = (base_url or "").rstrip("/")
    return f"{base}/api/fast_stream?token={quote(token, safe='')}"


def _surl_for_file(file: dict, fallback_title: str = "") -> str:
    for key in ("surl", "shorturl", "share_id"):
        val = file.get(key)
        if val:
            return str(val)
    # Fallback: hash of name so token is still unique per file (resolved
    # server-side via cache lookup by fs_id when surl unknown).
    seed = str(file.get("fs_id") or file.get("name") or fallback_title or "x")
    return "f" + hashlib.sha256(seed.encode("utf-8")).hexdigest()[:11]


def to_xapi_compat(preview: dict[str, Any], base_url: str) -> dict[str, Any]:
    """Map internal PreviewResponse dict to xAPIverse-compatible JSON."""
    if not isinstance(preview, dict):
        return {"status": "error", "error": "invalid preview", "total_files": 0, "list": []}
    if preview.get("password_required"):
        return {
            "status": "error",
            "error": "Password-protected links are not supported.",
            "password_required": True,
            "password_incorrect": bool(preview.get("password_incorrect")),
            "total_files": 0,
            "list": [],
        }
    if not preview.get("ok"):
        return {
            "status": "error",
            "error": preview.get("error") or "extraction failed",
            "password_required": bool(preview.get("password_required")),
            "password_incorrect": bool(preview.get("password_incorrect")),
            "total_files": 0,
            "list": [],
        }
    files = preview.get("files") or []
    items: list[dict[str, Any]] = []
    for f in files:
        if not isinstance(f, dict):
            continue
        fs_id = str(f.get("fs_id") or f.get("name") or len(items))
        surl = _surl_for_file(f, preview.get("title", ""))
        duration_secs = f.get("duration")
        # files[] may already carry formatted duration from some extractors
        if isinstance(duration_secs, str):
            try:
                from .xapiverse import _parse_duration as _pd

                duration_secs = _pd(duration_secs)
            except Exception:
                duration_secs = None
        items.append(
            {
                "fs_id": fs_id,
                "name": f.get("name") or preview.get("title") or "TeraBox File",
                "file_path": f.get("path") or f.get("file_path") or "",
                "size": f.get("size"),
                "size_formatted": f.get("size_str"),
                "type": f.get("file_type"),
                "is_dir": "1" if f.get("isdir") else "0",
                "duration": fmt_duration(duration_secs),
                "quality": f.get("resolution"),
                "thumbnail": f.get("thumbnail") or preview.get("thumbnail"),
                "normal_dlink": f.get("download_url") or preview.get("download_url"),
                "stream_url": f.get("stream_url") or preview.get("stream_url"),
                "fast_stream_url": {
                    q: build_fast_stream_url(base_url, surl, fs_id, q) for q in _QUALITIES
                },
            }
        )
    return {
        "status": "success",
        "total_files": len(items),
        "list": items,
        "source": preview.get("source") or "self",
    }


async def extract_self(url: str, password: str = "", resolver=None) -> dict[str, Any]:
    """Shadow-mode orchestrator wrapper. Delegates to resolve_terabox.

    `resolver` is injectable for tests (defaults to lazy-imported
    services.extractors.resolve_terabox). Never raises: returns error dict.
    """
    try:
        if resolver is None:
            from .extractors import resolve_terabox as _resolve

            resolver = _resolve
        result = await resolver(url, password=password or "")
        if not isinstance(result, dict):
            return {"ok": False, "source": "self", "error": "invalid resolver result", "files": []}
        result.setdefault("source", "self")
        return result
    except Exception as exc:  # noqa: BLE001 - shadow mode must never crash routes
        return {"ok": False, "source": "self", "error": f"self extraction failed: {type(exc).__name__}", "files": []}


def rewrite_m3u8(playlist: str, segment_base: str, token: str = "") -> str:
    """Rewrite relative segment URIs to absolute proxied URLs.

    Keeps #EXT* tags untouched; only rewrites non-empty, non-comment lines.
    """
    out: list[str] = []
    base = segment_base.rstrip("/")
    for line in (playlist or "").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            out.append(line)
            continue
        if stripped.startswith(("http://", "https://")):
            out.append(line)
            continue
        if token:
            out.append(f"{base}/api/stream?url={quote(stripped, safe='')}&fst={quote(token, safe='')}")
        else:
            out.append(f"{base}/api/stream?url={quote(stripped, safe='')}")
    return "\n".join(out) + ("\n" if out else "")


def self_health() -> dict[str, Any]:
    """Safe health payload (counts only, never secret values)."""
    try:
        from . import cookie_pool

        cookies = cookie_pool.diagnostics()
    except Exception:
        cookies = {"size": 0, "available": 0}
    return {
        "ok": True,
        "primary": "self",
        "self_enabled": SELF_API_ENABLED,
        "xapiverse_fallback_allowed": ALLOW_XAPIVERSE_FALLBACK,
        "cookie_pool": cookies,
        "fast_stream_ttl": FAST_STREAM_TTL_SECONDS,
    }
