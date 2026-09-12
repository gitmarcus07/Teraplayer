/**
 * Post-build prerendering - makes every public route a real multi-page load.
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
 * load - the browser shows its loading state and content paints instantly
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
const { execSync } = require("child_process");

const BUILD_DIR = path.join(__dirname, "..", "build");
const ROUTES = ["/", "/about", "/contact", "/help-center", "/privacy", "/terms"];

// Fail the build when prerendering fails so a blank-shell deploy can never
// ship silently. Opt out with PRERENDER_STRICT=0 (not recommended ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â
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
// before crawling ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â never a file already overwritten by a previous route's
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

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];

async function launchSparticuzChromium() {
  // Serverless Chromium for minimal containers such as Vercel.
  const mod = require("@sparticuz/chromium");
  const chromium = mod && mod.default ? mod.default : mod;
  const puppeteerCore = require("puppeteer-core");

  if (typeof chromium.executablePath !== "function" || !Array.isArray(chromium.args)) {
    throw new Error("@sparticuz/chromium API mismatch (missing executablePath/args)");
  }

  const executablePath = await chromium.executablePath();

  return await puppeteerCore.launch({
    args: [...chromium.args, ...LAUNCH_ARGS],
    defaultViewport: { width: 1366, height: 900 },
    executablePath,
    headless: chromium.headless,
  });
}

async function launchBrowserWithAutoInstall(puppeteer) {
  // 1. Full Chrome ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â fast path wherever OS libraries exist (local dev,
  // typical CI images with system libs).
  try {
    return await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
  } catch (fullErr) {
    const firstLine = (fullErr.message || "").split("\n")[0];
    console.log(`[prerender] Full Chrome launch failed (${firstLine}) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â trying serverless Chromium buildÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`);
    // 2. Serverless Chromium ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â for minimal containers (Vercel) where full
    // Chrome fails with missing .so libraries (e.g. libnspr4.so).
    try {
      return await launchSparticuzChromium();
    } catch (sparticuzErr) {
      // 3. Last resort: the host may simply lack the cached binary while
      // having system libs. Install full Chrome, then retry once.
      if (!/could not find chrome/i.test(fullErr.message || "")) {
        throw new Error(
          `full Chrome: ${firstLine} | serverless Chromium: ${(sparticuzErr.message || "").split("\n")[0]}`
        );
      }
      // Fresh CI builder (e.g. Render) where the puppeteer browser cache
      // isn't persisted between builds: install the binary, then retry once.
      // Uses the project's own puppeteer CLI, so no extra download tooling.
      console.log("[prerender] Chrome binary missing ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â installing it now (one-time per builder)ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦");
      try {
        execSync("npx puppeteer browsers install chrome", { stdio: "inherit", timeout: 10 * 60 * 1000 });
      } catch (installErr) {
        throw new Error(`Chrome auto-install failed: ${installErr.message}`);
      }
      return await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
    }
  }
}

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
    browser = await launchBrowserWithAutoInstall(puppeteer);
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
      // (whileInView) sections settleÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
      await page.waitForSelector("main", { timeout: 30000 }).catch(() => {});
      // ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦scroll through once so every scroll-triggered section renders
      // its final (visible) state into the snapshotÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
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
  fail(`failed (${e.message}) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â NOT shipping: fix the error above or the deploy would serve blank HTML to crawlers`);
});
