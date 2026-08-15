"""xAPIverse TeraBox extraction service.

Dedicated fallback extractor that resolves TeraBox share URLs through the
xAPIverse API (https://xapiverse.com/api/terabox). The API key is read ONLY
from the backend environment (`XAPIVERSE_API_KEY` in backend/.env) and is
never exposed to clients or logged.

Why a dedicated module:
  - Keeps third-party API calls out of server.py.
  - Centralises request construction, response validation, and the mapping
    of xAPIverse payloads into TeraPlayer's normalized preview shape.

Current behaviour (verified during integration):
  - xAPIverse extracts the TeraBox file successfully.
  - `normal_dlink` currently returns TeraBox errno=400141 ("need verify"), so
    it is NOT treated as a verified download URL. `download_url` is left
    `None` on purpose.
  - `fast_stream_url["480p"]` returns a valid HLS playlist (`.m3u8`) whose
    segments stream successfully, so that is preferred for `stream_url`.
  - HLS-to-MP4 conversion is intentionally out of scope for this step.

Security notes:
  - Never log the API key.
  - Never log generated download/stream tokens or full URLs that contain
    tokens. Error messages are deliberately kept free of URLs and raw
    upstream error text so nothing sensitive leaks into logs.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

XAPIVERSE_API_URL = "https://xapiverse.com/api/terabox"
XAPIVERSE_API_KEY = os.environ.get("XAPIVERSE_API_KEY", "")
XAPIVERSE_TIMEOUT = 30.0

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def is_configured() -> bool:
    """Whether a xAPIverse API key is available in the backend environment."""
    return bool(XAPIVERSE_API_KEY)


def _parse_duration(value: Any) -> int | None:
    """Parse a duration (seconds, or 'MM:SS'/'HH:MM:SS') into whole seconds."""
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        try:
            seconds = int(float(value))
        except (TypeError, ValueError):
            return None
        return seconds if seconds > 0 else None
    if isinstance(value, str):
        m = re.fullmatch(r"\s*(\d+):(\d{1,2}):(\d{1,2})\s*", value)
        if m:
            h, mm, ss = (int(g) for g in m.groups())
            seconds = h * 3600 + mm * 60 + ss
            return seconds if seconds > 0 else None
        m = re.fullmatch(r"\s*(\d+):(\d{1,2})\s*", value)
        if m:
            mm, ss = (int(g) for g in m.groups())
            seconds = mm * 60 + ss
            return seconds if seconds > 0 else None
        try:
            seconds = int(float(value))
        except (TypeError, ValueError):
            return None
        return seconds if seconds > 0 else None
    return None


def _parse_size(value: Any) -> int | None:
    """Parse a file size (int/str number) into an int, or None."""
    if value is None or value == "":
        return None
    try:
        size = int(value)
    except (TypeError, ValueError):
        return None
    return size if size > 0 else None


def _pick_stream_url(item: dict[str, Any]) -> str | None:
    """Choose the best verified streaming URL.

    Preference order:
      1. fast_stream_url["480p"] (verified HLS playlist)
      2. fast_stream_url["360p"]
      3. top-level stream_url

    `normal_dlink` is deliberately never used here: it is unverified and
    currently returns TeraBox errno=400141 ("need verify").
    """
    fast = item.get("fast_stream_url")
    if isinstance(fast, dict):
        for quality in ("480p", "360p"):
            candidate = fast.get(quality)
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
    top_level = item.get("stream_url")
    if isinstance(top_level, str) and top_level.strip():
        return top_level.strip()
    return None


def _guess_type(name: str) -> str | None:
    """Infer the file type from the extension (mirrors services/extractors)."""
    from .extractors import _guess_type as _extractors_guess_type

    return _extractors_guess_type(name)


def _human_size(num: int | None) -> str | None:
    """Format a byte count human-readably (mirrors services/extractors)."""
    from .extractors import human_size

    return human_size(num)


def _map_item(item: Any) -> dict[str, Any]:
    """Map one xAPIverse list item into the normalized preview file shape."""
    if not isinstance(item, dict):
        item = {}
    name = item.get("name") or "TeraBox File"
    size = _parse_size(item.get("size"))
    return {
        "name": name,
        "size": size,
        "size_str": item.get("size_formatted") or _human_size(size),
        "duration": _parse_duration(item.get("duration")),
        "resolution": item.get("quality") or None,
        "thumbnail": item.get("thumbnail") or None,
        "download_url": None,
        "stream_url": _pick_stream_url(item),
        "file_type": item.get("type") or _guess_type(name),
    }


async def extract_via_xapiverse(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """Resolve a TeraBox share URL through the xAPIverse API.

    Returns a normalized preview dict (same shape as the other extractors) or
    raises ValueError with a URL/token-free message so the orchestrator can
    fall through to the next extractor without leaking anything sensitive.
    """
    if not XAPIVERSE_API_KEY:
        raise ValueError("xapiverse: XAPIVERSE_API_KEY not configured")

    headers = dict(DEFAULT_HEADERS)
    headers["xAPIverse-Key"] = XAPIVERSE_API_KEY

    try:
        resp = await client.post(
            XAPIVERSE_API_URL,
            json={"url": url},
            headers=headers,
            timeout=XAPIVERSE_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.TimeoutException:
        raise ValueError("xapiverse: request timed out") from None
    except httpx.HTTPStatusError as exc:
        raise ValueError(f"xapiverse: HTTP {exc.response.status_code}") from None
    except httpx.HTTPError:
        raise ValueError("xapiverse: request failed") from None
    except ValueError:
        raise ValueError("xapiverse: malformed JSON response") from None

    if not isinstance(data, dict):
        raise ValueError("xapiverse: invalid response type")

    if data.get("status") != "success":
        raise ValueError("xapiverse: non-success response")

    lst = data.get("list")
    if not isinstance(lst, list) or not lst:
        raise ValueError("xapiverse: empty list")

    files = [_map_item(item) for item in lst]
    first = files[0]
    stream_url = first.get("stream_url")
    if not stream_url:
        raise ValueError("xapiverse: no stream URL in response")

    return {
        "ok": True,
        "source": "xapiverse",
        "title": first.get("name") or "TeraBox File",
        "size": first.get("size"),
        "size_str": first.get("size_str"),
        "duration": first.get("duration"),
        "resolution": first.get("resolution"),
        "thumbnail": first.get("thumbnail"),
        "download_url": None,
        "stream_url": stream_url,
        "file_type": first.get("file_type"),
        "files": files,
    }
