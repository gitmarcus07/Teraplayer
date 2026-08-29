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

export async function getSystemHealth() {
  const { data } = await api.get("/admin/system/health");
  return data;
}

export async function getSystemInfo() {
  const { data } = await api.get("/admin/system/info");
  return data;
}

export async function getActivity(limit = 100) {
  const { data } = await api.get(`/admin/activity?limit=${limit}`);
  return data;
}

export async function getActivityFiltered(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.skip) searchParams.set("skip", params.skip);
  if (params.admin_id) searchParams.set("admin_id", params.admin_id);
  if (params.action) searchParams.set("action", params.action);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  if (params.search) searchParams.set("search", params.search);
  const { data } = await api.get(`/admin/activity?${searchParams.toString()}`);
  return data;
}

export async function exportActivityCsv(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.admin_id) searchParams.set("admin_id", params.admin_id);
  if (params.action) searchParams.set("action", params.action);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  if (params.search) searchParams.set("search", params.search);
  const response = await api.get(`/admin/activity/export?${searchParams.toString()}`, { responseType: "blob" });
  return response.data;
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

export async function setSiteOperatingMode(operating_mode, confirmation = false) {
  const { data } = await api.post("/admin/site/mode", { operating_mode, confirmation }, { headers: CSRF });
  return data;
}

export async function getMaintenanceHistory(limit = 50, skip = 0) {
  const { data } = await api.get(`/admin/site/history?limit=${limit}&skip=${skip}`);
  return data;
}

export async function previewMaintenancePage(payload) {
  const { data } = await api.post("/admin/site/preview", payload, { headers: CSRF });
  return data;
}

export async function checkScheduledMaintenance() {
  const { data } = await api.post("/admin/site/schedule/check", {}, { headers: CSRF });
  return data;
}

// Search Console
export async function getSearchConsoleStatus() {
  const { data } = await api.get("/admin/search-console/status");
  return data;
}

export async function connectSearchConsole(property_url, service_account_email) {
  const { data } = await api.post("/admin/search-console/connect", { property_url, service_account_email }, { headers: CSRF });
  return data;
}

export async function disconnectSearchConsole() {
  const { data } = await api.post("/admin/search-console/disconnect", {}, { headers: CSRF });
  return data;
}

export async function getSearchConsoleOverview(range = "7d", custom_start = null, custom_end = null) {
  let url = `/admin/search-console/overview?range=${range}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsoleChart(range = "7d", custom_start = null, custom_end = null, metrics = "clicks,impressions,ctr,position") {
  let url = `/admin/search-console/chart?range=${range}&metrics=${encodeURIComponent(metrics)}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsoleQueries(range = "7d", custom_start = null, custom_end = null, limit = 100) {
  let url = `/admin/search-console/queries?range=${range}&limit=${limit}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsolePages(range = "7d", custom_start = null, custom_end = null, limit = 100) {
  let url = `/admin/search-console/pages?range=${range}&limit=${limit}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsoleCountries(range = "7d", custom_start = null, custom_end = null) {
  let url = `/admin/search-console/countries?range=${range}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsoleDevices(range = "7d", custom_start = null, custom_end = null) {
  let url = `/admin/search-console/devices?range=${range}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

export async function getSearchConsoleSearchAppearance(range = "7d", custom_start = null, custom_end = null) {
  let url = `/admin/search-console/search-appearance?range=${range}`;
  if (custom_start) url += `&custom_start=${encodeURIComponent(custom_start)}`;
  if (custom_end) url += `&custom_end=${encodeURIComponent(custom_end)}`;
  const { data } = await api.get(url);
  return data;
}

// Advanced Analytics
export async function getExtractionAnalytics(days = 14) {
  const { data } = await api.get(`/admin/analytics/extraction?days=${days}`);
  return data;
}

export async function getApiAnalytics(days = 14) {
  const { data } = await api.get(`/admin/analytics/api?days=${days}`);
  return data;
}

export async function getAnalyticsBreakdown(days = 14) {
  const { data } = await api.get(`/admin/analytics/breakdown?days=${days}`);
  return data;
}

export async function getFailureReasons(days = 14) {
  const { data } = await api.get(`/admin/analytics/failures?days=${days}`);
  return data;
}

export async function getAnalyticsSeriesByKind(days = 14, kind = null) {
  let url = `/admin/analytics/series-by-kind?days=${days}`;
  if (kind) url += `&kind=${encodeURIComponent(kind)}`;
  const { data } = await api.get(url);
  return data;
}

export async function exportAnalyticsCsv(days = 30, kind = null) {
  let url = `/admin/analytics/export?days=${days}`;
  if (kind) url += `&kind=${encodeURIComponent(kind)}`;
  const response = await api.get(url, { responseType: "blob" });
  return response.data;
}

// Public maintenance status
export async function getSiteStatus() {
  const { data } = await api.get("/site/status");
  return data;
}

// Notifications
export async function getNotifications(unread_only = false, limit = 50, skip = 0) {
  const { data } = await api.get(`/admin/notifications?unread_only=${unread_only}&limit=${limit}&skip=${skip}`);
  return data;
}

export async function markNotificationRead(notification_id) {
  const { data } = await api.post(`/admin/notifications/${notification_id}/read`, {}, { headers: CSRF });
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post("/admin/notifications/read-all", {}, { headers: CSRF });
  return data;
}

export async function archiveNotification(notification_id) {
  const { data } = await api.post(`/admin/notifications/${notification_id}/archive`, {}, { headers: CSRF });
  return data;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get("/admin/notifications/unread-count");
  return data;
}

// Errors
export async function getErrors(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.skip) searchParams.set("skip", params.skip);
  if (params.kind) searchParams.set("kind", params.kind);
  if (params.error_type) searchParams.set("error_type", params.error_type);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  const { data } = await api.get(`/admin/errors?${searchParams.toString()}`);
  return data;
}

export async function getErrorSummary(days = 7) {
  const { data } = await api.get(`/admin/errors/summary?days=${days}`);
  return data;
}

export async function exportErrorsCsv(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.kind) searchParams.set("kind", params.kind);
  if (params.error_type) searchParams.set("error_type", params.error_type);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  const response = await api.get(`/admin/errors/export?${searchParams.toString()}`, { responseType: "blob" });
  return response.data;
}