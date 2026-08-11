"use client";

import { useQuery } from "@tanstack/react-query";

import { DASHBOARD_POLL_INTERVAL_MS } from "@/constants/api";
import { queryKeys } from "@/lib/query-keys";
import { fetchDashboardStats } from "@/services/calls-api";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
  });
}
