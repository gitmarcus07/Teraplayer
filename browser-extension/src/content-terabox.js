// content-terabox.js
// Injected on TeraBox mirror pages. Its ONLY job is to detect that the user
// has manually completed TeraBox's verification/captcha so the background
// worker can retry extraction. It never clicks, fills, or bypasses anything.
//
// TeraBox shows verification by rendering an iframe/overlay with known
// selectors; once it is gone (or never appears) and the page has file-list
// markers, we assume the user passed verification and tell the background to
// retry. Heuristic-only: if nothing is detected, the user can click Retry in
// the popup instead.

const VERIFY_SELECTORS = [
  "iframe[src*='verify']",
  "iframe[src*='captcha']",
  ".captcha",
  "#captcha",
  ".verify-area",
  ".slide-verify",
  ".verify-container",
];

const CONTENT_SELECTORS = [
  ".file-list",
  ".share-file",
  ".video-wrap",
  ".list-container",
  "[class*='file-item']",
  "[class*='filelist']",
];

function hasAny(selectors) {
  try {
    return selectors.some((sel) => document.querySelector(sel));
  } catch {
    return false;
  }
}

function checkVerification() {
  // Verification overlay present -> not done yet.
  if (hasAny(VERIFY_SELECTORS)) return false;

  // No overlay but no content markers either -> page still loading; wait.
  if (!hasAny(CONTENT_SELECTORS)) return false;

  // Overlay gone + content visible -> user completed verification manually.
  chrome.runtime.sendMessage({ type: "TP_VERIFY_DONE" }).catch(() => {});
  return true;
}

let observer = null;
function start() {
  if (observer) return;
  // Give the SPA a moment, then observe DOM changes.
  setTimeout(() => {
    observer = new MutationObserver(() => {
      if (checkVerification()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, 1500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
