// lib/analytics.js — minimal, privacy-conscious event tracking.
//
// TeraPlayer loads PostHog in public/index.html. We only fire lightweight
// event names for the core flow; we never send full TeraBox URLs, personal
// information, credentials, cookies or tokens. Analytics must never break
// the core flow, so every call is guarded.

export function track(eventName, properties = {}) {
  try {
    if (typeof window !== "undefined" && window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(eventName, properties);
    }
  } catch {
    /* analytics is best-effort only */
  }
}