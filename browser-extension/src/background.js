// background.js
// MV3 service worker. Receives extraction jobs from the teraplayer.in page
// (via content-teraplayer.js), performs the TeraBox extraction using the
// user's own browser session, and POSTs only the resulting PreviewResponse
// to the TeraPlayer backend.
//
// SECURITY: cookies/ndus/session headers are NEVER sent to TeraPlayer. The
// browser attaches TeraBox cookies only to TeraBox requests (credentials:
// "include"). The backend submit body contains just the preview data.

import { handleExtract, isTeraboxUrl, extractShareId } from "./extract.js";

const DEFAULT_BACKEND_URL = "https://www.teraplayer.in";

// Current job state, exposed to the popup via storage.session.
let currentJob = null;
let currentStatus = { state: "idle", message: "" };

const DEFAULT_STATUS = { state: "idle", message: "" };

function setStatus(state, message) {
  currentStatus = { state, message };
  chrome.storage.session.set({ status: currentStatus }).catch(() => {});
  chrome.runtime.sendMessage({ type: "TP_STATUS_UPDATED", status: currentStatus }).catch(() => {});
}

function getBackendUrl(job) {
  const raw = (job && job.backendUrl) || DEFAULT_BACKEND_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

// Opens (or focuses) a TeraBox tab for the given share URL. The user is
// expected to be logged in there; if verification is required they complete
// it manually in this tab — we never automate it.
async function ensureTeraBoxTab(teraboxUrl) {
  try {
    const existing = await chrome.tabs.query({ url: "*://*.terabox.com/*" });
    const match = existing.find(
      (t) => t.url && t.url.includes(extractShareId(teraboxUrl) || "__never__")
    );
    if (match && match.id != null) {
      await chrome.tabs.update(match.id, { active: true });
      return match.id;
    }
  } catch {}

  const tab = await chrome.tabs.create({ url: teraboxUrl, active: true });
  return tab.id;
}

// Full extraction + submit pipeline for a job.
async function runExtraction(job) {
  if (!job || !job.job_id || !job.submit_token) {
    setStatus("error", "Invalid job: missing job_id or submit_token.");
    return { ok: false, error: "invalid job" };
  }

  const url = (job.url || "").trim();
  if (!url || !isTeraboxUrl(url)) {
    setStatus("error", "Not a valid TeraBox link.");
    return { ok: false, error: "invalid url" };
  }

  const backendUrl = getBackendUrl(job);
  if (!backendUrl) {
    setStatus("error", "Invalid backend URL for submission.");
    return { ok: false, error: "invalid backend url" };
  }

  currentJob = job;
  setStatus("extracting", "Extracting link with your TeraBox session…");

  // Open a TeraBox tab so the user's session is present and warm; required
  // for the browser to attach cookies to the same-origin TeraBox requests.
  const shareUrl = job.terabox_url || url;
  const tabId = await ensureTeraBoxTab(shareUrl);

  try {
    const result = await handleExtract(url, job.password || "");
    console.log("[TEMP-DIAG] handleExtract ->", JSON.stringify({ ok: result.ok, verification_required: result.verification_required, password_required: result.password_required, error: result.error, title: result.title }));

    if (result.verification_required) {
      setStatus(
        "verification_required",
        "TeraBox requires verification. Complete it in the open TeraBox tab, then click Retry."
      );
      return { ok: false, verification_required: true, tabId };
    }

    if (!result.ok) {
      if (result.password_required) {
        setStatus(
          "password_required",
          result.error || "This link is password protected."
        );
      } else {
        setStatus("error", result.error || "Extraction failed.");
      }
      return { ok: false, ...result, tabId };
    }

    const submitResult = await submitToBackend(backendUrl, job, result);
    if (!submitResult.ok) {
      setStatus("error", submitResult.error || "Failed to submit result to TeraPlayer.");
      return { ok: false, error: submitResult.error, tabId };
    }

    setStatus("done", "Extraction complete and sent to TeraPlayer.");
    return { ok: true, tabId };
  } catch (err) {
    setStatus("error", err?.message || "Unexpected extraction error.");
    return { ok: false, error: err?.message, tabId };
  }
}

// POST only {job_id, token, preview} to the TeraPlayer backend. No cookies,
// no session headers, no credentials. If cookies are the user's TeraBox
// session, they must not leave the TeraBox origin — and they don't.
async function submitToBackend(backendUrl, job, preview) {
  const body = {
    job_id: job.job_id,
    token: job.submit_token,
    preview,
  };

  try {
    const submitUrl = `${backendUrl}/api/extension/submit`;
    console.log("[TEMP-DIAG] submitting to", submitUrl);
    const resp = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(body),
    });
    console.log("[TEMP-DIAG] submit response", resp.status, resp.url);

    if (!resp.ok) {
      let detail = "";
      try {
        const data = await resp.json();
        detail = data.detail || data.error || "";
      } catch {}
      return { ok: false, error: `Backend returned ${resp.status}${detail ? `: ${detail}` : ""}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Network error contacting TeraPlayer: ${err?.message}` };
  }
}

// Called by content-teraplayer.js when a pending job is ready on the page.
function onExtractRequest(request, sender, sendResponse) {
  const job = {
    ...(request.job || {}),
    backendUrl:
      (request.job && request.job.backendUrl) ||
      (sender && sender.url ? new URL(sender.url).origin : DEFAULT_BACKEND_URL),
  };
  console.log("[TEMP-DIAG] received TP_EXTRACT_REQUEST job_id=", job.job_id, "url=", job.url, "backendUrl=", job.backendUrl);
  setStatus("extracting", "Starting extraction…");
  runExtraction(job).then((res) => sendResponse(res));
  return true; // async sendResponse
}

// Called by the popup's Retry button after the user completes verification.
function onRetryRequest(_request, _sender, sendResponse) {
  if (!currentJob) {
    setStatus("idle", "No pending job. Start a new extraction from TeraPlayer.");
    sendResponse({ ok: false, error: "no job" });
    return;
  }
  runExtraction(currentJob).then((res) => sendResponse(res));
  return true;
}

// content-terabox.js tells us the user finished the TeraBox verification
// (detected from the page DOM). We then retry the same job. No CAPTCHA is
// ever automated — the user did it manually.
function onVerificationComplete(_request, _sender, sendResponse) {
  if (currentJob && currentStatus.state === "verification_required") {
    setStatus("extracting", "Verification complete — retrying…");
    runExtraction(currentJob).then((res) => sendResponse(res));
    return true;
  }
  sendResponse({ ok: false, reason: "no pending verification" });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request?.type) {
    case "TP_EXTRACT_REQUEST":
      return onExtractRequest(request, sender, sendResponse);
    case "TP_RETRY":
      return onRetryRequest(request, sender, sendResponse);
    case "TP_VERIFY_DONE":
      return onVerificationComplete(request, sender, sendResponse);
    case "TP_GET_STATUS":
      chrome.storage.session
        .get({ status: DEFAULT_STATUS })
        .then(({ status }) => sendResponse(status || DEFAULT_STATUS))
        .catch(() => sendResponse(DEFAULT_STATUS));
      return true;
    default:
      return false;
  }
});

// Keep the service worker alive while an extraction is in flight.
chrome.runtime.onSuspend.addListener(() => {
  if (currentStatus.state === "extracting") {
    setStatus("idle", "Background worker suspended during extraction. Retry from TeraPlayer.");
  }
});

// Prime the stored status so the popup has something to show immediately.
setStatus("idle", "Ready");
