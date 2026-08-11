"use client";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";

/** Invalidates dashboard KPIs and recent calls after mutations. */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.lists() }),
    ]);
  };
}
