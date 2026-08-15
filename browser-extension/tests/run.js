// Tests for extract.js — pure logic, no network.
// Run with: node tests/run.js
import { isTeraboxUrl, extractShareId, handleExtract } from "../src/extract.js";

let failures = 0;
let passed = 0;

function assert(cond, name, detail) {
  if (cond) {
    passed++;
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

function assertDeep(a, b, name) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  assert(sa === sb, name, `expected ${sa}, got ${sb}`);
}

// --- isTeraboxUrl ---------------------------------------------------------

const validUrls = [
  "https://www.terabox.com/s/1abcDEF_-123",
  "https://terabox.com/s/1xyz",
  "https://www.1024terabox.com/s/1foo",
  "http://mirrobox.com/s/1bar",
  "https://dm.terabox.com/s/1baz",
  "https://www.terabox.com/sharing/link?surl=1short",
  "https://www.terabox.app/s/1qux",
  "https://nephobox.com/s/1nep",
  "https://www.dubox.com/s/1dub",
];

for (const u of validUrls) {
  assert(isTeraboxUrl(u), `isTeraboxUrl accepts ${u}`);
}

const invalidUrls = [
  "https://google.com/s/1abc",
  "https://www.terabox.com.evil.com/s/1abc",
  "ftp://terabox.com/s/1abc",
  "",
  "not a url",
];

for (const u of invalidUrls) {
  assert(!isTeraboxUrl(u), `isTeraboxUrl rejects ${JSON.stringify(u)}`);
}

// --- extractShareId -------------------------------------------------------

assertDeep(extractShareId("https://www.terabox.com/s/1abcDEF_-123"), "abcDEF_-123", "surl path form");
assertDeep(
  extractShareId("https://www.terabox.com/sharing/link?surl=1short"),
  "1short",
  "sharing/link query form"
);
assertDeep(
  extractShareId("https://www.terabox.com/s/1abc?pwd=1234"),
  "abc",
  "surl path with query"
);
assertDeep(extractShareId("https://terabox.com/s/1xyz"), "xyz", "path form no 1 prefix");
assertDeep(extractShareId("https://google.com/s/1abc"), "abc", "non-terabox host still extracts path pattern");
assertDeep(extractShareId(""), null, "empty returns null");

// --- handleExtract: happy path with stubbed fetch using the EXACT real
// --- /share/list response shape observed in the browser probe (isdir:"0",
// --- string fs_id/size/width/height/duration, url/url2/thumbs) plus the
// --- share-page HTML and the POST /api/download flow.

const FAKE_LIST_RESPONSE = {
  errno: 0,
  request_id: "req-1",
  server_time: 1786516969,
  cfrom_id: "owner123",
  title: "My Shared Folder",
  share_id: "share456",
  uk: "owner123",
  list: [
    {
      isdir: "0",
      fs_id: "406254045947763",
      server_filename: "Movie 1080p.mp4",
      size: "123456789",
      url: "https://fake.example/redacted?sign=SIG1",
      url2: "https://fake.example/redacted?sign=SIG2",
      thumbs: { url3: "https://fake.example/thumb.jpg" },
      width: "1920",
      height: "1080",
      duration: "3600",
    },
  ],
};

const FAKE_SHARE_PAGE_HTML = [
  "<!doctype html><html><head><script>",
  "window.jsToken = fn(\"FAKE_JS_TOKEN_VALUE\");",
  "window.sign = \"FAKE_SIGN_VALUE\";",
  "window.timestamp = \"1786516969000\";",
  "window.bdstoken = \"FAKE_BDSTOKEN_VALUE\";",
  "</script></head><body></body></html>",
].join("\n");

// --- New synthetic HTML fixture matching observed live structures ---
const LIVE_STRUCTURE_HTML = [
  "<!doctype html><html><head><script>",
  "window.jsToken = fn(\"LIVE_JS_TOKEN\");",
  // sign in HTML-escaped query param
  "var fid = \"123\"; var url = \"https://example.com/api?fid=123&time=1786516969&t=123&sign=LIVE_SIGN_abcdef\";",
  // bdstoken in JSON object
  "var config = {\"bdstoken\":\"LIVE_BDSTOKEN_xyz\"};",
  "</script></head><body></body></html>",
].join("\n");

const FAKE_DOWNLOAD_RESPONSE = {
  errno: 0,
  dlink: "https://fake.dl.example/video.mp4?sign=SIG&timestamp=1",
};

const FAKE_TOKENS = ["FAKE_JS_TOKEN_VALUE", "FAKE_SIGN_VALUE", "1786516969000", "FAKE_BDSTOKEN_VALUE"];

const LIVE_TOKENS = ["LIVE_JS_TOKEN", "LIVE_SIGN_abcdef", "1786516969", "LIVE_BDSTOKEN_xyz"];

const requests = [];
const capturedLogs = [];
const realLog = console.log;
console.log = (...args) => {
  capturedLogs.push(args.map(String).join(" "));
};

async function fakeFetch(url, init) {
  const u = String(url);
  requests.push({ url: u, init: init || {} });
  if (u.includes("/sharing/link")) {
    return new Response(FAKE_SHARE_PAGE_HTML, {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }
  if (u.includes("/share/list")) {
    return new Response(JSON.stringify(FAKE_LIST_RESPONSE), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (u.includes("/api/download")) {
    return new Response(JSON.stringify(FAKE_DOWNLOAD_RESPONSE), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ errno: 140 }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

(async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = fakeFetch;
  try {
    const r = await handleExtract("https://www.terabox.com/s/1abc");

    // Existing normalization assertions (unchanged behavior)
    assert(r.ok === true, "extracts real share/list shape to a download link", JSON.stringify(r).slice(0, 200));
    assert(r.title === "Movie 1080p.mp4", "title taken from server_filename");
    assert(r.size === 123456789, "size coerced from string to number");
    assert(r.duration === 3600, "duration coerced from string to number");
    assert(r.resolution === "1920x1080", "resolution from width x height");
    assert(r.download_url === FAKE_DOWNLOAD_RESPONSE.dlink, "download_url comes from /api/download dlink");
    assert(r.stream_url === FAKE_DOWNLOAD_RESPONSE.dlink, "stream_url mirrors download_url");

    // A. share page is fetched with credentials "include" and redirect follow
    const pageReq = requests.find((q) => q.url.includes("/sharing/link"));
    assert(!!pageReq, "share page is fetched", requests.map((q) => q.url).join(", "));
    assert(pageReq && pageReq.init.credentials === "include", "share page uses credentials:include");
    assert(pageReq && pageReq.init.redirect === "follow", "share page follows redirects");

    // B/C/D. /api/download is a POST with the correct headers
    const dlReq = requests.find((q) => q.url.includes("/api/download"));
    assert(!!dlReq, "/api/download is called", requests.map((q) => q.url).join(", "));
    assert(dlReq && dlReq.init.method === "POST", "/api/download uses POST", dlReq && dlReq.init.method);
    assert(dlReq && dlReq.init.credentials === "include", "/api/download uses credentials:include");
    const dlHeaders = (dlReq && dlReq.init.headers) || {};
    assert(dlHeaders["Content-Type"] === "application/x-www-form-urlencoded", "Content-Type is application/x-www-form-urlencoded", JSON.stringify(dlHeaders));
    assert(dlHeaders["Referer"] === "https://www.terabox.com/sharing/link?surl=abc", "Referer is canonical sharing URL", dlHeaders["Referer"]);

    // E. POST body contains the full worker contract
    const bodyParams = dlReq ? new URLSearchParams(dlReq.init.body) : new URLSearchParams();
    const expectedBody = {
      app_id: "250528",
      web: "1",
      channel: "dubox",
      clienttype: "0",
      jsToken: "FAKE_JS_TOKEN_VALUE",
      shareid: "share456",
      uk: "owner123",
      sign: "FAKE_SIGN_VALUE",
      timestamp: "1786516969000",
      fs_id: "406254045947763",
      bdstoken: "FAKE_BDSTOKEN_VALUE",
    };
    for (const [k, v] of Object.entries(expectedBody)) {
      assert(bodyParams.get(k) === v, `POST body contains ${k}`, `${k}=${bodyParams.get(k)}`);
    }

    // G. no sensitive token values are printed by diagnostics
    const logText = capturedLogs.join("\n");
    for (const tok of FAKE_TOKENS) {
      assert(!logText.includes(tok), `diagnostics do not leak ${tok.slice(0, 8)}...`);
    }
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
  }

  // --- Test with LIVE HTML structure fixture (observed from real browser) ---
  {
    const liveRequests = [];
    const liveLogs = [];
    const realLog2 = console.log;
    console.log = (...args) => { liveLogs.push(args.map(String).join(" ")); };

    async function liveFakeFetch(url, init) {
      const u = String(url);
      liveRequests.push({ url: u, init: init || {} });
      if (u.includes("/sharing/link")) {
        return new Response(LIVE_STRUCTURE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }
      if (u.includes("/share/list")) {
        return new Response(JSON.stringify(FAKE_LIST_RESPONSE), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (u.includes("/api/download")) {
        return new Response(JSON.stringify(FAKE_DOWNLOAD_RESPONSE), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ errno: 140 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const realFetch2 = globalThis.fetch;
    globalThis.fetch = liveFakeFetch;
    try {
      const r = await handleExtract("https://www.terabox.com/s/1abc");

      // A. Extraction should succeed with live structure
      assert(r.ok === true, "live structure: extraction succeeds");

      // B. sign extracted from URL query param
      assert(r.download_url === FAKE_DOWNLOAD_RESPONSE.dlink, "live structure: download_url correct");

      // C. Verify the POST body has the extracted live tokens
      const dlReq = liveRequests.find((q) => q.url.includes("/api/download"));
      assert(!!dlReq, "live structure: /api/download called");
      const dlBodyParams = dlReq ? new URLSearchParams(dlReq.init.body) : new URLSearchParams();
      assert(dlBodyParams.get("jsToken") === "LIVE_JS_TOKEN", "live structure: jsToken extracted");
      assert(dlBodyParams.get("sign") === "LIVE_SIGN_abcdef", "live structure: sign from URL query");
      assert(dlBodyParams.get("timestamp") === "1786516969", "live structure: timestamp from time= param");
      assert(dlBodyParams.get("bdstoken") === "LIVE_BDSTOKEN_xyz", "live structure: bdstoken from JSON");

      // D. No sensitive token values leaked in diagnostics
      const logText = liveLogs.join("\n");
      for (const tok of LIVE_TOKENS) {
        assert(!logText.includes(tok), `live structure: diagnostics do not leak ${tok.slice(0, 8)}...`);
      }
    } finally {
      globalThis.fetch = realFetch2;
      console.log = realLog2;
    }
  }

  // Invalid URL
  const r1 = await handleExtract("https://google.com/s/1abc");
  assert(r1.ok === false, "handleExtract rejects non-terabox URL");
  assert(r1.error, "handleExtract provides error message");

  // No share id
  const r2 = await handleExtract("https://www.terabox.com");
  assert(r2.ok === false, "handleExtract rejects URL without share id");

  console.log(`\n${passed} passed, ${failures} failed`);
})();
