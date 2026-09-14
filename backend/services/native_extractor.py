"""
Modern TeraBox Native Extractor - Complete Rewrite

This extractor implements the current TeraBox public share flow:
1. Fetch share page and extract all required authentication tokens
2. Call share/list API with full token set to get file metadata
3. Use get_download API (shareid, uk, sign, timestamp, fs_id) to obtain direct dlink
4. Resolve dlink redirects to final CDN URL
5. Fallback through multiple API endpoints automatically

External interface unchanged: extract_native(url, password="", cookie_json="")
Returns normalized dict matching extractors.py format.
"""

from __future__ import annotations

import os
import re
import json
import logging
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse, parse_qs, urlencode

import httpx
from dotenv import load_dotenv

from .extractors import (
    human_size,
    _guess_type,
    extract_share_id,
    DEFAULT_HEADERS,
    VIDEO_EXTS,
    IMAGE_EXTS,
    AUDIO_EXTS,
)

logger = logging.getLogger(__name__)

# Load environment
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)

# TeraBox domains to try (order matters - primary first)
TERABOX_DOMAINS = [
    "www.terabox.com",
    "www.1024terabox.com",
    "terabox.com",
    "1024tera.com",
    "teraboxapp.com",
    "nephobox.com",
    "freeterabox.com",
]

# API endpoints per domain
SHARE_LIST_ENDPOINT = "/share/list"
DOWNLOAD_ENDPOINT = "/api/download"

# App constants
APP_ID = "250528"
CHANNEL = "dubox"
CLIENTTYPE = "0"
WEB = "1"

# Password detection — must stay in sync with extractors.py
# Definitive errnos are password-only; ambiguous ones (also returned for
# dead/expired links, e.g. fake surl -> 105 with empty message) require
# password text in the message.
PASSWORD_ERRNO_DEFINITIVE = {-130, -9}
PASSWORD_ERRNO_AMBIGUOUS = {105, -105, 130}
PASSWORD_PHRASES = {
    "password required", "wrong password", "invalid password",
    "incorrect password", "need password", "password protected",
    "password error", "password wrong", "wrong pwd", "invalid pwd",
    "pwd invalid", "pwd required", "pwd wrong",
}


def _coerce_errno(errno: Any) -> Any:
    """Normalize upstream errno values: TeraBox flickers between int and
    numeric-string forms run to run (e.g. -9 vs "-9"). Coerce numeric
    strings to int so set-membership checks behave identically."""
    try:
        if isinstance(errno, bool):
            return errno
        if isinstance(errno, float):
            return int(errno)
        if isinstance(errno, str) and errno.strip().lstrip("+-").isdigit():
            return int(errno.strip())
    except (TypeError, ValueError):
        pass
    return errno


def _is_password_error(errno: int, errmsg: str) -> bool:
    """Determine if API response indicates password protection."""
    coerced = _coerce_errno(errno)
    if coerced in PASSWORD_ERRNO_DEFINITIVE:
        return True
    if coerced in PASSWORD_ERRNO_AMBIGUOUS:
        # Ambiguous errno: require password text, else it's a dead link.
        return any(p in (errmsg or "").lower() for p in PASSWORD_PHRASES)
    # Fallback: check raw errmsg for known password phrases
    return any(p in errmsg.lower() for p in PASSWORD_PHRASES) if errmsg else False


def _sanitize_log_url(url: str) -> str:
    """Strip credential-bearing query params (pwd/password) before logging."""
    try:
        from urllib.parse import parse_qsl, urlencode, urlunparse
        p = urlparse(url)
        if not p.query:
            return url
        keep = [(k, v) for k, v in parse_qsl(p.query) if k.lower() not in ("pwd", "password")]
        return urlunparse((p.scheme, p.netloc, p.path, p.params, urlencode(keep, doseq=True), p.fragment))
    except Exception:
        return url


def _log_request(label: str, url: str, method: str = "GET", **kwargs):
    """Structured request logging (sanitized; never forwards payloads)."""
    log_data = {
        "event": "request",
        "label": label,
        "url": _sanitize_log_url(url),
        "method": method,
    }
    logger.info(json.dumps(log_data, default=str))


def _log_response(label: str, url: str, status: int, data: Any, log_raw: bool = False):
    """Structured response logging with sanitized JSON (no raw payloads)."""
    log_data = {
        "event": "response",
        "label": label,
        "url": _sanitize_log_url(url),
        "status": status,
        "errno": data.get("errno") if isinstance(data, dict) else None,
        "errmsg": data.get("errmsg") or data.get("error_msg") if isinstance(data, dict) else None,
    }
    logger.info(json.dumps(log_data, default=str))


def _log_tokens(label: str, tokens: dict):
    """Log which tokens were extracted, never their values."""
    logger.info(json.dumps({
        "event": "tokens_extracted",
        "label": label,
        "jsToken": bool(tokens.get("js_token")),
        "sign": bool(tokens.get("sign")),
        "shareid": bool(tokens.get("shareid")),
        "uk": bool(tokens.get("uk")),
        "timestamp": bool(tokens.get("timestamp")),
        "bdstoken": bool(tokens.get("bdstoken")),
        "shorturl": bool(tokens.get("shorturl")),
        "surl": bool(tokens.get("surl")),
        "domain": tokens.get("domain"),
    }, default=str))


def _build_cookie_header(cookie_json: str = "") -> str:
    """Build Cookie header from COOKIE_JSON env or parameter."""
    if not cookie_json:
        cookie_json = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS") or ""

    if not cookie_json:
        return ""

    try:
        parsed = json.loads(cookie_json)
        ndus = parsed.get("ndus") if isinstance(parsed, dict) else str(parsed)
    except (json.JSONDecodeError, ValueError):
        # Try to extract ndus from raw string
        ndus = None
        if "ndus=" in cookie_json:
            match = re.search(r"ndus=([^;]+)", cookie_json)
            ndus = match.group(1) if match else cookie_json.strip()

    if ndus:
        return f"ndus={ndus}; lang=en;"
    return ""


def _normalize_surl(surl: str) -> str:
    """Remove leading '1' from surl if present."""
    surl = surl.strip()
    return surl[1:] if surl.startswith("1") else surl


class TokenExtractor:
    """Extracts authentication tokens from TeraBox share page HTML."""

    # Modern token patterns (ordered by reliability)
    # Each pattern handles: inline JS, escaped JSON in HTML, single/double quotes, whitespace variations
    PATTERNS = {
        "js_token": [
            # Standard inline JS
            r'window\.jsToken\s*=\s*fn\s*\(\s*["\']([^"\']+)["\']',
            # URL-encoded in HTML
            r'fn%28%22([^%]+)%22%29',
            # fn("token") with various spacing
            r'fn\(\s*["\']([^"\']+)["\']',
            # JSON-encoded
            r'jsToken["\']?\s*[:=]\s*["\']?fn\s*\(\s*["\']([^"\']+)["\']',
            # In script tags with escaped quotes
            r'jsToken["\']?\s*[:=]\s*["\']fn\(["\']([^"\']+)["\']\)["\']',
        ],
        "sign": [
            r'window\.sign\s*=\s*["\']([^"\']+)["\']',
            r'"sign"\s*:\s*"([^"]+)"',
            r"'sign'\s*:\s*'([^']+)'",
            r'sign%22%3A%22([^%]+)%22',
            # Escaped in script
            r'\\"sign\\"\s*:\s*\\"([^\\"]+)\\"',
        ],
        "timestamp": [
            r'window\.timestamp\s*=\s*["\']?(\d+)["\']?',
            r'"timestamp"\s*:\s*(\d+)',
            r"'timestamp'\s*:\s*'(\d+)'",
            r'\\"timestamp\\"\s*:\s*(\d+)',
        ],
        "shareid": [
            r'window\.shareid\s*=\s*["\']?(\d+)["\']?',
            r'"shareid"\s*:\s*(\d+)',
            r"'shareid'\s*:\s*'(\d+)'",
            r'shareid%22%3A(\d+)',
            r'\\"shareid\\"\s*:\s*(\d+)',
        ],
        "uk": [
            r'window\.uk\s*=\s*["\']?(\d+)["\']?',
            r'"uk"\s*:\s*(\d+)',
            r"'uk'\s*:\s*'(\d+)'",
            r'uk%22%3A(\d+)',
            r'\\"uk\\"\s*:\s*(\d+)',
        ],
        "bdstoken": [
            r'window\.bdstoken\s*=\s*["\']([^"\']+)["\']',
            r'"bdstoken"\s*:\s*"([^"]+)"',
            r"'bdstoken'\s*:\s*'([^']+)'",
            r'bdstoken%22%3A%22([^%]+)%22',
            r'\\"bdstoken\\"\s*:\s*\\"([^\\"]+)\\"',
        ],
        "shorturl": [
            r'window\.shorturl\s*=\s*["\']([^"\']+)["\']',
            r'"shorturl"\s*:\s*"([^"]+)"',
            r"'shorturl'\s*:\s*'([^']+)'",
            r'\\"shorturl\\"\s*:\s*\\"([^\\"]+)\\"',
        ],
    }

    # OpenGraph/meta patterns
    META_PATTERNS = {
        "og_title": [
            r'og:title["\']\s+content=["\']([^"\']+)["\']',
            r'property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
            r'name=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
        ],
        "og_image": [
            r'og:image["\']\s+content=["\']([^"\']+)["\']',
            r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            r'name=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
        ],
    }

    @classmethod
    def extract_all(cls, html: str) -> dict[str, Optional[str]]:
        """Extract all tokens from HTML with fallback strategies."""
        tokens = {}

        # Strategy 1: Standard regex patterns
        for key, patterns in cls.PATTERNS.items():
            tokens[key] = None
            for pattern in patterns:
                match = re.search(pattern, html)
                if match:
                    tokens[key] = match.group(1)
                    break

        # Strategy 2: If standard patterns fail, try extracting from JSON-LD or embedded JSON
        if not tokens.get("js_token"):
            # Look for JSON data in script tags
            json_tokens = cls._extract_from_json_scripts(html)
            for k, v in json_tokens.items():
                if v and not tokens.get(k):
                    tokens[k] = v

        # Meta tags
        for key, patterns in cls.META_PATTERNS.items():
            tokens[key] = None
            for pattern in patterns:
                match = re.search(pattern, html)
                if match:
                    tokens[key] = match.group(1)
                    break

        # Fallback: title tag
        if not tokens.get("og_title"):
            match = re.search(r"<title>([^<]+)</title>", html)
            if match:
                tokens["og_title"] = match.group(1).strip()

        # dp-logid
        match = re.search(r"dp-logid=([^&\"']+)", html)
        tokens["dp_logid"] = match.group(1) if match else None

        return tokens

    @classmethod
    def _extract_from_json_scripts(cls, html: str) -> dict[str, Optional[str]]:
        """Extract tokens from JSON embedded in script tags."""
        tokens = {}
        # Find all script tags
        script_pattern = r'<script[^>]*>(.*?)</script>'
        for script_match in re.finditer(script_pattern, html, re.DOTALL):
            script_content = script_match.group(1)
            # Try to find JSON objects with our keys
            json_pattern = r'\{[^}]*(?:"(?:sign|timestamp|shareid|uk|bdstoken|shorturl|jsToken)"\s*:\s*"[^"]*")[^}]*\}'
            for json_match in re.finditer(json_pattern, script_content):
                try:
                    json_str = json_match.group(0)
                    data = json.loads(json_str)
                    for key in ("sign", "timestamp", "shareid", "uk", "bdstoken", "shorturl", "jsToken"):
                        if key in data and data[key]:
                            tokens[key] = str(data[key])
                except (json.JSONDecodeError, ValueError):
                    continue
        return tokens


async def _fetch_share_page(
    client: httpx.AsyncClient,
    surl: str,
    password: str,
    cookie_header: str,
    domain: str,
) -> tuple[Optional[str], Optional[dict]]:
    """Fetch share page and return (final_url, tokens_dict).
    
    Returns tokens even if some modern tokens are missing.
    Only returns None if HTML could not be downloaded.
    """
    pwd_param = f"&pwd={password}" if password else ""
    urls_to_try = [
        f"https://{domain}/sharing/link?surl={surl}{pwd_param}",
        f"https://{domain}/s/{surl}",
    ]

    headers = {**DEFAULT_HEADERS}
    if cookie_header:
        headers["Cookie"] = cookie_header

    for url in urls_to_try:
        try:
            _log_request("fetch_share_page", url, headers={k: v for k, v in headers.items() if k != "Cookie"})
            resp = await client.get(url, headers=headers, follow_redirects=True, timeout=20.0)
            _log_response("fetch_share_page", str(resp.url), resp.status_code, {})

            if resp.status_code != 200:
                logger.debug(f"HTTP {resp.status_code} for {url}")
                continue

            html = resp.text
            final_url = str(resp.url)

            # Extract surl from final URL
            parsed = urlparse(final_url)
            extracted_surl = parse_qs(parsed.query).get("surl", [None])[0]
            if extracted_surl:
                surl = _normalize_surl(extracted_surl)

            # Use enhanced token extraction
            tokens = TokenExtractor.extract_all(html)
            tokens["surl"] = surl
            tokens["domain"] = domain

            # Check which critical tokens are missing
            missing_tokens = []
            for token_name in ("js_token", "sign", "timestamp", "shareid", "uk", "bdstoken"):
                if not tokens.get(token_name):
                    missing_tokens.append(token_name)

# Log which tokens are missing/available (names only, never values)
                if missing_tokens:
                    logger.warning(
                        f"Missing tokens on {domain}: {', '.join(missing_tokens)}. "
                        f"Available: {[k for k, v in tokens.items() if v]}"
                    )

            # CRITICAL FIX: Return tokens even if modern tokens are missing
            # Only fail if js_token is missing (required for share/list API)
            if not tokens.get("js_token"):
                logger.warning(f"jsToken not found on {domain}, trying next URL/domain")
                continue

            _log_tokens(domain, tokens)
            return final_url, tokens

        except Exception as e:
            logger.debug(f"Failed to fetch {url}: {e}")
            continue

    return None, None


async def _call_share_list(
    client: httpx.AsyncClient,
    tokens: dict,
    cookie_header: str,
) -> Optional[dict]:
    """Call share/list API with full token set."""
    params = {
        "app_id": APP_ID,
        "web": WEB,
        "channel": CHANNEL,
        "clienttype": CLIENTTYPE,
        "jsToken": tokens["js_token"],
        "shorturl": tokens["surl"],
        "root": "1",
        "page": "1",
        "num": "100",
        "by": "name",
        "order": "asc",
    }

    # Add all available modern tokens
    for key in ("sign", "timestamp", "shareid", "uk", "bdstoken"):
        if tokens.get(key):
            params[key] = tokens[key]

    if tokens.get("dp_logid"):
        params["dp-logid"] = tokens["dp_logid"]

    headers = {
        **DEFAULT_HEADERS,
        "Accept": "application/json, text/plain, */*",
        "Referer": f"https://{tokens['domain']}/sharing/link?surl={tokens['surl']}",
    }
    if cookie_header:
        headers["Cookie"] = cookie_header

    # Try multiple API domains
    api_domains = [
        tokens["domain"],
        "www.terabox.com",
        "www.1024tera.com",
        "dm.terabox.app",
    ]

    for api_domain in api_domains:
        url = f"https://{api_domain}{SHARE_LIST_ENDPOINT}"
        try:
            _log_request("share_list", url, params=params)
            resp = await client.get(url, params=params, headers=headers, timeout=20.0)

            if resp.status_code != 200:
                _log_response("share_list", str(resp.url), resp.status_code, {"http_status": resp.status_code})
                continue

            data = resp.json()
            _log_response("share_list", str(resp.url), resp.status_code, data, log_raw=True)

            errno = _coerce_errno(data.get("errno", -1))
            errmsg = data.get("errmsg") or data.get("error_msg") or ""

            if errno == 0:
                if data.get("list"):
                    return data
                # Empty list - try next domain
                continue

            if _is_password_error(errno, errmsg):
                return {"error": "password_required", "errno": errno, "errmsg": errmsg}

            # Other error - try next domain
            logger.warning(f"share/list error on {api_domain}: errno={errno} {errmsg}")
            continue

        except Exception as e:
            logger.debug(f"share/list failed on {api_domain}: {e}")
            continue

    return None


async def _call_get_download(
    client: httpx.AsyncClient,
    tokens: dict,
    fs_id: str,
    cookie_header: str,
) -> Optional[str]:
    """Call get_download API to obtain direct dlink."""
    # Require all modern tokens
    required = ("shareid", "uk", "sign", "timestamp")
    if not all(tokens.get(k) for k in required):
        logger.debug("Missing required tokens for get_download API")
        return None

    body = {
        "app_id": APP_ID,
        "web": WEB,
        "channel": CHANNEL,
        "clienttype": CLIENTTYPE,
        "jsToken": tokens["js_token"],
        "shareid": tokens["shareid"],
        "uk": tokens["uk"],
        "sign": tokens["sign"],
        "timestamp": tokens["timestamp"],
        "fs_id": fs_id,
        "bdstoken": tokens.get("bdstoken", ""),
    }

    headers = {
        **DEFAULT_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": f"https://{tokens['domain']}/sharing/link?surl={tokens['surl']}",
    }
    if cookie_header:
        headers["Cookie"] = cookie_header

    api_domains = [
        tokens["domain"],
        "www.terabox.com",
        "www.1024tera.com",
    ]

    for api_domain in api_domains:
        url = f"https://{api_domain}{DOWNLOAD_ENDPOINT}"
        try:
            _log_request("get_download", url, method="POST", body=body)
            resp = await client.post(
                url,
                data=urlencode(body),
                headers=headers,
                timeout=20.0,
            )

            if resp.status_code != 200:
                continue

            data = resp.json()
            _log_response("get_download", str(resp.url), resp.status_code, data, log_raw=True)

            errno = _coerce_errno(data.get("errno"))
            errmsg = data.get("errmsg") or data.get("error_msg") or ""

            if errno == 0:
                dlink = data.get("dlink") or data.get("download_link") or data.get("url")
                if dlink:
                    logger.info(f"Got direct dlink from {api_domain}")
                    return dlink

            if _is_password_error(errno, errmsg):
                return "password_required"

        except Exception as e:
            logger.debug(f"get_download failed on {api_domain}: {e}")
            continue

    return None


async def _resolve_dlink(
    client: httpx.AsyncClient,
    dlink: str,
    cookie_header: str,
) -> str:
    """Follow redirects to final CDN URL (HEAD then GET)."""
    headers = {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Referer": "https://www.terabox.com/",
    }
    if cookie_header:
        headers["Cookie"] = cookie_header

    try:
        _log_request("resolve_dlink", dlink, method="HEAD")
        resp = await client.head(dlink, headers=headers, follow_redirects=True, timeout=15.0)
        _log_response("resolve_dlink", str(resp.url), resp.status_code, {})
        if resp.status_code < 400:
            return str(resp.url)
    except Exception:
        pass

    try:
        _log_request("resolve_dlink", dlink, method="GET")
        resp = await client.get(dlink, headers=headers, follow_redirects=True, timeout=15.0)
        _log_response("resolve_dlink", str(resp.url), resp.status_code, {})
        if resp.status_code < 400:
            return str(resp.url)
    except Exception:
        pass

    return dlink


def _normalize_file(item: dict, tokens: dict) -> dict:
    """Normalize file item from API response."""
    name = item.get("server_filename") or item.get("filename") or "Unknown"
    size = int(item.get("size", 0)) or None
    is_dir = item.get("isdir") == "1"

    thumbs = item.get("thumbs") or {}
    thumbnail = (
        thumbs.get("url3")
        or thumbs.get("url2")
        or thumbs.get("url1")
        or tokens.get("og_image")
    )

    return {
        "name": name,
        "size": size,
        "size_str": human_size(size),
        "duration": None,
        "resolution": None,
        "thumbnail": thumbnail,
        "download_url": item.get("dlink") or "",
        "stream_url": item.get("dlink") or "",
        "file_type": _guess_type(name),
        "isdir": is_dir,
        "path": item.get("path", ""),
        "fs_id": item.get("fs_id", ""),
    }


def _make_error_response(
    error: str,
    tokens: Optional[dict] = None,
    password: str = "",
    password_required: bool = False,
    password_incorrect: bool = False,
) -> dict:
    """Build standardized error response."""
    return {
        "ok": False,
        "source": "native",
        "error": error,
        "password_required": password_required,
        "password_incorrect": password_incorrect,
        "title": tokens.get("og_title") if tokens else "TeraBox File",
        "size": None,
        "size_str": None,
        "duration": None,
        "resolution": None,
        "thumbnail": tokens.get("og_image") if tokens else None,
        "download_url": None,
        "stream_url": None,
        "file_type": None,
        "files": [],
    }


async def extract_native(
    url: str,
    password: str = "",
    cookie_json: str = "",
) -> dict[str, Any]:
    """
    Main extraction function - modern TeraBox flow.

    Returns normalized dict matching extractors.py format.
    """
    surl = extract_share_id(url)
    if not surl:
        return _make_error_response("Could not extract share ID from URL")

    surl = _normalize_surl(surl)
    cookie_header = _build_cookie_header(cookie_json)

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        # Step 1: Fetch share page and extract all tokens
        final_url = None
        tokens = None

        for domain in TERABOX_DOMAINS:
            final_url, tokens = await _fetch_share_page(client, surl, password, cookie_header, domain)
            if tokens and tokens.get("js_token"):
                break

        if not tokens or not tokens.get("js_token"):
            return _make_error_response(
                "Could not fetch TeraBox share page or extract authentication tokens. "
                "The link may be invalid, expired, or require a valid cookie."
            )

        # Step 2: Call share/list API
        share_list_data = await _call_share_list(client, tokens, cookie_header)

        if not share_list_data:
            return _make_error_response(
                "TeraBox API did not return file data. The link may require a cookie for access.",
                tokens=tokens,
            )

        if share_list_data.get("error") == "password_required":
            return _make_error_response(
                "Password-protected links are not supported.",
                tokens=tokens,
                password_required=True,
                password_incorrect=bool(password),
            )

        # Step 3: Process file list
        raw_files = share_list_data.get("list", [])
        if not raw_files:
            return _make_error_response("No files found in the TeraBox share.", tokens=tokens)

        files = [_normalize_file(f, tokens) for f in raw_files]

        # Step 4: Find primary file (first video, else first file)
        video_files = [f for f in files if f["file_type"] == "video"]
        primary = video_files[0] if video_files else files[0]

        # Step 5: Get direct download URL via get_download API (preferred)
        # This requires modern tokens (shareid, uk, sign, timestamp)
        dlink = None
        if primary.get("fs_id"):
            dlink = await _call_get_download(client, tokens, primary["fs_id"], cookie_header)

            if dlink == "password_required":
                return _make_error_response(
                    "Password-protected links are not supported.",
                    tokens=tokens,
                    password_required=True,
                    password_incorrect=bool(password),
                )

        # Step 6: Fallback to dlink from share/list if get_download didn't work
        if not dlink and primary.get("download_url"):
            dlink = primary["download_url"]

        # Step 7: Resolve dlink to final CDN URL
        final_url_resolved = None
        if dlink:
            final_url_resolved = await _resolve_dlink(client, dlink, cookie_header)
            logger.info("Resolved final CDN URL")

        # Step 8: Validate we have a working URL
        if not final_url_resolved:
            return _make_error_response(
                "Could not obtain valid download URL. The file may be unavailable or require authentication.",
                tokens=tokens,
            )

        # Update primary with resolved URLs
        primary["download_url"] = final_url_resolved
        primary["stream_url"] = final_url_resolved

        # Update all files with resolved URLs (for folder support)
        for f in files:
            if f.get("fs_id") == primary["fs_id"]:
                f["download_url"] = final_url_resolved
                f["stream_url"] = final_url_resolved

        return {
            "ok": True,
            "source": "native",
            "title": tokens.get("og_title") or primary["name"],
            "size": primary["size"],
            "size_str": primary["size_str"],
            "duration": primary["duration"],
            "resolution": primary["resolution"],
            "thumbnail": primary["thumbnail"] or tokens.get("og_image"),
            "download_url": final_url_resolved,
            "stream_url": final_url_resolved,
            "file_type": primary["file_type"],
            "files": files,
        }