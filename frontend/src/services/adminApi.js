import { api } from "./api";

const CSRF = { "X-Admin-CSRF": "1" };

// Auth
export async function adminLogin({ email, password }) {
  const { data } = await api.post("/admin/login", { email, password });
  return data;
}

export async function adminLogout() {
  const { data } = await api.post("/admin/logout", {}, { headers: CSRF });
  return data;
}

export async function adminMe() {
  const { data } = await api.get("/admin/me");
  return data;
}

// Dashboard / analytics / extraction / system / activity
export async function getDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export async function getAnalytics(days = 14) {
  const { data } = await api.get(`/admin/analytics?days=${days}`);
  return data;
}

export async function getExtraction() {
  const { data } = await api.get("/admin/extraction");
  return data;
}

export async function getSystem() {
  const { data } = await api.get("/admin/system");
  return data;
}

export async function getActivity(limit = 100) {
  const { data } = await api.get(`/admin/activity?limit=${limit}`);
  return data;
}

// Admin management (super admin only)
export async function listAdmins() {
  const { data } = await api.get("/admin/admins");
  return data;
}

export async function createAdmin(payload) {
  const { data } = await api.post("/admin/admins", payload, { headers: CSRF });
  return data;
}

export async function updateAdmin(id, payload) {
  const { data } = await api.patch(`/admin/admins/${encodeURIComponent(id)}`, payload, { headers: CSRF });
  return data;
}

export async function setAdminPassword(id, new_password) {
  const { data } = await api.post(
    `/admin/admins/${encodeURIComponent(id)}/password`,
    { new_password },
    { headers: CSRF }
  );
  return data;
}

export async function deleteAdmin(id) {
  const { data } = await api.delete(`/admin/admins/${encodeURIComponent(id)}`, { headers: CSRF });
  return data;
}

// Site settings
export async function getSiteSettings() {
  const { data } = await api.get("/admin/site");
  return data;
}

export async function updateSiteSettings(payload) {
  const { data } = await api.patch("/admin/site", payload, { headers: CSRF });
  return data;
}

// Public maintenance status
export async function getSiteStatus() {
  const { data } = await api.get("/site/status");
  return data;
}