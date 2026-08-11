export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/",
  CALLS: "/calls",
  CALL_DETAIL: (id: string) => `/calls/${id}` as const,
  CALL_TRANSCRIPT: (id: string) => `/calls/${id}/transcript` as const,
  LIVE_CALL: (id: string) => `/calls/${id}/live` as const,
  SETTINGS: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
