// utils/history.js — local recent-links history (localStorage).
//
// Stores only lightweight, non-sensitive metadata so a user can quickly
// revisit links they resolved before. Passwords, cookies, tokens, stream
// and download URLs are NEVER persisted here.

const STORAGE_KEY = "teraplayer:recent_links";
export const MAX_HISTORY = 10;

function parse(raw) {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((e) => e && typeof e.url === "string" && e.url);
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable or full — best effort only */
  }
}

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parse(raw);
  } catch {
    return [];
  }
}

function cleanEntry(entry) {
  const thumbnail =
    typeof entry.thumbnail === "string" && /^https?:\/\//.test(entry.thumbnail)
      ? entry.thumbnail.slice(0, 2048)
      : "";
  return {
    url: typeof entry.url === "string" ? entry.url.slice(0, 2048) : "",
    title: typeof entry.title === "string" ? entry.title.slice(0, 200) : "",
    thumbnail,
    type: typeof entry.type === "string" ? entry.type : "file",
    size_str: typeof entry.size_str === "string" ? entry.size_str.slice(0, 40) : "",
    timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now(),
  };
}

// Build a history entry from a successful extraction preview.
export function buildHistoryEntry({ url, title, thumbnail, type, size_str }) {
  return cleanEntry({
    url: typeof url === "string" ? url.trim() : "",
    title,
    thumbnail,
    type: type || "file",
    size_str: size_str || "",
    timestamp: Date.now(),
  });
}

// Add or move an entry to the top, dedupe by URL, cap at MAX_HISTORY.
export function addHistoryEntry(list, entry) {
  const clean = cleanEntry({ ...entry, timestamp: Date.now() });
  if (!clean.url) return list;
  const next = [clean, ...list.filter((e) => e.url !== clean.url)].slice(0, MAX_HISTORY);
  persist(next);
  return next;
}

export function removeHistoryEntry(list, url) {
  if (!url) return list;
  const next = list.filter((e) => e.url !== url);
  persist(next);
  return next;
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function relativeTime(ts) {
  const diff = Date.now() - (typeof ts === "number" ? ts : 0);
  const sec = Math.floor(diff / 1000);
  if (!Number.isFinite(sec) || sec < 0) return "";
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}