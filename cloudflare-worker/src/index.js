const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "application/json, text/plain, */*",
};

const TERABOX_DOMAINS = [
  "www.terabox.com",
  "www.1024terabox.com",
  "1024terabox.com",
  "terabox.com",
  "teraboxapp.com",
  "nephobox.com",
  "mirrobox.com",
  "momerybox.com",
  "1024tera.com",
];

const APP_ID = "250528";
const VIDEO_EXTS = new Set([
  "mp4", "mkv", "avi", "mov", "webm", "flv", "m4v", "wmv", "ts", "mpeg", "mpg",
]);
const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif", "svg",
]);
const AUDIO_EXTS = new Set([
  "mp3", "wav", "flac", "aac", "ogg", "m4a", "opus",
]);

const PASSWORD_PHRASES = [
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
];

const PWD_ERRNO_DEFINITIVE = new Set([-130, 400141]);
const PWD_ERRNO_AMBIGUOUS = new Set([-9, 105]);

function humanSize(num) {
  if (num == null) return null;
  const n = Number(num);
  if (isNaN(n)) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  for (const unit of units) {
    if (Math.abs(v) < 1024) return `${v.toFixed(1)} ${unit}`;
    v /= 1024;
  }
  return `${v.toFixed(1)} PB`;
}

function guessType(name) {
  if (!name || !name.includes(".")) return null;
  const ext = name.split(".").pop().toLowerCase();
  if (VIDEO_EXTS.has(ext)) return "video";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (AUDIO_EXTS.has(ext)) return "audio";
  return "file";
}

function extractShareId(url) {
  try {
    const u = new URL(url);
    const surl = u.searchParams.get("surl");
    if (surl) return surl.replace(/^1/, "");
    const m = u.pathname.match(/\/s\/1?([A-Za-z0-9_\-]+)/);
    if (m) return m[1].replace(/^1/, "");
    const m2 = url.match(/\/sharing\/link\?surl=([A-Za-z0-9_\-]+)/);
    if (m2) return m2[1].replace(/^1/, "");
  } catch {}
  return null;
}

function extractStr(text, start, end) {
  const si = text.indexOf(start);
  if (si === -1) return null;
  const ei = text.indexOf(end, si + start.length);
  if (ei === -1) return null;
  return text.slice(si + start.length, ei);
}

function extractToken(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return m[1];
  }
  return null;
}

function isPasswordErrorText(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return PASSWORD_PHRASES.some((p) => lower.includes(p));
}

function logRequest(label, url, opts = {}) {
  const log = {
    event: "request",
    label,
    url,
    method: opts.method || "GET",
    timestamp: new Date().toISOString(),
  };
  if (opts.params) log.params = opts.params;
  if (opts.body) log.body = opts.body;
  console.log(JSON.stringify(log));
}

function logResponse(label, url, status, data, opts = {}) {
  const log = {
    event: "response",
    label,
    url,
    status,
    errno: data?.errno ?? null,
    errmsg: data?.errmsg ?? data?.error_msg ?? null,
    timestamp: new Date().toISOString(),
  };
  if (opts.logRaw && data) {
    const sanitized = { ...data };
    if (sanitized.list && sanitized.list.length > 3) {
      sanitized.list = sanitized.list.slice(0, 3).concat([{ _truncated: sanitized.list.length - 3 }]);
    }
    log.raw_json = sanitized;
  }
  console.log(JSON.stringify(log));
}

async function fetchSharePage(surl, password, cookieHeader) {
  const pwdParam = password ? `&pwd=${encodeURIComponent(password)}` : "";
  const cookieHeaders = cookieHeader ? { Cookie: cookieHeader } : {};

  const SIGN_PATTERNS = [
    /window\.sign\s*=\s*["']([^"']+)["']/,
    /"sign"\s*:\s*"([^"]+)"/,
    /'sign'\s*:\s*'([^']+)'/,
    /sign%22%3A%22([^%]+)%22/,
  ];
  const TIMESTAMP_PATTERNS = [
    /window\.timestamp\s*=\s*["']?(\d+)["']?/,
    /"timestamp"\s*:\s*(\d+)/,
    /'timestamp'\s*:\s*'(\d+)'/,
  ];
  const SHAREID_PATTERNS = [
    /window\.shareid\s*=\s*["']?(\d+)["']?/,
    /"shareid"\s*:\s*(\d+)/,
    /'shareid'\s*:\s*'(\d+)'/,
    /shareid%22%3A(\d+)/,
  ];
  const UK_PATTERNS = [
    /window\.uk\s*=\s*["']?(\d+)["']?/,
    /"uk"\s*:\s*(\d+)/,
    /'uk'\s*:\s*'(\d+)'/,
    /uk%22%3A(\d+)/,
  ];
  const BDSTOKEN_PATTERNS = [
    /window\.bdstoken\s*=\s*["']([^"']+)["']/,
    /"bdstoken"\s*:\s*"([^"]+)"/,
    /'bdstoken'\s*:\s*'([^']+)'/,
    /bdstoken%22%3A%22([^%]+)%22/,
  ];
  const SHORTURL_PATTERNS = [
    /window\.shorturl\s*=\s*["']([^"']+)["']/,
    /"shorturl"\s*:\s*"([^"]+)"/,
    /'shorturl'\s*:\s*'([^']+)'/,
  ];

  for (const domain of TERABOX_DOMAINS) {
    for (const fmt of [surl, `1${surl}`]) {
      const urls = [
        `https://${domain}/sharing/link?surl=${fmt}${pwdParam}`,
        `https://${domain}/s/${fmt}`,
      ];
      for (const url of urls) {
        try {
          logRequest("fetch_share_page", url);
          const resp = await fetch(url, {
            headers: { ...DEFAULT_HEADERS, ...cookieHeaders },
            redirect: "follow",
          });
          logResponse("fetch_share_page", resp.url, resp.status, {});

          if (resp.status !== 200) continue;
          const html = await resp.text();
          const finalUrl = resp.url;

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

          // Extract modern TeraBox tokens
          const sign = extractToken(html, SIGN_PATTERNS);
          const timestamp = extractToken(html, TIMESTAMP_PATTERNS);
          const shareid = extractToken(html, SHAREID_PATTERNS);
          const uk = extractToken(html, UK_PATTERNS);
          const bdstoken = extractToken(html, BDSTOKEN_PATTERNS);
          const shorturl = extractToken(html, SHORTURL_PATTERNS);

          if (!jsToken) continue;

          const parsedUrl = new URL(finalUrl);
          const extractedSurl = parsedUrl.searchParams.get("surl") || surl;

          const dpLogid = extractStr(html, "dp-logid=", "&") || "";
          const ogTitle =
            extractStr(html, 'og:title" content="', '"') ||
            extractStr(html, "og:title' content='", "'") ||
            html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ||
            null;
          const ogImage =
            extractStr(html, 'og:image" content="', '"') ||
            extractStr(html, "og:image' content='", "'") ||
            null;

          console.log(JSON.stringify({
            event: "tokens_extracted",
            domain,
            jsToken: jsToken.slice(0, 20) + "...",
            sign: sign ? sign.slice(0, 10) + "..." : null,
            shareid,
            uk,
            timestamp,
            hasBdstoken: !!bdstoken,
          }));

          return {
            jsToken,
            sign,
            timestamp,
            shareid,
            uk,
            bdstoken,
            shorturl,
            surl: extractedSurl.replace(/^1/, ""),
            dpLogid,
            ogTitle,
            ogImage,
            domain,
          };
        } catch (err) {
          logResponse("fetch_share_page", url, 0, { error: err.message });
          continue;
        }
      }
    }
  }
  return null;
}

async function callShareList(tokens, cookieHeader) {
  const params = new URLSearchParams({
    app_id: APP_ID,
    web: "1",
    channel: "dubox",
    clienttype: "0",
    jsToken: tokens.jsToken,
    shorturl: tokens.surl,
    root: "1",
    page: "1",
    num: "50",
    by: "name",
    order: "asc",
  });

  // Add modern tokens if available
  if (tokens.sign) params.set("sign", tokens.sign);
  if (tokens.timestamp) params.set("timestamp", tokens.timestamp);
  if (tokens.shareid) params.set("shareid", tokens.shareid);
  if (tokens.uk) params.set("uk", tokens.uk);
  if (tokens.bdstoken) params.set("bdstoken", tokens.bdstoken);
  if (tokens.dpLogid) params.set("dp-logid", tokens.dpLogid);

  const cookieHeaders = cookieHeader ? { Cookie: cookieHeader } : {};

  const apiDomains = [
    `https://${tokens.domain}/share/list`,
    "https://www.terabox.com/share/list",
    "https://www.1024tera.com/share/list",
    "https://dm.terabox.app/share/list",
  ];

  let lastErrno = null;
  let lastErrmsg = null;

  for (const domain of apiDomains) {
    try {
      logRequest("share_list", domain, { params: params.toString() });
      const resp = await fetch(`${domain}?${params.toString()}`, {
        headers: {
          ...DEFAULT_HEADERS,
          Referer: `https://${tokens.domain}/sharing/link?surl=${tokens.surl}`,
          ...cookieHeaders,
        },
      });
      if (resp.status !== 200) {
        logResponse("share_list", resp.url, resp.status, { http_status: resp.status });
        continue;
      }
      let data;
      try { data = await resp.json(); } catch { continue; }

      logResponse("share_list", resp.url, resp.status, data, { logRaw: true });

      const errno = data.errno;
      const errmsg = data.errmsg || data.error_msg || "";

      if (errno === 0 || errno === "0") {
        if (data.list && data.list.length) {
          return { data };
        }
        lastErrno = 0;
        lastErrmsg = "empty list";
        continue;
      }

      if (PWD_ERRNO_DEFINITIVE.has(errno)) {
        return { error: "password_required", password_required: true, errno, errmsg };
      }

      if (PWD_ERRNO_AMBIGUOUS.has(errno)) {
        if (isPasswordErrorText(errmsg)) {
          return { error: "password_required", password_required: true, errno, errmsg };
        }
        lastErrno = errno;
        lastErrmsg = errmsg || "unknown error";
        continue;
      }

      lastErrno = errno;
      lastErrmsg = errmsg || "unknown error";
      continue;
    } catch (err) {
      logResponse("share_list", domain, 0, { error: err.message });
      continue;
    }
  }

  return { error: "api_error", errno: lastErrno, errmsg: lastErrmsg || "all share/list domains failed" };
}

async function callGetInfo(tokens, cookieHeader) {
  // Alternative API endpoint
  const params = new URLSearchParams({
    app_id: APP_ID,
    web: "1",
    channel: "dubox",
    clienttype: "0",
    shorturl: tokens.surl,
  });
  if (tokens.sign) params.set("sign", tokens.sign);
  if (tokens.timestamp) params.set("timestamp", tokens.timestamp);
  if (tokens.shareid) params.set("shareid", tokens.shareid);
  if (tokens.uk) params.set("uk", tokens.uk);
  if (tokens.bdstoken) params.set("bdstoken", tokens.bdstoken);

  const cookieHeaders = cookieHeader ? { Cookie: cookieHeader } : {};

  const apiDomains = [
    `https://${tokens.domain}/share/list`,
    "https://www.terabox.com/share/list",
    "https://www.1024tera.com/share/list",
  ];

  for (const domain of apiDomains) {
    try {
      logRequest("get_info", domain, { params: params.toString() });
      const resp = await fetch(`${domain}?${params.toString()}`, {
        headers: {
          ...DEFAULT_HEADERS,
          Referer: `https://${tokens.domain}/sharing/link?surl=${tokens.surl}`,
          ...cookieHeaders,
        },
      });
      if (resp.status !== 200) continue;
      const data = await resp.json();
      logResponse("get_info", resp.url, resp.status, data, { logRaw: true });

      const errno = data.errno;
      const errmsg = data.errmsg || data.error_msg || "";

      if (errno === 0 || errno === "0") {
        if (data.list && data.list.length) {
          return { data };
        }
      }

      if (PWD_ERRNO_DEFINITIVE.has(errno)) {
        return { error: "password_required", password_required: true, errno, errmsg };
      }
      if (PWD_ERRNO_AMBIGUOUS.has(errno) && isPasswordErrorText(errmsg)) {
        return { error: "password_required", password_required: true, errno, errmsg };
      }
    } catch {}
  }
  return null;
}

async function callGetDownload(tokens, fsId, cookieHeader) {
  // Download API to get direct dlink using modern tokens
  const apiDomains = [
    `https://${tokens.domain}/api/download`,
    "https://www.terabox.com/api/download",
    "https://www.1024tera.com/api/download",
  ];

  const cookieHeaders = cookieHeader ? { Cookie: cookieHeader } : {};

  for (const domain of apiDomains) {
    try {
      const body = new URLSearchParams({
        app_id: APP_ID,
        web: "1",
        channel: "dubox",
        clienttype: "0",
        jsToken: tokens.jsToken,
        shareid: tokens.shareid || "",
        uk: tokens.uk || "",
        sign: tokens.sign || "",
        timestamp: tokens.timestamp || "",
        fs_id: fsId,
        bdstoken: tokens.bdstoken || "",
      });

      logRequest("get_download", domain, { fs_id: fsId });
      const resp = await fetch(domain, {
        method: "POST",
        headers: {
          ...DEFAULT_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: `https://${tokens.domain}/sharing/link?surl=${tokens.surl}`,
          ...cookieHeaders,
        },
        body: body.toString(),
      });
      if (resp.status !== 200) continue;
      const data = await resp.json();
      logResponse("get_download", resp.url, resp.status, data, { logRaw: true });

      const errno = data.errno;
      const errmsg = data.errmsg || data.error_msg || "";

      if (errno === 0 || errno === "0") {
        if (data.dlink || data.download_link || data.url) {
          return { dlink: data.dlink || data.download_link || data.url };
        }
      }

      if (PWD_ERRNO_DEFINITIVE.has(errno)) {
        return { error: "password_required", password_required: true, errno, errmsg };
      }
      if (PWD_ERRNO_AMBIGUOUS.has(errno) && isPasswordErrorText(errmsg)) {
        return { error: "password_required", password_required: true, errno, errmsg };
      }
    } catch {}
  }
  return null;
}

async function resolveDlink(dlink, cookieHeader) {
  const cookieHeaders = cookieHeader ? { Cookie: cookieHeader } : {};
  try {
    logRequest("resolve_dlink", dlink);
    const resp = await fetch(dlink, {
      method: "HEAD",
      headers: {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        Referer: "https://www.terabox.com/",
        ...cookieHeaders,
      },
      redirect: "follow",
    });
    logResponse("resolve_dlink", resp.url, resp.status, {});
    if (resp.status < 400) return resp.url;

    const resp2 = await fetch(dlink, {
      method: "GET",
      headers: {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        Referer: "https://www.terabox.com/",
        ...cookieHeaders,
      },
      redirect: "follow",
    });
    logResponse("resolve_dlink", resp2.url, resp2.status, {});
    if (resp2.status < 400) return resp2.url;
  } catch (err) {
    logResponse("resolve_dlink", dlink, 0, { error: err.message });
  }
  return dlink;
}

function normalizeFile(item, tokens) {
  const name = item.server_filename || item.filename || "Unknown";
  const size = parseInt(item.size, 10) || null;
  const thumbs = item.thumbs || {};
  const thumbnail = thumbs.url3 || thumbs.url2 || thumbs.url1 || tokens.ogImage;
  const dlink = item.dlink || "";
  const isDir = item.isdir === "1";

  return {
    name,
    size,
    size_str: humanSize(size),
    duration: null,
    resolution: null,
    thumbnail,
    download_url: dlink,
    stream_url: dlink,
    file_type: guessType(name),
    isdir: isDir,
    path: item.path || "",
    fs_id: item.fs_id || "",
  };
}

async function handleExtract(url, password, cookieJson) {
  const surl = extractShareId(url);
  if (!surl) {
    return { ok: false, source: "cf_worker", error: "Could not extract share ID from URL" };
  }

  // Build cookie header from cookieJson
  let cookieHeader = "";
  if (cookieJson) {
    try {
      const parsed = JSON.parse(cookieJson);
      const ndus = typeof parsed === "object" && parsed !== null ? parsed.ndus : String(parsed);
      if (ndus) cookieHeader = `ndus=${ndus}; lang=en;`;
    } catch {
      if (cookieJson.includes("ndus=")) cookieHeader = cookieJson;
    }
  }

  const tokens = await fetchSharePage(surl, password, cookieHeader);
  if (!tokens) {
    return {
      ok: false,
      source: "cf_worker",
      error: "Could not fetch TeraBox share page or extract authentication tokens.",
    };
  }

  if (tokens.error === "password_required") {
    return {
      ok: false,
      source: "cf_worker",
      error: password
        ? "Incorrect password. Please try again."
        : "This link is password protected.",
      password_required: true,
      password_incorrect: !!password,
      title: tokens.ogTitle || "Password required",
      size: null,
      size_str: null,
      duration: null,
      resolution: null,
      thumbnail: tokens.ogImage,
      download_url: null,
      stream_url: null,
      file_type: null,
      files: [],
    };
  }

  let apiResult = await callShareList(tokens, cookieHeader);

  // If share/list returns empty, try get_info fallback
  if (apiResult?.data && (!apiResult.data.list || !apiResult.data.list.length)) {
    const fallback = await callGetInfo(tokens, cookieHeader);
    if (fallback?.data?.list?.length) {
      apiResult = fallback;
    }
  }

  // Definitive password required from API
  if (apiResult?.error === "password_required") {
    return {
      ok: false,
      source: "cf_worker",
      error: password
        ? "Incorrect password. Please try again."
        : "This link is password protected.",
      password_required: true,
      password_incorrect: !!password,
      title: tokens.ogTitle || "Password required",
      size: null,
      size_str: null,
      duration: null,
      resolution: null,
      thumbnail: tokens.ogImage,
      download_url: null,
      stream_url: null,
      file_type: null,
      files: [],
    };
  }

  // API succeeded but returned no data, or non-password API error
  if (!apiResult || apiResult.error === "api_error" || !apiResult.data) {
    const parts = [];
    if (apiResult?.errno != null) parts.push(`errno=${apiResult.errno}`);
    if (apiResult?.errmsg) parts.push(apiResult.errmsg);
    const detail = parts.length ? ` (${parts.join(", ")})` : "";
    return {
      ok: false,
      source: "cf_worker",
      error: `TeraBox API did not return file data.${detail}`,
      title: tokens.ogTitle || "TeraBox File",
      size: null,
      size_str: null,
      duration: null,
      resolution: null,
      thumbnail: tokens.ogImage,
      download_url: null,
      stream_url: null,
      file_type: null,
      files: [],
    };
  }

  const rawFiles = apiResult.data.list;
  if (!rawFiles || !rawFiles.length) {
    return {
      ok: false,
      source: "cf_worker",
      error: "No files found in the TeraBox share.",
      title: tokens.ogTitle || "Empty",
    };
  }

  const files = rawFiles.map((f) => normalizeFile(f, tokens));
  const videoFiles = files.filter((f) => f.file_type === "video");
  const primary = videoFiles.length ? videoFiles[0] : files[0];

  // Try get_download API if we have modern tokens and fs_id
  if (tokens.shareid && tokens.uk && tokens.sign && tokens.timestamp && primary.fs_id) {
    const dlResult = await callGetDownload(tokens, primary.fs_id, cookieHeader);
    if (dlResult?.dlink) {
      primary.download_url = dlResult.dlink;
      primary.stream_url = dlResult.dlink;
    } else if (dlResult?.error === "password_required") {
      return {
        ok: false,
        source: "cf_worker",
        error: password
          ? "Incorrect password. Please try again."
          : "This link is password protected.",
        password_required: true,
        password_incorrect: !!password,
        title: tokens.ogTitle || "Password required",
        size: null,
        size_str: null,
        duration: null,
        resolution: null,
        thumbnail: tokens.ogImage,
        download_url: null,
        stream_url: null,
        file_type: null,
        files: [],
      };
    }
  }

  // Fallback: resolve dlink from share/list
  if (primary.download_url) {
    const resolved = await resolveDlink(primary.download_url, cookieHeader);
    primary.download_url = resolved;
    primary.stream_url = resolved;
  }

  return {
    ok: true,
    source: "cf_worker",
    title: tokens.ogTitle || primary.name,
    size: primary.size,
    size_str: primary.size_str,
    duration: primary.duration,
    resolution: primary.resolution,
    thumbnail: primary.thumbnail || tokens.ogImage,
    download_url: primary.download_url,
    stream_url: primary.stream_url,
    file_type: primary.file_type,
    files,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const body = await request.json();
      const { url, password } = body || {};

      if (!url || typeof url !== "string") {
        return new Response(JSON.stringify({ error: "Missing or invalid 'url' field" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Read COOKIE_JSON from environment
      const cookieJson = env.COOKIE_JSON || "";
      const result = await handleExtract(url, password || "", cookieJson);

      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, source: "cf_worker", error: err.message || "Internal error" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  },
};