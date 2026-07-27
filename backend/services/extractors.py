"""TeraBox link extractors.

Provides multiple extraction strategies:
 1. Native HTTP scraping using httpx + selectolax
 2. Public 3rd-party API fallbacks (best-effort mirrors)

Each extractor returns a normalized dict:
{
  "ok": bool,
  "source": str,
  "title": str,
  "size": int | None,
  "size_str": str | None,
  "duration": int | None,
  "resolution": str | None,
  "thumbnail": str | None,
  "download_url": str | None,
  "stream_url": str | None,
  "file_type": str | None,
  "files": [ ... optional list for folders ... ]
}
"""
from __future__ import annotations

import os
import re
import logging
import asyncio
from typing import Any
from urllib.parse import urlparse, parse_qs

import httpx

logger = logging.getLogger(__name__)

CF_WORKER_URL = os.environ.get("TERABOX_WORKER_URL", "")

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

TERABOX_HOSTS = (
    "terabox.com",
    "www.terabox.com",
    "terabox.app",
    "www.terabox.app",
    "1024terabox.com",
    "www.1024terabox.com",
    "teraboxapp.com",
    "www.teraboxapp.com",
    "nephobox.com",
    "www.nephobox.com",
    "4funbox.com",
    "www.4funbox.com",
    "mirrobox.com",
    "www.mirrobox.com",
    "momerybox.com",
    "www.momerybox.com",
    "terasharelink.com",
    "www.terasharelink.com",
    "1024tera.com",
    "www.1024tera.com",
    "freeterabox.com",
    "www.freeterabox.com",
    "dm.terabox.com",
    "dm-jp.terabox.com",
    "dubox.com",
    "www.dubox.com",
)


def is_terabox_url(url: str) -> bool:
    """Validate that a URL points at a known TeraBox mirror."""
    try:
        p = urlparse(url.strip())
        if p.scheme not in ("http", "https"):
            return False
        host = (p.hostname or "").lower()
        return any(host == h or host.endswith("." + h) for h in TERABOX_HOSTS)
    except Exception:
        return False


def extract_share_id(url: str) -> str | None:
    """Extract the shorturl/share id from a TeraBox URL."""
    try:
        p = urlparse(url)
        qs = parse_qs(p.query or "")
        if "surl" in qs and qs["surl"]:
            return qs["surl"][0]
        m = re.search(r"/s/1?([A-Za-z0-9_\-]+)", p.path)
        if m:
            return m.group(1)
        m = re.search(r"/sharing/link\?surl=([A-Za-z0-9_\-]+)", url)
        if m:
            return m.group(1)
    except Exception:
        pass
    return None


def human_size(num: int | float | None) -> str | None:
    if num is None:
        return None
    try:
        n = float(num)
    except Exception:
        return None
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024.0:
            return f"{n:3.1f} {unit}"
        n /= 1024.0
    return f"{n:.1f} PB"


def _fmt_duration(seconds: int | float | None) -> str | None:
    if seconds is None:
        return None
    try:
        s = int(float(seconds))
    except Exception:
        return None
    if s <= 0:
        return None
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h:d}:{m:02d}:{sec:02d}"
    return f"{m:d}:{sec:02d}"


# ---------------------------------------------------------------------------
# Third-party public API extractors (best-effort mirrors)
# ---------------------------------------------------------------------------


async def _extract_via_teradl(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """teradl-app.vercel.app – community proxy.

    API changed from POST (json body) to GET (query params).
    """
    api = "https://teradl-api.vercel.app/api"
    params = {"url": url, "mode": 1}
    if password:
        params["pwd"] = password
    resp = await client.get(
        api,
        params=params,
        headers=DEFAULT_HEADERS,
        timeout=25.0,
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") == "error":
        raise ValueError(f"teradl error: {data.get('message', 'unknown error')}")

    files = data.get("list") or data.get("files") or []
    if not files:
        raise ValueError("teradl empty response")
    first = files[0]
    size = int(first.get("size") or 0) or None
    return {
        "ok": True,
        "source": "teradl",
        "title": first.get("name") or first.get("filename") or "TeraBox File",
        "size": size,
        "size_str": human_size(size),
        "duration": None,
        "resolution": None,
        "thumbnail": first.get("thumbs", {}).get("url3") if isinstance(first.get("thumbs"), dict) else first.get("image"),
        "download_url": first.get("dlink") or first.get("download_link") or first.get("url"),
        "stream_url": first.get("dlink") or first.get("url"),
        "file_type": _guess_type(first.get("name") or ""),
        "files": [
            {
                "name": f.get("name") or f.get("filename"),
                "size": int(f.get("size") or 0) or None,
                "size_str": human_size(int(f.get("size") or 0) or None),
                "download_url": f.get("dlink") or f.get("url"),
                "stream_url": f.get("dlink") or f.get("url"),
                "thumbnail": (f.get("thumbs") or {}).get("url3") if isinstance(f.get("thumbs"), dict) else f.get("image"),
                "file_type": _guess_type(f.get("name") or ""),
            }
            for f in files
        ],
    }


class PasswordError(Exception):
    """Raised by an extractor when the link is password-protected."""


PASSWORD_PHRASES = (
    "password required",
    "wrong password",
    "invalid password",
    "incorrect password",
    "need password",
    "password protected",
    "password error",
    "password wrong",
    "wrong pwd",
    "invalid pwd",
    "pwd invalid",
    "pwd required",
    "pwd wrong",
)


PASSWORD_ERRNO_DEFINITIVE = {-130, -9, 105, -105, 130, "-130", "-9", "105", "-105", "130"}


def _is_password_error(data: Any) -> bool:
    """Detect explicit password-related error signals from extractor JSON.

    Returns True if:
      - data is a dict with a known password errno, OR
      - data (any type) contains a known password phrase in its string repr
    """
    if isinstance(data, dict):
        errno = data.get("errno") or data.get("error_code") or data.get("code")
        if errno in PASSWORD_ERRNO_DEFINITIVE:
            return True
        # Fall through to text check for non-errno cases
    text = str(data).lower()
    return any(p in text for p in PASSWORD_PHRASES)


async def _extract_via_hnn(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """terabox.hnn.workers.dev – widely used community worker."""
    api = "https://terabox.hnn.workers.dev/api/get-info"
    resp = await client.get(api, params={"shorturl": _shortid_or_url(url), "pwd": password or ""}, headers=DEFAULT_HEADERS, timeout=25.0)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("ok"):
        if _is_password_error(data):
            raise PasswordError(f"hnn: {data}")
        raise ValueError(f"hnn error: {data}")
    lst = data.get("list") or []
    if not lst:
        raise ValueError("hnn empty list")
    first = lst[0]
    size = int(first.get("size") or 0) or None
    dl_api = "https://terabox.hnn.workers.dev/api/get-download"
    try:
        dl_resp = await client.post(
            dl_api,
            json={
                "shareid": data.get("shareid"),
                "uk": data.get("uk"),
                "sign": data.get("sign"),
                "timestamp": data.get("timestamp"),
                "fs_id": first.get("fs_id"),
            },
            headers=DEFAULT_HEADERS,
            timeout=25.0,
        )
        dl_data = dl_resp.json() if dl_resp.status_code == 200 else {}
        download_url = dl_data.get("downloadLink") or first.get("dlink")
    except Exception:
        download_url = first.get("dlink")

    return {
        "ok": True,
        "source": "hnn",
        "title": first.get("filename") or "TeraBox File",
        "size": size,
        "size_str": human_size(size),
        "duration": None,
        "resolution": None,
        "thumbnail": first.get("thumbs", {}).get("url3") if isinstance(first.get("thumbs"), dict) else None,
        "download_url": download_url,
        "stream_url": download_url,
        "file_type": _guess_type(first.get("filename") or ""),
        "files": [
            {
                "name": f.get("filename"),
                "size": int(f.get("size") or 0) or None,
                "size_str": human_size(int(f.get("size") or 0) or None),
                "download_url": f.get("dlink"),
                "stream_url": f.get("dlink"),
                "thumbnail": (f.get("thumbs") or {}).get("url3") if isinstance(f.get("thumbs"), dict) else None,
                "file_type": _guess_type(f.get("filename") or ""),
            }
            for f in lst
        ],
    }


async def _extract_via_wdzone(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """wdzone-terabox-api.vercel.app – community mirror."""
    api = "https://wdzone-terabox-api.vercel.app/api"
    resp = await client.get(api, params={"url": url}, headers=DEFAULT_HEADERS, timeout=25.0)
    resp.raise_for_status()
    data = resp.json()
    ed = data.get("Extracted Info") or data.get("extracted_info") or []
    if not ed:
        raise ValueError("wdzone empty")
    first = ed[0]
    size_str = first.get("Size") or first.get("size")
    return {
        "ok": True,
        "source": "wdzone",
        "title": first.get("Title") or first.get("title") or "TeraBox File",
        "size": None,
        "size_str": size_str,
        "duration": None,
        "resolution": None,
        "thumbnail": first.get("Thumbnails", {}).get("360x270") if isinstance(first.get("Thumbnails"), dict) else first.get("Thumbnail"),
        "download_url": first.get("Direct Download Link") or first.get("direct_link"),
        "stream_url": first.get("Direct Download Link") or first.get("direct_link"),
        "file_type": _guess_type(first.get("Title") or ""),
        "files": [
            {
                "name": f.get("Title") or f.get("title"),
                "size": None,
                "size_str": f.get("Size") or f.get("size"),
                "download_url": f.get("Direct Download Link") or f.get("direct_link"),
                "stream_url": f.get("Direct Download Link") or f.get("direct_link"),
                "thumbnail": (f.get("Thumbnails") or {}).get("360x270") if isinstance(f.get("Thumbnails"), dict) else f.get("Thumbnail"),
                "file_type": _guess_type(f.get("Title") or ""),
            }
            for f in ed
        ],
    }


# ---------------------------------------------------------------------------
# Native extractor (very best-effort; TeraBox blocks a lot server-side)
# ---------------------------------------------------------------------------


async def _extract_native(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """Attempt lightweight HTTP scraping for public metadata (thumbnail/title)."""
    resp = await client.get(url, headers=DEFAULT_HEADERS, follow_redirects=True, timeout=20.0)
    resp.raise_for_status()
    html = resp.text

    from selectolax.parser import HTMLParser

    tree = HTMLParser(html)
    title = None
    thumbnail = None

    og_title = tree.css_first('meta[property="og:title"]')
    if og_title:
        title = og_title.attributes.get("content")
    og_img = tree.css_first('meta[property="og:image"]')
    if og_img:
        thumbnail = og_img.attributes.get("content")

    if not title:
        t = tree.css_first("title")
        if t:
            title = t.text(strip=True)

    return {
        "ok": bool(title),
        "source": "native",
        "title": title or "TeraBox File",
        "size": None,
        "size_str": None,
        "duration": None,
        "resolution": None,
        "thumbnail": thumbnail,
        "download_url": None,
        "stream_url": None,
        "file_type": None,
        "files": [],
    }


# ---------------------------------------------------------------------------
# Free public API extractors (no cookies required)
# ---------------------------------------------------------------------------


async def _extract_via_savetube(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """ytshorts.savetube.me – free public terabox downloader API (no cookies)."""
    api = "https://ytshorts.savetube.me/api/v1/terabox-downloader"
    try:
        # Replace domain with what their API expects
        p = urlparse(url)
        url_clean = url.replace(p.netloc, "1024terabox.com")

        resp = await client.post(
            api,
            json={"url": url_clean},
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "Origin": "https://ytshorts.savetube.me",
                "Referer": "https://ytshorts.savetube.me/",
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        data = resp.json()
        responses = data.get("response") or []
        if not responses:
            raise ValueError("savetube: empty response")

        first = responses[0]
        resolutions = first.get("resolutions") or {}
        download_url = resolutions.get("Fast Download") or resolutions.get("HD Video") or ""
        stream_url = resolutions.get("HD Video") or resolutions.get("Fast Download") or ""

        # Get thumbnail from og:image by fetching the page
        thumbnail = first.get("thumbnail") or None

        # Get filename from HEAD request
        filename = first.get("filename") or first.get("file_name") or "TeraBox Video"

        return {
            "ok": True,
            "source": "savetube",
            "title": filename,
            "size": None,
            "size_str": None,
            "duration": None,
            "resolution": None,
            "thumbnail": thumbnail,
            "download_url": download_url,
            "stream_url": stream_url,
            "file_type": _guess_type(filename),
            "files": [
                {
                    "name": filename,
                    "size": None,
                    "size_str": None,
                    "download_url": download_url,
                    "stream_url": stream_url,
                    "thumbnail": thumbnail,
                    "file_type": _guess_type(filename),
                }
            ],
        }
    except Exception as exc:
        logger.warning(f"savetube extractor failed: {exc}")
        raise


# ---------------------------------------------------------------------------
# Playwright-based extractor (uses real browser to execute JS)
# Conditionally included in EXTRACTORS only when COOKIE_JSON is set.
# ---------------------------------------------------------------------------


async def _extract_via_playwright(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """Playwright-based TeraBox extractor.

    Uses a headless Chromium browser to execute JavaScript and extract
    dynamically-generated tokens (sign, timestamp, shareid, uk) that are
    NOT available through static HTML parsing.

    Requires Playwright with Chromium installed, AND a valid ndus cookie
    configured via the COOKIE_JSON environment variable.

    Without a valid ndus cookie, TeraBox's /share/list API returns errno=-21
    because sign/timestamp/shareid/uk are session-dependent tokens that
    require authenticated access.
    """
    pw_cookie = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS")
    if not pw_cookie:
        raise ValueError(
            "playwright: COOKIE_JSON not configured. "
            "A valid ndus cookie is required for Playwright-based extraction."
        )

    from .playwright_extractor import _extract_via_playwright as _pw_extract

    try:
        return await _pw_extract(url, client, password)
    except ImportError as exc:
        raise ValueError(f"playwright: Playwright not available ({exc})")
    except Exception as exc:
        raise ValueError(f"playwright: {exc}")


# ---------------------------------------------------------------------------
# Self-hosted Cloudflare Worker (primary extractor)


async def _extract_via_cf_worker(url: str, client: httpx.AsyncClient, password: str = "") -> dict[str, Any]:
    """Self-hosted Cloudflare Worker – runs TeraBox API extraction at the edge.

    Must be deployed separately (see cloudflare-worker/). The Worker URL is
    configured via the TERABOX_WORKER_URL env var. If unset, this extractor is
    skipped automatically.
    """
    if not CF_WORKER_URL:
        raise ValueError("cf_worker: TERABOX_WORKER_URL not configured")

    try:
        resp = await client.post(
            CF_WORKER_URL,
            json={"url": url, "password": password or ""},
            headers={
                "User-Agent": "TeraPlayer/1.0",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        if not isinstance(data, dict):
            raise ValueError("cf_worker: invalid response type")

        if data.get("password_required"):
            raise PasswordError(f"cf_worker: {data.get('error', 'password required')}")

        if not data.get("ok"):
            raise ValueError(f"cf_worker: {data.get('error', 'unknown error')}")

        if not data.get("download_url") and not data.get("stream_url"):
            raise ValueError("cf_worker: no direct link in response")

        # Ensure source is labelled correctly
        data["source"] = "cf_worker"
        return data

    except httpx.TimeoutException:
        raise ValueError("cf_worker: request timed out")
    except httpx.HTTPStatusError as exc:
        raise ValueError(f"cf_worker: HTTP {exc.response.status_code}")
    except PasswordError:
        raise
    except Exception as exc:
        raise ValueError(f"cf_worker: {exc}")


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


EXTRACTORS = [
    ("playwright", _extract_via_playwright),
    ("cf_worker", _extract_via_cf_worker),
    ("hnn", _extract_via_hnn),
    ("teradl", _extract_via_teradl),
    # ("savetube", _extract_via_savetube),  # Disabled: DNS for ytshorts.savetube.me no longer resolves
]


async def resolve_terabox(url: str, password: str = "") -> dict[str, Any]:
    """Try all extractors and return the first successful result.

    Returns the last error payload if all extractors fail.
    """
    last_error: str | None = None
    password_required = False
    async with httpx.AsyncClient(follow_redirects=True) as client:
        for name, fn in EXTRACTORS:
            try:
                logger.info("Trying extractor: %s", name)
                result = await fn(url, client, password)
                if result.get("ok") and (result.get("download_url") or result.get("stream_url")):
                    return result
                last_error = f"{name}: no direct link"
            except PasswordError as exc:
                password_required = True
                last_error = f"{name}: {exc}"
                logger.info("Extractor %s reports password protection: %s", name, exc)
                continue
            except Exception as exc:  # noqa: BLE001
                last_error = f"{name}: {exc}"
                logger.warning("Extractor %s failed: %s", name, exc)
                continue

        # If password protection was explicitly signalled, respond deterministically
        # so the client can prompt (or show "wrong password" if one was submitted).
        if password_required:
            return {
                "ok": False,
                "source": "hnn",
                "error": "Incorrect password. Please try again." if password else "This link is password protected.",
                "password_required": True,
                "password_incorrect": bool(password),
                "title": "Password required",
                "size": None,
                "size_str": None,
                "duration": None,
                "resolution": None,
                "thumbnail": None,
                "download_url": None,
                "stream_url": None,
                "file_type": None,
                "files": [],
            }

        # Native fallback for at least metadata (rarely useful, but graceful)
        try:
            native = await _extract_native(url, client, password)
            if native.get("ok"):
                native["ok"] = False
                native["error"] = last_error or "No direct download link available."
                native["password_required"] = False
                native["password_incorrect"] = False
                return native
        except Exception as exc:  # noqa: BLE001
            last_error = f"native: {exc}"

    # Determine the primary error reason
    pw_cookie = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS")
    cookie_hint = ""
    if not pw_cookie:
        cookie_hint = (
            "TeraBox now requires an authenticated session to extract files. "
            "Set COOKIE_JSON in your .env file with your ndus cookie "
            "(see .env.example for instructions)."
        )

    error_msg = " | ".join(filter(None, [last_error, cookie_hint])) or "All extractors failed"

    return {
        "ok": False,
        "source": "none",
        "error": error_msg,
        "password_required": False,
        "password_incorrect": False,
        "title": "Unavailable",
        "size": None,
        "size_str": None,
        "duration": None,
        "resolution": None,
        "thumbnail": None,
        "download_url": None,
        "stream_url": None,
        "file_type": None,
        "files": [],
    }


def _shortid_or_url(url: str) -> str:
    sid = extract_share_id(url)
    return sid or url


VIDEO_EXTS = {"mp4", "mkv", "avi", "mov", "webm", "flv", "m4v", "wmv", "ts", "mpeg", "mpg"}
IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif", "svg"}
AUDIO_EXTS = {"mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"}
DOC_EXTS = {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"}
ARCHIVE_EXTS = {"zip", "rar", "7z", "tar", "gz"}


def _guess_type(name: str) -> str | None:
    if not name or "." not in name:
        return None
    ext = name.rsplit(".", 1)[-1].lower()
    if ext in VIDEO_EXTS:
        return "video"
    if ext in IMAGE_EXTS:
        return "image"
    if ext in AUDIO_EXTS:
        return "audio"
    if ext in DOC_EXTS:
        return "document"
    if ext in ARCHIVE_EXTS:
        return "archive"
    return "file"
