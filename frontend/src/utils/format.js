// utils/format.js — small, dependency-free display helpers.

// Truncate a filename in the middle while always keeping its extension, so
// long TeraBox names never overflow the result card.
export function truncateName(name, max = 42) {
  if (!name) return name;
  if (name.length <= max) return name;

  const dot = name.lastIndexOf(".");
  const ext = dot > 0 && name.length - dot - 1 > 0 ? name.slice(dot) : "";
  const keepExt = ext && ext.length <= 8 && name.length - ext.length > 10;

  if (!keepExt) return `${name.slice(0, Math.max(1, max - 1))}…`;

  const headLen = Math.max(1, max - 1 - ext.length);
  return `${name.slice(0, headLen)}…${ext}`;
}

// Compact byte formatting (e.g. 204 MB, 1.2 GB). Returns "" for unknown sizes
// so callers can omit the value instead of showing a fabricated one.
export function compactSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  const val = Number(n.toFixed(digits));
  return `${val} ${units[i]}`;
}