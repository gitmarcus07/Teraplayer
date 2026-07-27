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

export async function addHistory(payload) {
  const { data } = await api.post("/history", payload);
  return data;
}

export async function getHistory(sessionId) {
  const { data } = await api.get("/history", {
    params: { session_id: sessionId },
  });
  return data;
}

export async function clearHistory(sessionId) {
  const { data } = await api.delete("/history", {
    params: { session_id: sessionId },
  });
  return data;
}

export async function deleteHistoryItem(itemId, sessionId) {
  const { data } = await api.delete(`/history/${itemId}`, {
    params: { session_id: sessionId },
  });
  return data;
}

export async function addFavorite(payload) {
  const { data } = await api.post("/favorites", payload);
  return data;
}

export async function getFavorites(sessionId) {
  const { data } = await api.get("/favorites", {
    params: { session_id: sessionId },
  });
  return data;
}

export async function deleteFavorite(itemId, sessionId) {
  const { data } = await api.delete(`/favorites/${itemId}`, {
    params: { session_id: sessionId },
  });
  return data;
}

// Auth
export async function exchangeSessionId(sessionId) {
  const { data } = await api.post("/auth/session", {
    session_id: sessionId,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logoutApi() {
  const { data } = await api.post("/auth/logout");
  return data;
}
