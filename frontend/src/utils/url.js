// utils/url.js — URL sanitization + light client-side validation.
//
// Mirrors the backend's accepted TeraBox mirror hosts (services/extractors.py
// TERABOX_HOSTS) so the client never blocks a link the backend would accept,
// and never calls the API for obviously invalid input.

const TERABOX_HOSTS = [
  "terabox.com",
  "www.terabox.com",
  "terabox.app",
  "www.terabox.app",
  "1024terabox.com",
  "www.1024terabox.com",
  "teraboxapp.com",
  "www.teraboxapp.com",
  "nephobox.com",
  "www.nephobox.com",
  "4funbox.com",
  "www.4funbox.com",
  "mirrobox.com",
  "www.mirrobox.com",
  "momerybox.com",
  "www.momerybox.com",
  "terasharelink.com",
  "www.terasharelink.com",
  "1024tera.com",
  "www.1024tera.com",
  "freeterabox.com",
  "www.freeterabox.com",
  "dm.terabox.com",
  "dm-jp.terabox.com",
  "dubox.com",
  "www.dubox.com",
];

// Clean up common accidental input around a shared link:
//   - surrounding whitespace
//   - a single pair of surrounding single/double quotes
//   - angle-bracket wrapping (e.g. copied from rich text: <https://…>)
// Does NOT rewrite the URL itself or strip valid query parameters.
export function sanitizeUrl(input) {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (!s) return "";

  if (s.length > 1 && ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"')))) {
    s = s.slice(1, -1).trim();
  }
  if (s.length > 2 && s.startsWith("<") && s.endsWith(">")) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

// Light client-side check mirroring the backend is_terabox_url().
// Host-only: a valid TeraBox scheme+host passes even if the share id differs.
export function isLikelyTeraBoxUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return TERABOX_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}