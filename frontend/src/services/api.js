import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

// Default per-request budget (60s). The preview call runs a remote extraction
// which is legitimately slower, so it gets a longer explicit timeout below.
const REQUEST_TIMEOUT_MS = 60000;
const EXTRACTION_TIMEOUT_MS = 120000;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

// True when a request was cancelled by the user/component (not a real failure).
// axios 1.x throws a CanceledError with code "ERR_CANCELED"; fetch-based flows
// throw a DOMException named "AbortError".
export function isRequestCancelled(error) {
  return !!error && (error.name === "CanceledError" || error.name === "AbortError" || error.code === "ERR_CANCELED");
}

export function streamProxyUrl(directUrl) {
  return `${API_BASE}/stream?url=${encodeURIComponent(directUrl)}`;
}

export async function postPreview(url, password, options = {}) {
  const { data } = await api.post("/preview", { url, password }, { ...options, timeout: EXTRACTION_TIMEOUT_MS });
  return data;
}

export async function postWatch(url, password) {
  const { data } = await api.post("/watch", { url, password });
  return data;
}

export async function postDownload(url, password) {
  const { data } = await api.post("/download", { url, password });
  return data;
}

// Browser-extension extraction bridge
// POST /api/extension/create  -> { job_id, submit_token, terabox_url, status }
export async function createExtensionJob(url, password) {
  const { data } = await api.post("/extension/create", { url, password });
  return data;
}

// GET /api/extension/result/{job_id} -> { job_id, status: "pending"|"done", preview? }
export async function getExtensionJobResult(jobId) {
  const { data } = await api.get(`/extension/result/${encodeURIComponent(jobId)}`);
  return data;
}
