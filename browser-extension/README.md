# TeraPlayer Browser Extension (Extraction Helper)

Manifest V3 extension that resolves TeraBox share links **using your own
TeraBox browser session** and sends only the resulting preview to TeraPlayer.

## Why this exists

TeraPlayer's backend cannot reliably resolve TeraBox shares server-side
(TeraBox blocks datacenter IPs, requires the user's real session cookies, and
frequently forces verification). This extension moves that extraction into the
user's own browser, where the TeraBox session is real and legitimate.

## Security model

- **Nothing leaves TeraBox except the preview.** The extension performs all
  TeraBox API calls with `credentials: "include"`, so your TeraBox cookies are
  attached only to TeraBox-origin requests by the browser itself. They are
  never read, copied, or forwarded anywhere.
- **No automation of verification or CAPTCHA.** If TeraBox asks for a captcha
  or verification, the extension stops and asks *you* to complete it in the
  open TeraBox tab, then click Retry. The retry is triggered by your manual
  action or by a DOM observation that the verification overlay is gone — never
  by attempting to solve it.
- **Minimal backend contact.** The extension POSTs only
  `{ job_id, token, preview }` to `POST /api/extension/submit`. It never sends
  cookies, session headers, `ndus`, or credentials.
- **HMAC-bound jobs.** The `token` is derived from the `job_id` (HMAC), so a
  submitted preview can only be attached to the job the frontend created.
  See `backend/services/extension_jobs.py`.
- **No credentials stored.** The extension stores nothing persistent. Job
  state lives in `chrome.storage.session` (cleared when the browser closes).

## Architecture

```
teraplayer.in page
   |  window.__TERAPLAYER_EXT_JOB__ = { job_id, submit_token, url, terabox_url, password?, backendUrl? }
   v
content-teraplayer.js (matches https://www.teraplayer.in/*)
   |  chrome.runtime.sendMessage({ type: "TP_EXTRACT_REQUEST", job })
   v
background.js (MV3 service worker)
   |  opens/refocuses a terabox.com tab (user's session, warm cookies)
   |  handleExtract() -> GET /share/list + GET /api/download (credentials: include)
   |  submitToBackend() -> POST { job_id, token, preview }  (credentials: omit)
   v
TeraPlayer backend  (POST /api/extension/submit)
```

Flow:

1. User pastes a TeraBox link on teraplayer.in. The frontend calls
   `POST /api/extension/create`, gets back `{ job_id, submit_token,
   terabox_url }`, and publishes the job to the page.
2. `content-teraplayer.js` picks up the job and forwards it to the background
   service worker.
3. The background worker opens/focuses the TeraBox tab, runs the extraction
   using the user's real session, and submits the preview to the backend.
4. The frontend polls `GET /api/extension/result/{job_id}` until
   `status == "done"` and renders the preview.

## Directory layout

```
manifest.json            MV3 manifest (host permissions, content scripts)
popup.html / popup.js    Status + Retry popup
src/extract.js           Pure extraction logic (share list + download API)
src/background.js        Service worker: job handling, TeraBox tab, submit
src/content-teraplayer.js  Picks up jobs from the teraplayer.in page
src/content-terabox.js   Detects manual verification completion on TeraBox
tests/                   Node-based unit tests for extract.js
```

## Install (development)

1. Build/verify syntax:
   ```
   node --check src/extract.js src/background.js src/content-teraplayer.js src/content-terabox.js popup.js
   ```
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select this `browser-extension` directory.
4. On teraplayer.in, paste a TeraBox link. The extension resolves it with your
   session. If verification is required, complete it in the TeraBox tab and
   click **Retry** in the extension popup.

## Tests

```
node tests/run.js
```

Covers: share-id extraction, URL validation, share-list URL construction,
download-URL construction, file picking (largest non-directory), and download
response parsing. No network calls are made.

## Notes / limitations

- You must be logged into TeraBox in the same browser profile the extension
  runs in.
- `d.pcs.baidu.com` / CDN links are returned as-is; the manifest grants CDN
  host permissions but they are only used if the user clicks a download link.
- TeraBox may change its API. If extraction fails, the popup shows the exact
  step that failed.
