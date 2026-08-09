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


// Auth
export async function signupApi({ email, password, name }) {
  const { data } = await api.post("/auth/signup", { email, password, name });
  return data;
}

export async function loginApi({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function googleLoginApi({ credential }) {
  const { data } = await api.post("/auth/google", { credential });
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
