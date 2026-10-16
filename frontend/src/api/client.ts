import {
  User,
  AuthTokens,
  Website,
  Snapshot,
  DetectedChange,
  IgnoredRegion,
  NotificationChannel,
  NotificationLog,
  DashboardSummary,
} from "../types";

const BASE_URL = "/api/v1";

let accessToken: string | null = localStorage.getItem("access_token");
let refreshToken: string | null = localStorage.getItem("refresh_token");

export function setTokens(tokens: AuthTokens | null) {
  if (tokens) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  } else {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export function getAccessToken(): string | null {
  return accessToken || localStorage.getItem("access_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // for HttpOnly cookies
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, attempt refresh once
  if (response.status === 401 && !endpoint.includes("/auth/")) {
    const curRefresh = refreshToken || localStorage.getItem("refresh_token");
    if (curRefresh) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: curRefresh }),
          credentials: "include",
        });

        if (refreshRes.ok) {
          const newTokens: AuthTokens = await refreshRes.json();
          setTokens(newTokens);
          headers.set("Authorization", `Bearer ${newTokens.access_token}`);
          response = await fetch(url, { ...config, headers });
        } else {
          setTokens(null);
        }
      } catch {
        setTokens(null);
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; full_name?: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthTokens>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  getMe: () =>
    request<User>("/auth/me"),

  // Dashboard
  getDashboardSummary: () =>
    request<DashboardSummary>("/dashboard/summary"),

  // Websites
  getWebsites: () =>
    request<Website[]>("/websites"),

  getWebsite: (id: number) =>
    request<Website>(`/websites/${id}`),

  createWebsite: (body: { name: string; url: string; check_interval_minutes: number; ignored_selectors?: string[] }, sync = false) =>
    request<Website>(`/websites?sync=${sync}`, { method: "POST", body: JSON.stringify(body) }),

  updateWebsite: (id: number, body: Partial<{ name: string; url: string; check_interval_minutes: number; is_active: boolean }>) =>
    request<Website>(`/websites/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteWebsite: (id: number) =>
    request<void>(`/websites/${id}`, { method: "DELETE" }),

  triggerCheck: (id: number, sync = false) =>
    request<{ message: string; result?: any }>(`/websites/${id}/check?sync=${sync}`, { method: "POST" }),

  simulateChange: (id: number) =>
    request<{
      status: string;
      website_id: number;
      change_id: number;
      change_percentage: number;
      summary: string;
      lines_added: number;
      lines_removed: number;
    }>(`/websites/${id}/simulate-change`, { method: "POST" }),

  // Snapshots
  getSnapshotsForWebsite: (websiteId: number) =>
    request<Snapshot[]>(`/snapshots/website/${websiteId}`),

  getSnapshotDetail: (id: number) =>
    request<Snapshot>(`/snapshots/${id}`),

  // Changes
  getChangesForWebsite: (websiteId: number) =>
    request<DetectedChange[]>(`/changes/website/${websiteId}`),

  getRecentChanges: (limit = 20) =>
    request<DetectedChange[]>(`/changes/recent?limit=${limit}`),

  getChangeDetail: (id: number) =>
    request<DetectedChange>(`/changes/${id}`),

  // Ignored Regions
  addIgnoredRegion: (websiteId: number, body: { selector_type: string; selector_value: string; description?: string }) =>
    request<IgnoredRegion>(`/ignored-regions/website/${websiteId}`, { method: "POST", body: JSON.stringify(body) }),

  deleteIgnoredRegion: (id: number) =>
    request<void>(`/ignored-regions/${id}`, { method: "DELETE" }),

  // Notifications
  getNotificationChannels: () =>
    request<NotificationChannel[]>("/notifications/channels"),

  createNotificationChannel: (body: { channel_type: string; name: string; config: Record<string, any>; is_enabled?: boolean }) =>
    request<NotificationChannel>("/notifications/channels", { method: "POST", body: JSON.stringify(body) }),

  deleteNotificationChannel: (id: number) =>
    request<void>(`/notifications/channels/${id}`, { method: "DELETE" }),

  testNotificationChannel: (id: number) =>
    request<{ success: boolean; message?: string; error?: string }>(`/notifications/channels/${id}/test`, { method: "POST" }),

  getNotificationLogs: () =>
    request<NotificationLog[]>("/notifications/logs"),
};
