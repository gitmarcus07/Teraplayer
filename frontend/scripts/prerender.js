/**
 * Post-build prerendering — makes every public route a real multi-page load.
 *
 * After `craco build`, this crawls the static build with headless Chromium
 * and writes a fully rendered `index.html` for each route:
 *   build/index.html               (home, already rendered by the build)
 *   build/about/index.html
 *   build/contact/index.html
 *   build/help-center/index.html
 *   build/privacy/index.html
 *   build/terms/index.html
 *
 * Result: opening any page (link, refresh, direct URL) is a full document
 * load — the browser shows its loading state and content paints instantly
 * without waiting for JS. React then hydrates (see src/index.js) and
 * in-app navigation stays instant SPA-style.
 *
 * Failure handling: see STRICT MODE below. In short, a broken prerender
 * fails the build by default so blank HTML can never ship silently.
 *
 * STRICT MODE (default ON): any prerender failure fails the build instead.
 * A blank-shell deploy is invisible to visitors (the SPA still boots) but
 * crawlers and reviewers (Google AdSense, Search) see an empty page, which
 * reads as "low value content" / "site unavailable". Failing loudly makes
 * a broken prerender impossible to miss in deploy logs.
 * Set PRERENDER_STRICT=0 to restore the old warn-and-continue behaviour,
 * but only if you understand the tradeoff above.
 */
const fs = require("fs");
const http = require("http");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "..", "build");
const ROUTES = ["/", "/about", "/contact", "/help-center", "/privacy", "/terms"];

// Fail the build when prerendering fails so a blank-shell deploy can never
// ship silently. Opt out with PRERENDER_STRICT=0 (not recommended —
// crawlers/reviewers would see an empty page).
const STRICT = process.env.PRERENDER_STRICT !== "0";

function fail(message) {
  if (STRICT) {
    console.error(`[prerender] FATAL: ${message} (set PRERENDER_STRICT=0 to downgrade to a warning)`);
    process.exitCode = 1;
  } else {
    console.warn(`[prerender] WARNING: ${message}`);
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

// Minimal static server for the build dir, with SPA fallback so the router
// can render any route from the root shell.
//
// IMPORTANT: the fallback always serves the PRISTINE template captured
// before crawling — never a file already overwritten by a previous route's
// snapshot. Otherwise route N would inherit route N-1's tags and every
// snapshot would end up with duplicate/conflicting SEO tags.
let pristineShell = null;

function createServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.normalize(path.join(BUILD_DIR, urlPath));
    if (!file.startsWith(BUILD_DIR)) {
      res.writeHead(403);
      res.end();
      return;
    }
    // Never serve an already-prerendered route file as the app shell:
    // directory paths always fall back to the pristine template so each
    // route renders fresh from the same shell.
    if (urlPath !== "/" && !path.extname(urlPath)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(pristineShell);
      return;
    }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) file = path.join(file, "index.html");
      fs.readFile(file, (err2, data) => {
        if (err2) {
          // Unknown path: serve the app shell and let the router decide
          // (renders the page, or the 404 view which stays unindexed).
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(pristineShell);
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    fail(`puppeteer not installed, skipping (${e.message})`);
    return;
  }

  // Capture the pristine shell BEFORE any snapshot overwrites build files.
  pristineShell = fs.readFileSync(path.join(BUILD_DIR, "index.html"), "utf8");

  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
  } catch (e) {
    fail(`Chromium could not launch: ${e.message}`);
    server.close();
    return;
  }

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 900 });
      await page.goto(`http://127.0.0.1:${port}${route}`, {
        waitUntil: "networkidle0",
        timeout: 90000,
      });
      // Let lazy chunks, entrance animations and scroll-triggered
      // (whileInView) sections settle…
      await page.waitForSelector("main", { timeout: 30000 }).catch(() => {});
      // …scroll through once so every scroll-triggered section renders
      // its final (visible) state into the snapshot…
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y <= h; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await sleep(1500);
      const html = await page.evaluate(
        () => "<!doctype html>\n" + document.documentElement.outerHTML
      );
      const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route.slice(1));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
      console.log(`[prerender] ${route} -> ${(html.length / 1024).toFixed(1)} KB html`);
      await page.close();
    }
    console.log(`[prerender] done: ${ROUTES.length} routes prerendered`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  fail(`failed (${e.message}) — NOT shipping: fix the error above or the deploy would serve blank HTML to crawlers`);
});
