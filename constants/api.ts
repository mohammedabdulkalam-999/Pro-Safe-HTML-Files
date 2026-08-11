export const API_ROUTES = {
  CALLS: "/api/calls",
  CALL_BY_ID: (id: string) => `/api/calls/${id}` as const,
  VAPI_WEBHOOK: "/api/vapi/webhook",
  DOWNLOAD: (id: string, format: "txt" | "pdf") =>
    `/api/download/${id}?format=${format}` as const,
  DASHBOARD: "/api/dashboard",
  HEALTH: "/api/health",
} as const;

export const DEFAULT_ASSISTANT_NAME = "Sarah";

export const DASHBOARD_POLL_INTERVAL_MS = 5_000;
export const LIVE_CALL_POLL_INTERVAL_MS = 3_000;
