// utils/errorHandling.js — normalize backend/API failures into one
// user-facing category so the rest of the UI renders a single consistent
// error presentation.
//
import { dictionaries } from "../i18n/translations";
// The backend returns either:
//   - HTTP 200 with { ok: false, error: "...", password_required, ... } for
//     extraction-level failures, or
//   - a standard FastAPI error JSON { detail: "..." } with a 4xx/5xx status,
//     or
//     - an axios-level failure (network/timeout) with no response.
//
// We never surface raw extractor internals (e.g. "xapiverse: ... | hnn: ...")
// to the user. Only a small set of backend messages known to be written for
// end users are shown verbatim.

export const ERROR_CATEGORIES = {
  INVALID_LINK: "invalid_link",
  PASSWORD_REQUIRED: "password_required",
  UNAVAILABLE: "unavailable",
  TEMPORARY: "temporary",
  RATE_LIMITED: "rate_limited",
  NETWORK: "network",
  UNKNOWN: "unknown",
};

const INVALID_LINK_PHRASE = "not a valid terabox link";

export function classifyPreviewError(error, data) {
  // Malformed/missing payload from the API (null, empty, wrong type) should
  // never crash the UI. Treat it as an unknown failure with friendly copy.
  if (
    !error &&
    (data === null || data === undefined || typeof data !== "object" || Array.isArray(data))
  ) {
    return { category: ERROR_CATEGORIES.UNKNOWN };
  }

  const raw = (data && typeof data === "object" && data.error) || "";
  const lower = raw.toLowerCase();

  if (data && typeof data === "object" && data.password_required) {
    return {
      category: ERROR_CATEGORIES.PASSWORD_REQUIRED,
      raw: raw || "This link is password protected.",
    };
  }

  // Extraction-level response (HTTP 200, ok:false). No axios error involved,
  // so classify purely from the message the backend wrote for us.
  if (data && typeof data === "object") {
    if (lower.includes(INVALID_LINK_PHRASE)) {
      return {
        category: ERROR_CATEGORIES.INVALID_LINK,
        raw,
        showRaw: true,
      };
    }
    if (/(expired|no longer available|not available|removed|private|deleted)/i.test(lower)) {
      return { category: ERROR_CATEGORIES.UNAVAILABLE };
    }
    return { category: ERROR_CATEGORIES.UNKNOWN };
  }

  // No error object at all → nothing to classify.
  if (!error) {
    return { category: ERROR_CATEGORIES.NETWORK };
  }

  // User-initiated cancellation is not a failure; callers normally skip
  // classification for it, but never surface it as an error if it slips in.
  if (error.name === "CanceledError" || error.name === "AbortError" || error.code === "ERR_CANCELED") {
    return null;
  }

  // Request timed out → the service is slow/busy, not "offline".
  if (error.code === "ECONNABORTED") {
    return { category: ERROR_CATEGORIES.TEMPORARY };
  }

  // No server response at all → network/connection problem.
  if (!error.response) {
    return { category: ERROR_CATEGORIES.NETWORK };
  }

  const status = error.response.status;
  const detail =
    error.response.data && typeof error.response.data === "object"
      ? error.response.data.detail
      : undefined;

  // Rate limited → tell the user to wait; don't encourage rapid retries.
  if (status === 429) {
    return { category: ERROR_CATEGORIES.RATE_LIMITED };
  }

  // Server trouble → transient, retry later.
  if (status >= 500 && status < 600) {
    return { category: ERROR_CATEGORIES.TEMPORARY };
  }

  // 4xx from a validation/endpoint error. FastAPI details are user-safe here.
  if (status >= 400 && status < 500) {
    if (String(detail || "").toLowerCase().includes(INVALID_LINK_PHRASE)) {
      return { category: ERROR_CATEGORIES.INVALID_LINK, raw: detail, showRaw: true };
    }
    return { category: ERROR_CATEGORIES.INVALID_LINK };
  }

  return { category: ERROR_CATEGORIES.UNKNOWN };
}

// safePreviewError — returns resolved copy (title + description) for a raw
// extraction error string. It never surfaces backend/extractor internals to
// users; raw text is used only for classification. Falls back to friendly
// generic copy for anything unrecognized.
export function safePreviewError(rawError, passwordRequired = false, t) {
  const cls = classifyPreviewError(null, {
    error: rawError || "",
    password_required: passwordRequired,
  });
  if (!cls) return resolveErrorCopy(ERROR_CATEGORIES.UNKNOWN, t);
  return resolveErrorCopy(cls.category, t);
}

export const ERROR_COPY = {
  [ERROR_CATEGORIES.INVALID_LINK]: {
    titleKey: "err.invT",
    descKey: "err.invD",
    actionKey: "err.invA",
  },
  [ERROR_CATEGORIES.UNAVAILABLE]: {
    titleKey: "err.unaT",
    descKey: "err.unaD",
    actionKey: "err.unaA",
  },
  [ERROR_CATEGORIES.TEMPORARY]: {
    titleKey: "err.tmpT",
    descKey: "err.tmpD",
    actionKey: "err.tmpA",
  },
  [ERROR_CATEGORIES.RATE_LIMITED]: {
    titleKey: "err.rateT",
    descKey: "err.rateD",
    actionKey: "err.rateA",
  },
  [ERROR_CATEGORIES.NETWORK]: {
    titleKey: "err.netT",
    descKey: "err.netD",
    actionKey: "err.netA",
  },
  [ERROR_CATEGORIES.UNKNOWN]: {
    titleKey: "err.unkT",
    descKey: "err.unkD",
    actionKey: "err.unkA",
  },
};

// Resolve ERROR_COPY keys through t(). Pass the `t` function from useLang().
// Falls back to English text when no translator is supplied (e.g. toasts
// fired outside React render).
export function resolveErrorCopy(category, t) {
  const copy = ERROR_COPY[category] || ERROR_COPY[ERROR_CATEGORIES.UNKNOWN];
  if (typeof t !== "function") {
    const en = dictionaries.en;
    return {
      title: en[copy.titleKey],
      description: en[copy.descKey],
      actionLabel: en[copy.actionKey],
    };
  }
  return {
    title: t(copy.titleKey),
    description: t(copy.descKey),
    actionLabel: t(copy.actionKey),
  };
}