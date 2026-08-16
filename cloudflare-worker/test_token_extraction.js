// Synthetic test fixtures for token extraction validation
// Run with: node test_token_extraction.js

// Copy the exact functions from the worker for testing

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

function extractTokenAll(text, patterns) {
  const results = [];
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags + "g");
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[1] !== "0") {
        results.push(match[1]);
      }
    }
  }
  return results;
}

function sanitizeQueryString(text) {
  return String(text)
    .replace(/(csrfToken|browserid|TSID|ndus|pcftoken|bdstoken|sign|timestamp|shareid|uk|dp-logid|jsToken|pwd)=[^&]+/gi, "$1=REDACTED");
}

function redactTokenLike(text) {
  return String(text)
    .replace(/(csrfToken|browserid|TSID|ndus|pcftoken|bdstoken|sign|timestamp|shareid|rand|dp-logid|yjs_nuo[^=]*)\s*=\s*["']?[^"'\s;&<,]+/gi, "$1=REDACTED")
    .replace(/jsToken\s*=\s*fn\s*\(\s*["']([^"']+)["']\s*\)/gi, 'jsToken=REDACTED')
    .replace(/jsToken\s*=\s*["']([^"']+)["']/gi, 'jsToken=REDACTED')
    .replace(/[A-Za-z0-9_\-%]{32,}/g, "REDACTED");
}

// Test fixtures matching observed live HTML structures
const FIXTURES = {
  // Fixture 1: HTML with escaped query parameters containing sign and time
  queryParamsEscaped: `
    <html>
    <body>
    <a href="/api/download?fid=12345&time=1723456789&t=123&sign=abc123signature&bdstoken=xyz789">Download</a>
    </body>
    </html>
  `,

  // Fixture 2: JSON in script tag with bdstoken, share_id, uk
  scriptTagJson: `
    <html>
    <head>
    <script>
    var templateData = {"bdstoken":"SAFE_BDSTOKEN","share_id":"987654321","uk":"4401146149342"};
    window.bdstoken = "SAFE_BDSTOKEN";
    window.shareid = "987654321";
    window.uk = "4401146149342";
    </script>
    </head>
    </html>
  `,

  // Fixture 3: jsToken in various forms
  jsTokenForms: `
    <html>
    <body>
    <script>
    window.jsToken = fn("SAFE_JSTOKEN_12345");
    </script>
    </body>
    </html>
  `,

  // Fixture 4: Mixed - uk=0 present but real uk also available
  ukZeroWithReal: `
    <html>
    <body>
    <script>
    var data = {"uk":"0","uk":"4401146149342","shareid":"123456789"};
    window.uk = "0";
    window.uk = "4401146149342";
    </script>
    </body>
    </html>
  `,

  // Fixture 5: share_id with underscore (current live format)
  shareIdUnderscore: `
    <html>
    <body>
    <script>
    var config = {"share_id":"10524102871","uk":"4401146149342"};
    </script>
    </body>
    </html>
  `,

  // Fixture 6: bdstoken in various JSON forms
  bdstokenForms: `
    <html>
    <body>
    <script>
    var MYBDSTOKEN = "SAFE_BDSTOKEN_VALUE";
    window.bdstoken = "SAFE_BDSTOKEN_VALUE";
    </script>
    <div data-bdstoken="SAFE_BDSTOKEN_VALUE"></div>
    </body>
    </html>
  `,
};

// Exact patterns from the updated worker
const SIGN_PATTERNS = [
  /[?&](?:amp;)?sign=([^&"'\s<>]+)/i,
  /window\.sign\s*=\s*["']([^"']+)["']/,
  /"sign"\s*:\s*"([^"]+)"/,
  /'sign'\s*:\s*'([^']+)'/,
  /sign%22%3A%22([^%]+)%22/,
];

const TIMESTAMP_PATTERNS = [
  /[?&](?:amp;)?time=(\d+)/i,
  /window\.timestamp\s*=\s*["']?(\d+)["']?/,
  /"timestamp"\s*:\s*(\d+)/,
  /'timestamp'\s*:\s*'(\d+)'/,
];

const SHAREID_PATTERNS = [
  /"share_id"\s*:\s*"(\d+)"/,
  /'share_id'\s*:\s*'(\d+)'/,
  /window\.shareid\s*=\s*["']?(\d+)["']?/,
  /"shareid"\s*:\s*(\d+)/,
  /'shareid'\s*:\s*'(\d+)'/,
  /shareid%22%3A(\d+)/,
];

const UK_PATTERNS = [
  /"uk"\s*:\s*"(\d+)"/,
  /'uk'\s*:\s*'(\d+)'/,
  /window\.uk\s*=\s*["']?(\d+)["']?/,
  /uk%22%3A(\d+)/,
];

const BDSTOKEN_PATTERNS = [
  /"bdstoken"\s*:\s*"([^"]+)"/,
  /'bdstoken'\s*:\s*'([^']+)'/,
  /window\.bdstoken\s*=\s*["']([^"']+)["']/,
  /bdstoken%22%3A%22([^%]+)%22/,
];

const VERIFY_ERRNO = new Set([400141, 4000020]);
const VERIFY_PHRASES = [
  "need verify",
  "verify required",
  "verification required",
  "pi verify",
];

function normalizeErrno(errno) {
  if (errno === null || errno === undefined || errno === "") return errno;
  const n = Number(errno);
  return Number.isNaN(n) ? errno : n;
}

function isVerificationErrorText(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return VERIFY_PHRASES.some((p) => lower.includes(p));
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
  } catch { }
  return null;
}

function canonicalShortUrl(surl) {
  return String(surl || "").replace(/^1/, "");
}

function buildSharePageCandidates(domain, surl, password) {
  const short = canonicalShortUrl(surl);
  const pwdParam = password ? `&pwd=${encodeURIComponent(password)}` : "";
  return [
    `https://${domain}/sharing/link?surl=${short}${pwdParam}`,
    `https://${domain}/s/${short}`,
    `https://${domain}/s/1${short}`,
  ];
}

function detectVerificationResponse(bodyText) {
  if (!bodyText) return null;
  const trimmed = String(bodyText).trim();
  if (!trimmed.startsWith("{")) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const errno = normalizeErrno(parsed.errno);
  const errmsg = parsed.errmsg || parsed.error_msg || "";
  if ((errno != null && VERIFY_ERRNO.has(errno)) || isVerificationErrorText(errmsg)) {
    return { errno, errmsg };
  }
  return null;
}

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: jsToken extraction
  const jsTokenHtml = FIXTURES.jsTokenForms;
  let jsToken = extractStr(jsTokenHtml, "fn%28%22", "%22%29");
  if (!jsToken) jsToken = extractStr(jsTokenHtml, "fn(", '"');
  if (!jsToken) {
    const m = jsTokenHtml.match(/window\.jsToken[^=]*=\s*fn\s*\(\s*["']([^"']+)["']/);
    if (m) jsToken = m[1];
  }
  if (!jsToken) {
    const m = jsTokenHtml.match(/fn(?:%28|\()(?:%22|%27|["'])([^%'"()]+)(?:%22|%27|["'])(?:%29|\))/);
    if (m) jsToken = m[1];
  }
  assert(jsToken === "SAFE_JSTOKEN_12345", "jsToken extracted from fn(token) format");

  // Test 2: sign from escaped query param
  const sign = extractToken(FIXTURES.queryParamsEscaped, SIGN_PATTERNS);
  assert(sign === "abc123signature", "sign extracted from &sign=VALUE");

  // Test 3: timestamp from time param
  const timestamp = extractToken(FIXTURES.queryParamsEscaped, TIMESTAMP_PATTERNS);
  assert(timestamp === "1723456789", "timestamp extracted from &time=VALUE");

  // Test 4: bdstoken from JSON in script
  const bdstoken = extractToken(FIXTURES.scriptTagJson, BDSTOKEN_PATTERNS);
  assert(bdstoken === "SAFE_BDSTOKEN", "bdstoken extracted from JSON in script tag");

  // Test 5: share_id with underscore
  const shareid = extractToken(FIXTURES.shareIdUnderscore, SHAREID_PATTERNS);
  assert(shareid === "10524102871", "share_id extracted from JSON with underscore");

  // Test 6: uk extraction preferring non-zero
  let uk = extractToken(FIXTURES.ukZeroWithReal, UK_PATTERNS);
  if (uk === "0") {
    const ukCandidates = extractTokenAll(FIXTURES.ukZeroWithReal, UK_PATTERNS);
    if (ukCandidates.length > 0) {
      uk = ukCandidates[0];
    }
  }
  assert(uk === "4401146149342", "uk extracted as non-zero value (rejecting '0')");

  // Test 7: uk extraction from scriptTagJson (real case)
  uk = extractToken(FIXTURES.scriptTagJson, UK_PATTERNS);
  if (uk === "0") {
    const ukCandidates = extractTokenAll(FIXTURES.scriptTagJson, UK_PATTERNS);
    if (ukCandidates.length > 0) {
      uk = ukCandidates[0];
    }
  }
  assert(uk === "4401146149342", "uk extracted from scriptTagJson");

  // Test 8: bdstoken from multiple forms
  const bdstoken2 = extractToken(FIXTURES.bdstokenForms, BDSTOKEN_PATTERNS);
  assert(bdstoken2 === "SAFE_BDSTOKEN_VALUE", "bdstoken extracted from window.bdstoken assignment");

  // Test 9: No real credentials in logs (redaction test)
  const testHtml = `window.ndus="REAL_COOKIE_VALUE"; window.jsToken=fn("REAL_JSTOKEN"); window.sign="REAL_SIGN";`;
  const redacted = redactTokenLike(testHtml);
  assert(!redacted.includes("REAL_COOKIE_VALUE"), "ndus redacted in logs");
  assert(!redacted.includes("REAL_JSTOKEN"), "jsToken redacted in logs");
  assert(!redacted.includes("REAL_SIGN"), "sign redacted in logs");
  assert(redacted.includes("REDACTED"), "redacted marker present");

  // Test 10: sign also matches normal &sign= (not just &)
  const normalQuery = `<a href="/api/download?fid=123&sign=normalsign123">`;
  const signNormal = extractToken(normalQuery, SIGN_PATTERNS);
  assert(signNormal === "normalsign123", "sign extracted from normal &sign=VALUE");

  // Test 11: timestamp also matches normal &time=
  const normalTime = `<a href="/api/download?fid=123&time=1723456789">`;
  const tsNormal = extractToken(normalTime, TIMESTAMP_PATTERNS);
  assert(tsNormal === "1723456789", "timestamp extracted from normal &time=VALUE");

  // Test 12: shareid also matches window.shareid
  const windowShareid = `<script>window.shareid = "999888777";</script>`;
  const wsShareid = extractToken(windowShareid, SHAREID_PATTERNS);
  assert(wsShareid === "999888777", "shareid extracted from window.shareid");

  // Test 13: bdstoken also matches window.bdstoken
  const windowBdstoken = `<script>window.bdstoken = "window_bdstoken_123";</script>`;
  const wbBdstoken = extractToken(windowBdstoken, BDSTOKEN_PATTERNS);
  assert(wbBdstoken === "window_bdstoken_123", "bdstoken extracted from window.bdstoken");

  // Test 14: Query string sanitization (log redaction regression test)
  const testParams = "jsToken=SAFE_JSTOKEN&sign=SAFE_SIGN&timestamp=SAFE_TIMESTAMP&bdstoken=SAFE_BDSTOKEN&ndus=SAFE_NDUS&pwd=SECRET_PWD&shorturl=abc123&uk=4401146149342&shareid=987654321";
  const sanitized = sanitizeQueryString(testParams);
  assert(!sanitized.includes("SAFE_JSTOKEN"), "jsToken redacted in query string");
  assert(!sanitized.includes("SAFE_SIGN"), "sign redacted in query string");
  assert(!sanitized.includes("SAFE_TIMESTAMP"), "timestamp redacted in query string");
  assert(!sanitized.includes("SAFE_BDSTOKEN"), "bdstoken redacted in query string");
  assert(!sanitized.includes("SAFE_NDUS"), "ndus redacted in query string");
  assert(sanitized.includes("jsToken=REDACTED"), "jsToken redaction marker present");
  assert(sanitized.includes("sign=REDACTED"), "sign redaction marker present");
  assert(sanitized.includes("timestamp=REDACTED"), "timestamp redaction marker present");
  assert(sanitized.includes("bdstoken=REDACTED"), "bdstoken redaction marker present");
  assert(sanitized.includes("ndus=REDACTED"), "ndus redaction marker present");
  assert(sanitized.includes("uk=REDACTED"), "uk redacted in query string");
  assert(sanitized.includes("shareid=REDACTED"), "shareid redacted in query string");
  assert(sanitized.includes("pwd=REDACTED"), "pwd redacted in query string");
  assert(!sanitized.includes("SECRET_PWD"), "pwd value redacted in query string");
  assert(sanitized.includes("shorturl=abc123"), "non-sensitive params preserved");

  // Test 15: extractCookieNames with JSON object cookie
  {
    const cookieJson = '{"browserid":"abc123","TSID":"xyz789","csrfToken":"def456","ndus":"ndus123","lang":"en"}';
    const { names: extractedNames, cookieHeader, cookieCount } = extractCookieNames(cookieJson);
    assert(cookieCount === 5, "extractCookieNames reports cookieCount=5 for JSON object");
    assert(extractedNames.has("browserid"), "extractCookieNames extracts browserid from JSON");
    assert(extractedNames.has("TSID"), "extractCookieNames extracts TSID from JSON");
    assert(extractedNames.has("csrfToken"), "extractCookieNames extracts csrfToken from JSON");
    assert(extractedNames.has("ndus"), "extractCookieNames extracts ndus from JSON");
    assert(extractedNames.has("lang"), "extractCookieNames extracts lang from JSON");
    assert(cookieHeader === "ndus=ndus123; lang=en;", "extractCookieNames constructs cookieHeader from JSON ndus");
  }

  // Test 16: extractCookieNames with semicolon-separated cookie string
  {
    const cookieJson = "browserid=abc123; TSID=xyz789; csrfToken=def456; ndus=ndus123; lang=en";
    const { names: extractedNames2, cookieHeader: header2, cookieCount: count2 } = extractCookieNames(cookieJson);
    assert(count2 === 5, "extractCookieNames reports cookieCount=5 for semicolon string");
    assert(extractedNames2.has("browserid"), "extractCookieNames extracts browserid from string");
    assert(extractedNames2.has("TSID"), "extractCookieNames extracts TSID from string");
    assert(extractedNames2.has("csrfToken"), "extractCookieNames extracts csrfToken from string");
    assert(extractedNames2.has("ndus"), "extractCookieNames extracts ndus from string");
    assert(extractedNames2.has("lang"), "extractCookieNames extracts lang from string");
    assert(header2 === "browserid=abc123; TSID=xyz789; csrfToken=def456; ndus=ndus123; lang=en", "extractCookieNames preserves string header");
  }

  // Test 17: extractCookieNames with ndus-only string
  {
    const cookieJson = "ndus=ndus123";
    const { names: extractedNames3, cookieHeader: header3, cookieCount: count3 } = extractCookieNames(cookieJson);
    assert(count3 === 1, "extractCookieNames reports cookieCount=1 for ndus-only");
    assert(extractedNames3.has("ndus"), "extractCookieNames extracts ndus from ndus-only string");
    assert(header3 === "ndus=ndus123", "extractCookieNames header matches input for ndus-only");
  }

  // Test 18: extractCookieNames with empty/null
  {
    const { names: extractedNames4, cookieCount: count4 } = extractCookieNames("");
    assert(count4 === 0, "extractCookieNames reports cookieCount=0 for empty string");
    assert(extractedNames4.size === 0, "extractCookieNames returns empty Set for empty string");

    const { cookieCount: count5 } = extractCookieNames(undefined);
    assert(count5 === 0, "extractCookieNames reports cookieCount=0 for undefined");

    const { cookieCount: count6 } = extractCookieNames(null);
    assert(count6 === 0, "extractCookieNames reports cookieCount=0 for null");
  }

  // Test 19: extractShareId from a full /s/1XXX share link
  const shareIdFromFull = extractShareId("https://1024terabox.com/s/1E6A5yMdGvczJJAoR3tTqpg");
  assert(shareIdFromFull === "E6A5yMdGvczJJAoR3tTqpg", "extractShareId strips the leading '1' prefix from /s/1<shorturl>");

  // Test 20: extractShareId from a short /s/XXX share link (no '1' prefix)
  const shareIdShort = extractShareId("https://1024terabox.com/s/E6A5yMdGvczJJAoR3tTqpg");
  assert(shareIdShort === "E6A5yMdGvczJJAoR3tTqpg", "extractShareId keeps short URLs without a '1' prefix intact");

  // Test 21: extractShareId from a sharing/link?surl= URL
  const shareIdQuery = extractShareId("https://www.terabox.com/sharing/link?surl=E6A5yMdGvczJJAoR3tTqpg");
  assert(shareIdQuery === "E6A5yMdGvczJJAoR3tTqpg", "extractShareId reads the surl query parameter");

  // Test 22: canonicalShortUrl never keeps a leading '1' prefix
  assert(canonicalShortUrl("1E6A5yMdGvczJJAoR3tTqpg") === "E6A5yMdGvczJJAoR3tTqpg", "canonicalShortUrl strips a leading '1' prefix");
  assert(canonicalShortUrl("E6A5yMdGvczJJAoR3tTqpg") === "E6A5yMdGvczJJAoR3tTqpg", "canonicalShortUrl leaves short URLs without a '1' prefix untouched");

  // Test 23: share page candidates never use the prefixed value as `surl=`
  {
    const cands = buildSharePageCandidates("www.1024tera.com", "E6A5yMdGvczJJAoR3tTqpg");
    assert(cands.length === 3, "buildSharePageCandidates returns exactly 3 candidates per domain");
    const hasPrefixedSurl = cands.some((u) => /surl=1E6A5yMdGvczJJAoR3tTqpg/.test(u));
    assert(!hasPrefixedSurl, "candidates never emit surl=1E6A5yMdGvczJJAoR3tTqpg (prefixed value rejected)");
    assert(cands.some((u) => u.includes("surl=E6A5yMdGvczJJAoR3tTqpg")), "candidates use the canonical short URL in surl=");
    assert(cands.some((u) => u === "https://www.1024tera.com/s/1E6A5yMdGvczJJAoR3tTqpg"), "candidates keep the full /s/1<shorturl> path form");
    assert(cands.some((u) => u === "https://www.1024tera.com/s/E6A5yMdGvczJJAoR3tTqpg"), "candidates keep the short /s/<shorturl> path form");
  }

  // Test 24: detect errno 400141 / "need verify" verification response
  {
    const vr = detectVerificationResponse('{"errno":400141,"errmsg":"need verify","request_id":"abc"}');
    assert(vr !== null && vr.errno === 400141 && vr.errmsg === "need verify", "detects errno=400141 need verify as a verification response");
  }

  // Test 25: verification detection ignores normal HTML / non-verification JSON
  {
    assert(detectVerificationResponse("<!doctype html>...") === null, "verification detection ignores normal HTML pages");
    assert(detectVerificationResponse('{"errno":0,"list":[]}') === null, "verification detection ignores successful JSON");
    assert(detectVerificationResponse("") === null, "verification detection ignores empty bodies");
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  return failed === 0;
}

// Extract cookie names from cookie string/JSON, reporting only names (not values)
function extractCookieNames(cookieJson) {
  const names = new Set();
  if (!cookieJson) return { names, cookieHeader: "", cookieCount: 0 };
  let cookieHeader = "";
  if (cookieJson.startsWith("{")) {
    try {
      const parsed = JSON.parse(cookieJson);
      if (typeof parsed === "object" && parsed !== null) {
        for (const key of Object.keys(parsed)) {
          names.add(key);
        }
        const ndus = parsed.ndus;
        if (ndus) cookieHeader = `ndus=${ndus}; lang=en;`;
      }
    } catch {}
  } else {
    const parts = cookieJson.split(/;\s*/);
    for (const part of parts) {
      const eq = part.indexOf("=");
      if (eq > 0) {
        names.add(part.slice(0, eq).trim());
      }
    }
    if (cookieJson.includes("ndus=")) cookieHeader = cookieJson;
  }
  return { names, cookieHeader, cookieCount: names.size };
}

const success = runTests();
process.exit(success ? 0 : 1);