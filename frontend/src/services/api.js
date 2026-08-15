import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  withCredentials: true,
});

export function streamProxyUrl(directUrl) {
  return `${API_BASE}/stream?url=${encodeURIComponent(directUrl)}`;
}

export async function postPreview(url, password) {
  const { data } = await api.post("/preview", { url, password });
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
