// extract.js
// Pure extraction logic for TeraBox share links, run inside the MV3 service
// worker (background.js). Uses the user's real TeraBox session (browser
// cookies) to resolve a share page, list files, and obtain a direct download
// link. Only the resulting preview is ever returned to the caller.
//
// API flow (all requests use credentials: "include" so the browser attaches
// the user's TeraBox cookies to the TeraBox origin only):
//   1. GET  https://www.terabox.com/share/list?shorturl=<surl>&...   -> file list + shareid/uk
//   2. GET  https://www.terabox.com/sharing/link?surl=<surl>          -> share page HTML with
//      server-generated tokens (jsToken, sign, timestamp, bdstoken)
//   3. POST https://www.terabox.com/api/download (form body)          -> direct dl URL
//      app_id/web/channel/clienttype/jsToken/shareid/uk/sign/timestamp/fs_id/bdstoken

// Hard cap on the number of list items we will parse (defense in depth).
const MAX_ITEMS = 20;

const LIST_API_HOST = "https://www.terabox.com";
const SHARE_PATH = "/share/list";

function buildShareListUrl(shareId, pageToken = 0) {
  const params = new URLSearchParams({
    shorturl: shareId,
    root: "1",
    scene: "",
    nested: "0",
    pwd: "",
    page: String(pageToken),
  });
  return `${LIST_API_HOST}${SHARE_PATH}?${params.toString()}`;
}

// Mirrors cloudflare-worker/src/index.js extractStr().
function extractStr(text, start, end) {
  const si = text.indexOf(start);
  if (si === -1) return null;
  const ei = text.indexOf(end, si + start.length);
  if (ei === -1) return null;
  return text.slice(si + start.length, ei);
}

// Mirrors cloudflare-worker/src/index.js extractToken().
function extractToken(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return m[1];
  }
  return null;
}

// Regex patterns copied verbatim from cloudflare-worker/src/index.js
// fetchSharePage(). Extended with backend native_extractor.py patterns
// for better coverage of live TeraBox HTML structures.
// DO NOT invent new patterns without evidence; keep in sync with working implementations.
const SIGN_PATTERNS = [
  // Standard inline JS assignments
  /window\.sign\s*=\s*["']([^"']+)["']/,
  /window\["sign"\]\s*=\s*["']([^"']+)["']/,
  /window\['sign'\]\s*=\s*["']([^"']+)["']/,
  // JSON in script tags
  /"sign"\s*:\s*"([^"]+)"/,
  /'sign'\s*:\s*'([^']+)'/,
  // URL-encoded JSON
  /sign%22%3A%22([^%]+)%22/,
  // Escaped JSON in HTML
  /\\"sign\\"\s*:\s*\\"([^\\"]+)\\"/,
  // yunData / FileUtils style (Baidu/TeraBox common pattern)
  /yunData\.sign\s*=\s*["']([^"']+)["']/,
  /yunData\.SIGN\s*=\s*["']([^"']+)["']/,
  /FileUtils\.share_sign\s*=\s*["']([^"']+)["']/,
  // Variable declarations
  /(?:var|let|const)\s+sign\s*=\s*["']([^"']+)["']/,
];
const TIMESTAMP_PATTERNS = [
  // Standard inline JS assignments
  /window\.timestamp\s*=\s*["']?(\d+)["']?/,
  /window\["timestamp"\]\s*=\s*["']?(\d+)["']?/,
  /window\['timestamp'\]\s*=\s*["']?(\d+)["']?/,
  // JSON in script tags
  /"timestamp"\s*:\s*(\d+)/,
  /'timestamp'\s*:\s*'(\d+)'/,
  // Escaped JSON in HTML
  /\\"timestamp\\"\s*:\s*(\d+)/,
  // Common timestamp variants found in live TeraBox pages
  /window\.timeStamp\s*=\s*["']?(\d+)["']?/,
  /window\.serverTime\s*=\s*["']?(\d+)["']?/,
  /window\.server_time\s*=\s*["']?(\d+)["']?/,
  /"timeStamp"\s*:\s*(\d+)/,
  /"serverTime"\s*:\s*(\d+)/,
  /"server_time"\s*:\s*(\d+)/,
  // yunData / FileUtils style
  /yunData\.timestamp\s*=\s*["']?(\d+)["']?/,
  /yunData\.TIMESTAMP\s*=\s*["']?(\d+)["']?/,
  /yunData\.timeStamp\s*=\s*["']?(\d+)["']?/,
  /FileUtils\.share_timestamp\s*=\s*["']?(\d+)["']?/,
];
const BDSTOKEN_PATTERNS = [
  // Standard inline JS assignments
  /window\.bdstoken\s*=\s*["']([^"']+)["']/,
  /window\["bdstoken"\]\s*=\s*["']([^"']+)["']/,
  /window\['bdstoken'\]\s*=\s*["']([^"']+)["']/,
  // JSON in script tags
  /"bdstoken"\s*:\s*"([^"]+)"/,
  /'bdstoken'\s*:\s*'([^']+)'/,
  // URL-encoded JSON
  /bdstoken%22%3A%22([^%]+)%22/,
  // Escaped JSON in HTML
  /\\"bdstoken\\"\s*:\s*\\"([^\\"]+)\\"/,
  // Common variants found in live TeraBox pages
  /window\.MYBDSTOKEN\s*=\s*["']([^"']+)["']/,
  /"MYBDSTOKEN"\s*:\s*"([^"]+)"/,
  /'MYBDSTOKEN'\s*:\s*'([^']+)'/,
  // yunData / FileUtils style
  /yunData\.bdstoken\s*=\s*["']([^"']+)["']/,
  /yunData\.MYBDSTOKEN\s*=\s*["']([^"']+)["']/,
  /FileUtils\.share_bdstoken\s*=\s*["']([^"']+)["']/,
];

// Fetches the canonical TeraBox sharing page and extracts the server-generated
// tokens required by POST /api/download. Mirrors cloudflare-worker
// fetchSharePage() token extraction. Token values are NEVER logged.
async function fetchSharePageTokens(shareId) {
  const pageUrl = `${LIST_API_HOST}/sharing/link?surl=${shareId}`;
  const resp = await fetch(pageUrl, {
    method: "GET",
    credentials: "include",
    redirect: "follow",
  });
  if (!resp.ok) return null;
  const html = await resp.text();

  let jsToken = extractStr(html, "fn%28%22", "%22%29");
  if (!jsToken) jsToken = extractStr(html, "fn(", '"');
  if (!jsToken) {
    const m = html.match(/window\.jsToken[^=]*=\s*fn\s*\(\s*["']([^"']+)["']/);
    if (m) jsToken = m[1];
  }
  if (!jsToken) {
    const m = html.match(/fn(?:%28|\()(?:%22|%27|["'])([^%'"()]+)(?:%22|%27|["'])(?:%29|\))/);
    if (m) jsToken = m[1];
  }

  // ---- NEW PARSERS FOR LIVE HTML STRUCTURES ----
  // 1. sign: extract from URL query params in HTML-escaped form
  //    matches &sign=VALUE or &sign=VALUE
  function extractSignFromUrl(html) {
    // Find the relevant URL segment containing sign=, handling & entity
    const m = html.match(/[?&](?:amp;)?sign=([^&"'\s<>]+)/i);
    if (m) return decodeURIComponent(m[1]);
    return "";
  }

  // 2. bdstoken: extract from JSON/object property
  // matches "bdstoken":"VALUE" or "bdstoken" : "VALUE"
  function extractBdstokenFromJson(html) {
    const m = html.match(/"bdstoken"\s*:\s*"([^"]+)"/i);
    if (m) return m[1];
    return "";
  }

  // 3. timestamp: extract from time= in URL query params
  // matches time=VALUE or &time=VALUE
  function extractTimestampFromUrl(html) {
    const m = html.match(/[?&](?:amp;)?time=(\d+)/i);
    if (m) return m[1];
    return "";
  }

  // ---- Apply new parsers first, then fall back to existing patterns ----
  const newSign = extractSignFromUrl(html);
  const newTimestamp = extractTimestampFromUrl(html);
  const newBdstoken = extractBdstokenFromJson(html);

  const diagSign = newSign || extractToken(html, SIGN_PATTERNS) || "";
  const diagTimestamp = newTimestamp || extractToken(html, TIMESTAMP_PATTERNS) || "";
  const diagBdstoken = newBdstoken || extractToken(html, BDSTOKEN_PATTERNS) || "";

  // [TEMP-DIAG] safe share-page diagnostics (token values are NEVER printed).
  const diagHtml = String(html || "").toLowerCase();
  console.log("[TEMP-DIAG] share page HTTP status=", resp.status);
  console.log("[TEMP-DIAG] share page ok=", resp.ok);
  console.log("[TEMP-DIAG] share page final URL=", diagRedact({ url: resp.url }).url);
  console.log("[TEMP-DIAG] share page HTML length=", html.length);
  console.log("[TEMP-DIAG] share page token presence=", JSON.stringify({
    jsToken: !!jsToken,
    sign: !!diagSign,
    timestamp: !!diagTimestamp,
    bdstoken: !!diagBdstoken,
  }));
  console.log("[TEMP-DIAG] share page markers=", JSON.stringify({
    terabox: diagHtml.includes("terabox"),
    sharingLink: diagHtml.includes("sharing/link"),
    window: diagHtml.includes("window"),
    jsToken: diagHtml.includes("jstoken"),
    bdstoken: diagHtml.includes("bdstoken"),
    timestamp: diagHtml.includes("timestamp"),
    sign: diagHtml.includes("sign"),
    needVerify: diagHtml.includes("need verify"),
    captcha: diagHtml.includes("captcha"),
    login: diagHtml.includes("login"),
  }));

  return {
    jsToken: jsToken || "",
    sign: diagSign,
    timestamp: diagTimestamp,
    bdstoken: diagBdstoken,
  };
}

// POST /api/download using the known-working worker contract. Returns the
// parsed JSON body (errno / dlink), same as fetchWithRetry.
async function requestDownloadLink(shareId, shareid, uk, fsId, tokens) {
  const body = new URLSearchParams({
    app_id: "250528",
    web: "1",
    channel: "dubox",
    clienttype: "0",
    jsToken: tokens.jsToken || "",
    shareid: String(shareid ?? ""),
    uk: String(uk ?? ""),
    sign: tokens.sign || "",
    timestamp: tokens.timestamp || "",
    fs_id: String(fsId),
    bdstoken: tokens.bdstoken || "",
  });
  const resp = await fetchWithRetry(`${LIST_API_HOST}/api/download`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${LIST_API_HOST}/sharing/link?surl=${shareId}`,
    },
    body: body.toString(),
  });
  return resp;
}

// Returns true when TeraBox marks an entry as a directory. Real responses use
// isdir: "0"/"1" (strings); older shapes used booleans or 0/1.
function isDirectoryEntry(raw) {
  const d = raw && raw.isdir;
  return d === 1 || d === "1" || d === true || d === "true";
}

// Normalizes one raw /share/list item into a file record. Returns null for
// directories or malformed entries. Real list[0] shape:
//   { isdir: "0", fs_id: "406254045947763", server_filename, size,
//     url, url2, thumbs, width, height, duration }
// fs_id/size/width/height/duration arrive as strings and are coerced here.
function normalizeFile(raw) {
  if (!raw || typeof raw !== "object" || isDirectoryEntry(raw)) return null;

  const fsId = Number(raw.fs_id);
  if (raw.fs_id == null || Number.isNaN(fsId)) return null;

  const size = Number(raw.size);
  const width = Number(raw.width);
  const height = Number(raw.height);
  const duration = Number(raw.duration);
  const thumbs = raw.thumbs;
  const thumbnail =
    (thumbs && typeof thumbs === "object" &&
      (thumbs.url3 || thumbs.url2 || thumbs.url1 || thumbs.icon)) ||
    raw.thumb ||
    null;

  return {
    fs_id: fsId,
    name: raw.server_filename || raw.filename || "TeraBox File",
    size: Number.isNaN(size) ? 0 : size,
    isdir: false,
    duration: Number.isNaN(duration) ? null : duration,
    resolution: width && height ? `${width}x${height}` : null,
    thumbnail,
  };
}

// Returns the largest non-directory file's metadata from the share list.
function pickFirstFileMeta(listData) {
  const files = (listData && listData.list) || (listData && listData.data) || [];
  if (!Array.isArray(files) || files.length === 0) return null;
  const normalized = files.map(normalizeFile).filter(Boolean);
  if (normalized.length === 0) return null;
  normalized.sort((a, b) => (b.size || 0) - (a.size || 0));
  return normalized[0];
}

// Parse the /api/download response. dtype=3 gives { dlink, ... } directly.
function parseDownloadResponse(data) {
  if (!data || typeof data !== "object") return { ok: false, error: "Empty download response." };
  const dlink = data.dlink || data.url || data.download_url || data.stream_url;
  if (!dlink) return { ok: false, error: "No download link in TeraBox response." };
  return { ok: true, download_url: dlink };
}

// Resolves a share URL to a list of files, then to a direct download link.
export async function handleExtract(shareUrl, password = "") {
  const fidResult = await fetchShareList(shareUrl, password);
  if (!fidResult.ok) {
    return fidResult;
  }
  const { listData, shareId } = fidResult;

  const meta = pickFirstFileMeta(listData);
  if (!meta) {
    return {
      ok: false,
      error: "No downloadable file found in this share.",
      verification_required: false,
    };
  }

  const tokens = await fetchSharePageTokens(shareId);
  if (!tokens || !tokens.jsToken || !tokens.sign || !tokens.timestamp) {
    return {
      ok: false,
      error: "Could not obtain the TeraBox share-page tokens required for direct download.",
      verification_required: false,
    };
  }

  let downloadResp;
  try {
    downloadResp = await requestDownloadLink(
      shareId,
      listData.share_id || listData.shareid,
      listData.uk,
      meta.fs_id,
      tokens
    );
  } catch (err) {
    return { ok: false, error: `Download API request failed: ${err?.message}` };
  }

  // [TEMP-DIAG] request params WITHOUT any token values (app_id/web/channel/
  // clienttype/fs_id/shareid/uk only; sign/timestamp/jsToken/bdstoken excluded).
  const diagParams = {
    app_id: "250528",
    web: "1",
    channel: "dubox",
    clienttype: "0",
    shareid: String((listData.share_id || listData.shareid) ?? ""),
    uk: String(listData.uk ?? ""),
    fs_id: String(meta.fs_id),
    has_jsToken: !!(tokens && tokens.jsToken),
    has_sign: !!(tokens && tokens.sign),
    has_timestamp: !!(tokens && tokens.timestamp),
    has_bdstoken: !!(tokens && tokens.bdstoken),
  };
  console.log("[TEMP-DIAG] /api/download HTTP status=", lastHttpStatus);
  console.log("[TEMP-DIAG] /api/download errno=", downloadResp && downloadResp.errno);
  console.log("[TEMP-DIAG] /api/download response=", JSON.stringify(diagRedact(downloadResp)));
  console.log("[TEMP-DIAG] /api/download params=", JSON.stringify(diagRedact(diagParams)));

  const dlData = parseDownloadResponse(downloadResp);
  console.log("[TEMP-DIAG] /api/download keys=", Object.keys(downloadResp), "dlink=", diagRedact(downloadResp).dlink);
  if (!dlData.ok) {
    return {
      ok: false,
      error: dlData.error,
      verification_required: false,
    };
  }

  return {
    ok: true,
    source: "terabox_browser",
    title: meta.name,
    size: meta.size,
    duration: meta.duration ?? null,
    resolution: meta.resolution ?? null,
    thumbnail: meta.thumbnail ?? null,
    download_url: dlData.download_url,
    stream_url: dlData.download_url,
  };
}

// [TEMP-DIAG] last HTTP status observed by fetchWithRetry (diagnostic only,
// set alongside the existing fetch log line; never changes request/retry flow).
let lastHttpStatus = null;

// [TEMP-DIAG] deep-redacts credentials, tokens, and signed URLs before logging.
const SENSITIVE_KEY = /^(ndus|jstoken|sign|timestamp|cookie|cookies|token|auth|sekey|bdstoken|vcode|vcode_str|randsk|.*signature.*)$/i;
const SENSITIVE_URL_KEY = /(dlink|download|stream)/i;

function diagRedact(value, depth = 0) {
  if (depth > 3) return "[deep]";
  if (Array.isArray(value)) return value.map((v) => diagRedact(v, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const key = String(k);
      if (SENSITIVE_KEY.test(key)) { out[k] = "[REDACTED]"; continue; }
      if (SENSITIVE_URL_KEY.test(key)) { out[k] = "[REDACTED URL]"; continue; }
      if (typeof v === "string" && /https?:\/\//.test(v) && /(sign|timestamp|token|ndus|sekey|bdstoken|randsk)=/i.test(v)) {
        out[k] = "[REDACTED URL]";
        continue;
      }
      if (typeof v === "string" && v.length > 120) {
        out[k] = `${v.slice(0, 120)}…(truncated)`;
        continue;
      }
      out[k] = diagRedact(v, depth + 1);
    }
    return out;
  }
  return value;
}

async function fetchShareList(shareUrl, password) {
  const shareId = extractShareId(shareUrl);
  if (!shareId) {
    return { ok: false, error: "Could not find a share id in this TeraBox link." };
  }

  let listData = null;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const listUrl = buildShareListUrl(shareId, 0);
    try {
      const resp = await fetchWithRetry(listUrl, { method: "GET", credentials: "include" });
      listData = resp;
      break;
    } catch (err) {
      lastError = err?.message || "unknown list error";
    }
  }
  if (!listData) {
    return {
      ok: false,
      error: `Could not fetch the share list: ${lastError}`,
      verification_required: false,
    };
  }
  console.log("[TEMP-DIAG] /share/list errno=", listData.errno, "keys=", Object.keys(listData));
  if (listData.errno === 105) {
    return {
      ok: false,
      error: "TeraBox requires verification (captcha) before this share can be resolved.",
      verification_required: true,
    };
  }
  if (listData.errno !== undefined && listData.errno !== 0) {
    return {
      ok: false,
      error: `TeraBox share list error: errno=${listData.errno}`,
      verification_required: false,
    };
  }
  const listArr = listData.list;
  const first = Array.isArray(listArr) ? listArr[0] : null;
  console.log(
    "[TEMP-DIAG] list isArray=", Array.isArray(listArr),
    "length=", Array.isArray(listArr) ? listArr.length : "n/a",
    "firstKeys=", first ? Object.keys(first) : "n/a"
  );
  if (first) {
    console.log("[TEMP-DIAG] list[0]=", JSON.stringify(diagRedact(first)));
    const nested = first.list || first.children || first.files;
    if (Array.isArray(nested) && nested.length) {
      console.log(
        "[TEMP-DIAG] list[0] nested isArray=", Array.isArray(nested),
        "length=", nested.length,
        "nestedKeys=", Object.keys(nested[0] || {})
      );
      console.log("[TEMP-DIAG] list[0] nested[0]=", JSON.stringify(diagRedact(nested[0] || {})));
    }
  }
  console.log(
    "[TEMP-DIAG] top-level relevant=",
    JSON.stringify(diagRedact({
      title: listData.title,
      share_id: listData.share_id,
      uk: listData.uk,
      cfrom_id: listData.cfrom_id,
      topKeys: Object.keys(listData),
    }))
  );
  return { ok: true, listData, shareId };
}

// Minimal fetch wrapper with one retry. TeraBox sometimes 502s on the first
// attempt; these are idempotent GETs so retry is safe.
async function fetchWithRetry(url, init, retries = 1) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, init);
      lastHttpStatus = resp.status;
      console.log("[TEMP-DIAG] fetch ->", resp.status, resp.url);
      if (!resp.ok) {
        if (resp.status === 429 || resp.status >= 500) {
          lastErr = new Error(`HTTP ${resp.status} ${resp.statusText}`);
          await new Promise((r) => setTimeout(r, 600 * (i + 1)));
          continue;
        }
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      return await resp.json();
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr || new Error("fetch failed");
}

// Extracts the shorturl/share id from a TeraBox URL. Mirrors the backend's
// extract_share_id().
export function extractShareId(url) {
  try {
    const p = new URL(url);
    const surl = p.searchParams.get("surl");
    if (surl) return surl;
    const m = p.pathname.match(/\/s\/1?([A-Za-z0-9_\-]+)/);
    if (m) return m[1];
    const m2 = url.match(/\/sharing\/link\?surl=([A-Za-z0-9_\-]+)/);
    if (m2) return m2[1];
  } catch {}
  return null;
}

// Validates that the URL is a known TeraBox mirror (matches backend
// TERABOX_HOSTS).
const TERABOX_HOSTS = [
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
];

export function isTeraboxUrl(url) {
  try {
    const p = new URL(url.trim());
    if (p.protocol !== "http:" && p.protocol !== "https:") return false;
    const host = p.hostname.toLowerCase();
    return TERABOX_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}
