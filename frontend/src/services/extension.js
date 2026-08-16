// services/extension.js
// TeraPlayer <-> browser-extension orchestration.
//
// The TeraPlayer extension (browser-extension/) performs the actual TeraBox
// extraction using the user's own browser session. The backend only brokers a
// short-lived, HMAC-bound job:
//
//   1. POST /api/extension/create        -> { job_id, submit_token, terabox_url, status }
//   2. Publish the job so content-teraplayer.js can pick it up.
//   3. Extension opens/focuses TeraBox, extracts, POSTs { job_id, token, preview }.
//   4. Frontend polls GET /api/extension/result/{job_id} until status === "done".
//
// SECURITY: only the job-specific submit_token and URL/result data cross the
// page <-> extension boundary. TeraBox cookies / ndus / session data never
// leave the TeraBox origin, and the HMAC secret never leaves the backend.

import { API_BASE, createExtensionJob, getExtensionJobResult } from "./api";

export const EXT_STATUS = Object.freeze({
  IDLE: "idle",
  CREATING: "creating",
  OPENING: "opening",
  EXTRACTING: "extracting",
  VERIFICATION: "verification",
  DONE: "done",
  ERROR: "error",
  EXTENSION_REQUIRED: "extension_required",
});

// Contract with browser-extension/src/content-teraplayer.js. The page publishes
// the job to a window global AND dispatches a CustomEvent; the content script
// watches both.
export const EXTENSION_JOB_GLOBAL = "__TERAPLAYER_EXT_JOB__";
export const EXTENSION_JOB_EVENT = "teraplayer:extension:job";

// Poll cadence (the backend rate-limits extension_result at 60 req / 60 s).
export const EXT_POLL_INTERVAL_MS = 2000;
export const EXT_OPENING_DURATION_MS = 3000;
export const EXT_VERIFY_GRACE_MS = 12000;
export const EXT_HARD_TIMEOUT_MS = 60000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Publish the pending job in the exact format content-teraplayer.js expects:
// { job_id, submit_token, url, terabox_url, password?, backendUrl? }
export function publishExtensionJob(job) {
  try {
    window[EXTENSION_JOB_GLOBAL] = job;
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(EXTENSION_JOB_EVENT, { detail: { job } }));
  } catch {
    /* ignore */
  }
}

// Create the backend job and publish it for the extension. Returns the raw
// backend response plus the exact payload we published.
export async function createAndPublishExtensionJob(url, password = "") {
  const job = await createExtensionJob(url, password || "");
  const payload = {
    job_id: job.job_id,
    submit_token: job.submit_token,
    url,
    terabox_url: job.terabox_url || url,
    backendUrl: new URL(API_BASE).origin,
    ...(password ? { password } : {}),
  };
  publishExtensionJob(payload);
  return { job, payload };
}

// Full browser-extraction flow: create job -> publish -> poll until done.
//
// `onStatus(state, message)` is called with the statuses the ExtensionStatus
// panel understands. Returns { status } on failure or { status: "done",
// preview } on success. Pass an AbortSignal to stop cleanly.
export async function runExtensionExtraction({
  url,
  password = "",
  onStatus = () => {},
  pollIntervalMs = EXT_POLL_INTERVAL_MS,
  openingDurationMs = EXT_OPENING_DURATION_MS,
  verifyGraceMs = EXT_VERIFY_GRACE_MS,
  hardTimeoutMs = EXT_HARD_TIMEOUT_MS,
  signal,
} = {}) {
  if (!url) {
    onStatus(EXT_STATUS.ERROR, "No link provided for browser extraction.");
    return { status: EXT_STATUS.ERROR };
  }

  onStatus(EXT_STATUS.CREATING, "Preparing browser extraction…");

  let created;
  try {
    created = await createAndPublishExtensionJob(url, password);
  } catch (err) {
    console.error("[extension] create job failed:", err?.message);
    onStatus(
      EXT_STATUS.ERROR,
      err?.response?.data?.detail || err?.message || "Could not create an extraction job."
    );
    return { status: EXT_STATUS.ERROR };
  }
  const { job } = created;

  onStatus(EXT_STATUS.OPENING, "Opening TeraBox with your session…");

  const startedAt = Date.now();
  let consecutiveFailures = 0;
  let showedVerification = false;

  while (Date.now() - startedAt < hardTimeoutMs) {
    if (signal?.aborted) return { status: EXT_STATUS.IDLE, aborted: true };

    await sleep(pollIntervalMs);

    if (signal?.aborted) return { status: EXT_STATUS.IDLE, aborted: true };

    let result;
    try {
      result = await getExtensionJobResult(job.job_id);
      consecutiveFailures = 0;
    } catch (err) {
      if (err?.response?.status === 404) {
        onStatus(
          EXT_STATUS.ERROR,
          "The extraction job expired before a result was submitted. Please try again."
        );
        return { status: EXT_STATUS.ERROR };
      }
      consecutiveFailures += 1;
      if (consecutiveFailures >= 5) {
        onStatus(
          EXT_STATUS.ERROR,
          "Lost contact with the extraction service. Please try again."
        );
        return { status: EXT_STATUS.ERROR };
      }
      continue;
    }

    if (result?.status === "done" && result.preview) {
      onStatus(EXT_STATUS.DONE, "Extraction complete.");
      return { status: EXT_STATUS.DONE, preview: result.preview, job };
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed >= verifyGraceMs && !showedVerification) {
      showedVerification = true;
      onStatus(
        EXT_STATUS.VERIFICATION,
        "Complete verification in the TeraBox tab, then click Retry."
      );
    } else if (!showedVerification && elapsed >= openingDurationMs) {
      onStatus(EXT_STATUS.EXTRACTING, "Extracting link with your TeraBox session…");
    }
  }

  // Still pending after the hard timeout: the extension was never picked up
  // (or never submitted). This is the reliable signal that the extension is
  // missing, because content-teraplayer.js only forwards jobs when installed.
  onStatus(
    EXT_STATUS.EXTENSION_REQUIRED,
    "The TeraPlayer browser extension is required to extract this link. Install it, then try again."
  );
  return { status: EXT_STATUS.EXTENSION_REQUIRED, job };
}
