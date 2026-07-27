"""
Playwright-based TeraBox Extractor

Uses a headless Chromium browser (via Playwright) to:
1. Load the TeraBox share page with optional ndus cookie
2. Execute JavaScript to get dynamically-generated tokens
3. Extract sign, timestamp, shareid, uk from the browser context
4. Call the TeraBox API with complete parameters
5. Return normalized file data

This replaces the broken static-HTML extraction approach that cannot
obtain JS-generated tokens (sign, timestamp, shareid, uk).
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Optional

import httpx
from playwright.async_api import async_playwright

from .extractors import (
    human_size,
    _guess_type,
    extract_share_id,
    DEFAULT_HEADERS,
)

logger = logging.getLogger(__name__)

# TeraBox domains to try (order matters - primary first)
TERABOX_DOMAINS = [
    "www.1024tera.com",
    "www.1024terabox.com",
    "www.terabox.com",
    "1024terabox.com",
    "terabox.com",
]

# API endpoints
SHARE_LIST_ENDPOINT = "/share/list"
DOWNLOAD_ENDPOINT = "/api/download"

# App constants
APP_ID = "250528"
CHANNEL = "dubox"
CLIENTTYPE = "0"
WEB = "1"


async def _extract_via_playwright(
    url: str,
    client: httpx.AsyncClient,
    password: str = "",
) -> dict[str, Any]:
    """Playwright-based TeraBox extractor.

    Falls back to native extraction if Playwright fails.
    Uses COOKIE_JSON env var for optional ndus cookie.
    """
    surl = extract_share_id(url)
    if not surl:
        raise ValueError("Could not extract share ID from URL")

    # Normalize surl (remove leading '1')
    surl = surl[1:] if surl.startswith("1") else surl

    # Get cookie from env
    cookie_json = os.environ.get("COOKIE_JSON") or os.environ.get("TERABOX_NDUS") or ""
    
    # Build ndus cookie value
    ndus_value = ""
    if cookie_json:
        try:
            parsed = json.loads(cookie_json)
            ndus_value = parsed.get("ndus") if isinstance(parsed, dict) else str(parsed)
        except (json.JSONDecodeError, ValueError):
            import re
            match = re.search(r"ndus=([^;]+)", cookie_json)
            ndus_value = match.group(1) if match else cookie_json.strip()

    result = await _playwright_extract(url, surl, password, ndus_value)

    if result.get("ok"):
        return result

    raise ValueError(result.get("error", "Playwright extraction failed"))


async def _playwright_extract(
    url: str,
    surl: str,
    password: str,
    ndus_value: str,
) -> dict[str, Any]:
    """Core Playwright extraction logic.

    Uses a headless Chromium browser to:
    1. Load the TeraBox share page with optional ndus cookie
    2. Execute JavaScript to get dynamically-generated tokens
    3. Extract sign, timestamp, shareid, uk from the browser context
    4. Call the TeraBox API with complete parameters
    5. Return normalized file data

    WITHOUT a valid ndus cookie, TeraBox returns errno=-21 because
    the required security tokens are session-dependent and require
    authenticated access.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )

        try:
            context = await browser.new_context(
                user_agent=DEFAULT_HEADERS["User-Agent"],
                locale="en-US",
            )

            # Add ndus cookie if provided
            if ndus_value:
                await context.add_cookies([
                    {
                        "name": "ndus",
                        "value": ndus_value,
                        "domain": ".1024tera.com",
                        "path": "/",
                    },
                    {
                        "name": "ndus",
                        "value": ndus_value,
                        "domain": ".1024terabox.com",
                        "path": "/",
                    },
                    {
                        "name": "ndus",
                        "value": ndus_value,
                        "domain": ".terabox.com",
                        "path": "/",
                    },
                    {
                        "name": "lang",
                        "value": "en",
                        "domain": ".1024tera.com",
                        "path": "/",
                    },
                ])

            page = await context.new_page()

            # Try each domain
            tokens = None
            for domain in TERABOX_DOMAINS:
                pwd_param = f"&pwd={password}" if password else ""
                page_url = f"https://{domain}/sharing/link?surl={surl}{pwd_param}"

                try:
                    logger.info(f"Playwright navigating to: {page_url}")
                    await page.goto(page_url, wait_until="networkidle", timeout=20000)
                    await asyncio.sleep(2)  # Extra time for JS execution

                    # Extract tokens via JavaScript evaluation
                    tokens = await page.evaluate("""
                    () => {
                        const r = {};
                        const keys = [
                            'jsToken', 'sign', 'timestamp', 'shareid',
                            'uk', 'bdstoken', 'shorturl'
                        ];
                        for (const k of keys) {
                            try {
                                const v = window[k];
                                r[k] = (v !== undefined && v !== null && v !== '') ? String(v) : null;
                            } catch(e) {
                                r[k] = null;
                            }
                        }
                        // Try templateData
                        try {
                            if (window.templateData) {
                                r.templateData = JSON.stringify(window.templateData);
                                // Extract uk, bdstoken, pcftoken from templateData
                                const td = window.templateData;
                                if (!r.uk && td.uk !== undefined) r.uk = String(td.uk);
                                if (!r.bdstoken && td.bdstoken) r.bdstoken = String(td.bdstoken);
                                if (td.pcftoken) r.pcftoken = String(td.pcftoken);
                            }
                        } catch(e) {}
                        // Check for page title
                        try { r.title = document.title; } catch(e) {}
                        return r;
                    }
                    """)

                    logger.info(f"Playwright tokens for {domain}: jsToken={'present' if tokens.get('jsToken') else 'missing'}, "
                                f"sign={'present' if tokens.get('sign') else 'missing'}, "
                                f"timestamp={'present' if tokens.get('timestamp') else 'missing'}, "
                                f"shareid={'present' if tokens.get('shareid') else 'missing'}, "
                                f"uk={'present' if tokens.get('uk') else 'missing'}")

                    if tokens.get("jsToken"):
                        break

                except Exception as e:
                    logger.warning(f"Playwright failed on {domain}: {e}")
                    continue

            if not tokens or not tokens.get("jsToken"):
                return {
                    "ok": False,
                    "source": "playwright",
                    "error": "Could not extract jsToken from any TeraBox domain",
                }

            # Get cookies from browser context
            cookies = await context.cookies()
            cookie_header = "; ".join([f"{c['name']}={c['value']}" for c in cookies])

            # Now call the API with extracted tokens
            api_result = await _call_share_list_api(
                tokens, surl, cookie_header
            )

            if api_result.get("error"):
                return {
                    "ok": False,
                    "source": "playwright",
                    "error": api_result["error"],
                    "password_required": api_result.get("password_required", False),
                }

            if not api_result.get("files"):
                return {
                    "ok": False,
                    "source": "playwright",
                    "error": "No files found in TeraBox share",
                }

            # Get OG title from page
            og_title = tokens.get("title", "")
            if not og_title:
                try:
                    og_title = await page.evaluate("""
                    () => {
                        const meta = document.querySelector('meta[property="og:title"]');
                        return meta ? meta.content : document.title || '';
                    }
                    """)
                except:
                    pass

            return {
                "ok": True,
                "source": "playwright",
                "title": og_title or api_result["files"][0]["name"],
                "size": api_result["size"],
                "size_str": api_result["size_str"],
                "duration": None,
                "resolution": None,
                "thumbnail": api_result.get("thumbnail"),
                "download_url": api_result["stream_url"],
                "stream_url": api_result["stream_url"],
                "file_type": api_result.get("file_type"),
                "files": api_result["files"],
            }

        except Exception as e:
            logger.error(f"Playwright extraction error: {e}")
            return {
                "ok": False,
                "source": "playwright",
                "error": f"Playwright error: {e}",
            }
        finally:
            try:
                await browser.close()
            except:
                pass


async def _call_share_list_api(
    tokens: dict,
    surl: str,
    cookie_header: str,
) -> dict:
    """Call TeraBox share/list API with extracted tokens.

    Uses the tokens extracted by Playwright (including dynamically-generated
    sign, timestamp, shareid, uk) to call the API successfully.
    """
    params = {
        "app_id": APP_ID,
        "web": WEB,
        "channel": CHANNEL,
        "clienttype": CLIENTTYPE,
        "jsToken": tokens["jsToken"],
        "shorturl": surl,
        "root": "1",
        "page": "1",
        "num": "100",
        "by": "name",
        "order": "asc",
    }

    # Add dynamically-generated tokens if available
    for key in ("sign", "timestamp", "shareid", "uk", "bdstoken"):
        if tokens.get(key):
            params[key] = tokens[key]

    # Try pcftoken from templateData if no sign/timestamp
    if not tokens.get("sign") and tokens.get("pcftoken"):
        params["pcftoken"] = tokens["pcftoken"]

    headers = {
        **DEFAULT_HEADERS,
        "Accept": "application/json, text/plain, */*",
        "Referer": f"https://www.1024tera.com/sharing/link?surl={surl}",
        "Cookie": cookie_header,
    }

    # Try multiple API domains
    api_domains = ["www.1024tera.com", "www.1024terabox.com", "www.terabox.com"]

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        for domain in api_domains:
            api_url = f"https://{domain}{SHARE_LIST_ENDPOINT}"
            try:
                resp = await client.get(api_url, params=params, headers=headers)
                if resp.status_code != 200:
                    continue

                data = resp.json()
                errno = data.get("errno")
                errmsg = data.get("errmsg") or data.get("error_msg") or ""

                logger.info(f"share/list on {domain}: errno={errno}, errmsg={errmsg}")

                if errno == 0 or errno == "0":
                    raw_files = data.get("list", [])
                    if raw_files:
                        files = [_normalize_file(f) for f in raw_files]
                        primary = _get_primary_file(files)

                        # Try get_download if we have complete tokens
                        stream_url = primary.get("download_url") or ""
                        if primary.get("fs_id") and tokens.get("shareid") and tokens.get("uk"):
                            dl_url = await _call_get_download_api(
                                client, tokens, primary["fs_id"],
                                surl, cookie_header
                            )
                            if dl_url:
                                stream_url = dl_url

                        return {
                            "files": files,
                            "size": primary.get("size"),
                            "size_str": human_size(primary.get("size")),
                            "stream_url": stream_url,
                            "file_type": primary.get("file_type"),
                            "thumbnail": primary.get("thumbnail"),
                        }

                    return {"error": "Empty file list"}

                # Check for password errors
                if _is_password_error(errno, errmsg):
                    return {
                        "error": "password_required",
                        "password_required": True,
                        "errno": errno,
                        "errmsg": errmsg,
                    }

            except Exception as e:
                logger.debug(f"share/list failed on {domain}: {e}")
                continue

    return {"error": f"All API domains returned errors (last errno: unknown)"}


async def _call_get_download_api(
    client: httpx.AsyncClient,
    tokens: dict,
    fs_id: str,
    surl: str,
    cookie_header: str,
) -> Optional[str]:
    """Call get_download API to obtain direct dlink."""
    body = {
        "app_id": APP_ID,
        "web": WEB,
        "channel": CHANNEL,
        "clienttype": CLIENTTYPE,
        "jsToken": tokens["jsToken"],
        "shareid": tokens["shareid"],
        "uk": tokens["uk"],
        "sign": tokens.get("sign", ""),
        "timestamp": tokens.get("timestamp", ""),
        "fs_id": fs_id,
        "bdstoken": tokens.get("bdstoken", ""),
    }

    headers = {
        **DEFAULT_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": f"https://www.1024tera.com/sharing/link?surl={surl}",
        "Cookie": cookie_header,
    }

    api_domains = ["www.1024tera.com", "www.1024terabox.com", "www.terabox.com"]
    for domain in api_domains:
        try:
            from urllib.parse import urlencode
            resp = await client.post(
                f"https://{domain}{DOWNLOAD_ENDPOINT}",
                data=urlencode(body),
                headers=headers,
                timeout=20.0,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            if data.get("errno") == 0 or data.get("errno") == "0":
                dlink = data.get("dlink") or data.get("download_link") or data.get("url")
                if dlink:
                    return dlink
        except Exception:
            continue
    return None


def _normalize_file(item: dict) -> dict:
    """Normalize file item from API response."""
    name = item.get("server_filename") or item.get("filename") or "Unknown"
    size = int(item.get("size", 0)) or None
    thumbs = item.get("thumbs") or {}
    thumbnail = thumbs.get("url3") or thumbs.get("url2") or thumbs.get("url1")
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
        "isdir": item.get("isdir") == "1",
        "path": item.get("path", ""),
        "fs_id": item.get("fs_id", ""),
    }


def _get_primary_file(files: list) -> dict:
    """Get primary file (first video, else first file)."""
    for f in files:
        if f.get("file_type") == "video":
            return f
    return files[0] if files else {}


def _is_password_error(errno: int, errmsg: str) -> bool:
    """Determine if API response indicates password protection."""
    PASSWORD_ERRNO_DEFINITIVE = {-130}
    PASSWORD_ERRNO_AMBIGUOUS = {-9, 105}
    PASSWORD_PHRASES = {
        "password required", "wrong password", "invalid password",
        "incorrect password", "need password", "password protected",
        "password error", "password wrong", "wrong pwd", "invalid pwd",
        "pwd invalid", "pwd required", "pwd wrong",
    }
    if errno in PASSWORD_ERRNO_DEFINITIVE:
        return True
    if errno in PASSWORD_ERRNO_AMBIGUOUS:
        return any(p in errmsg.lower() for p in PASSWORD_PHRASES)
    return False
