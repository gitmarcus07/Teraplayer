// content-teraplayer.js
// Injected on https://www.teraplayer.in. It looks for a pending extension
// extraction job published by the TeraPlayer page and hands it to the
// background service worker.
//
// The TeraPlayer page publishes a job either as:
//   - a global:    window.__TERAPLAYER_EXT_JOB__ = { job_id, submit_token, url, terabox_url, password?, backendUrl? }
//   - a DOM event: window.dispatchEvent(new CustomEvent("teraplayer:extension:job", { detail: { job } }))
//
// This script performs NO TeraBox API calls itself — it only relays the job
// to background.js via chrome.runtime.sendMessage.

const JOB_GLOBAL = "__TERAPLAYER_EXT_JOB__";
const JOB_EVENT = "teraplayer:extension:job";

let lastForwardedJobId = null;

function forwardJob(job) {
  if (!job || typeof job !== "object") return;
  if (!job.job_id || !job.submit_token) {
    console.warn("[TeraPlayerExt] Ignoring job without job_id/submit_token");
    return;
  }
  if (job.job_id === lastForwardedJobId) return;
  lastForwardedJobId = job.job_id;

  console.log("[TEMP-DIAG] forwarding job", job.job_id, "url=", job.url, "backendUrl=", job.backendUrl);
  chrome.runtime.sendMessage({ type: "TP_EXTRACT_REQUEST", job }).catch((err) => {
    console.warn("[TeraPlayerExt] Failed to forward job to background:", err);
  });
}

function checkGlobal() {
  try {
    const job = window[JOB_GLOBAL];
    if (job) forwardJob(job);
  } catch {}
}

// The page can dispatch the event before this content script runs, so also
// poll the global for a short window as a safety net.
checkGlobal();
const interval = setInterval(checkGlobal, 500);
setTimeout(() => clearInterval(interval), 10000);

window.addEventListener(JOB_EVENT, (event) => {
  const job = event?.detail?.job || event?.detail;
  forwardJob(job);
});
