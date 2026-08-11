import type { CallsListQueryParams } from "@/validators/calls-list";

export const queryKeys = {
  all: ["pro-vigil"] as const,
  calls: {
    all: () => [...queryKeys.all, "calls"] as const,
    lists: () => [...queryKeys.calls.all(), "list"] as const,
    list: (filters: CallsListQueryParams) =>
      [...queryKeys.calls.lists(), filters] as const,    details: () => [...queryKeys.calls.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.calls.details(), id] as const,
  },
  dashboard: {
    all: () => [...queryKeys.all, "dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all(), "stats"] as const,
  },
} as const;

export type QueryKeyScope = typeof queryKeys;
