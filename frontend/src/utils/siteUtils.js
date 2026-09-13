/** Validate URL for security - only allow http/https protocols */
export function validateUrl(url) {
  if (!url || typeof url !== "string") return { valid: false, error: "URL is required" };
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: "URL cannot be empty" };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only http:// and https:// URLs are allowed" };
    }
    // Block dangerous protocols
    const dangerousProtocols = ["javascript:", "data:", "file:", "vbscript:"];
    if (dangerousProtocols.some((p) => trimmed.toLowerCase().startsWith(p))) {
      return { valid: false, error: "Invalid URL protocol" };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/** Parse markdown-style links [text](url) and return safe HTML components */
export function parseMarkdownLinks(text) {
  if (!text) return [];
  const parts = [];
  let lastIndex = 0;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const validation = validateUrl(match[2]);
    if (validation.valid) {
      parts.push({ type: "link", text: match[1], url: validation.url });
    } else {
      parts.push({ type: "text", content: match[0] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
}

/** Button style variants */
export const BUTTON_STYLES = [
  { value: "primary", label: "Primary", className: "bg-primary text-primary-foreground hover:bg-primary/90" },
  { value: "secondary", label: "Secondary", className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { value: "success", label: "Success", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { value: "warning", label: "Warning", className: "bg-amber-500 text-white hover:bg-amber-600" },
  { value: "danger", label: "Danger", className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { value: "outline", label: "Outline", className: "border border-border bg-transparent hover:bg-secondary" },
];

/** Get button style className */
export function getButtonStyleClass(style) {
  const found = BUTTON_STYLES.find((s) => s.value === style);
  return found ? found.className : BUTTON_STYLES[0].className;
}

/** Operating mode options */
export const OPERATING_MODES = [
  { value: "normal", label: "Normal", description: "Everything works normally. Website, Public API, and Extraction are online.", icon: "🟢" },
  { value: "maintenance", label: "Maintenance", description: "Website shows a maintenance page. Public API & Telegram bot stay online. Admins can still access /admin.", icon: "🟡" },
  { value: "emergency", label: "Emergency", description: "Full kill-switch: disables website, Public API, and extraction. Admin access always remains.", icon: "🔴" },
];

/** Format date for display */
export function formatDateTime(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/** Format relative time (e.g., "2 hours ago") */
export function formatRelativeTime(isoString) {
  if (!isoString) return "—";
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  } catch {
    return isoString;
  }
}

/** Generate countdown string from end timestamp */
export function getCountdown(endIsoString) {
  if (!endIsoString) return null;
  try {
    const end = new Date(endIsoString).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "00:00:00";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } catch {
    return "00:00:00";
  }
}

/** Sort buttons by order */
export function sortButtons(buttons) {
  return [...buttons].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function newButtonId() {
  return `btn_${Math.random().toString(36).slice(2, 12)}`;
}