"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DASHBOARD_POLL_INTERVAL_MS } from "@/constants/api";
import { queryKeys } from "@/lib/query-keys";
import { fetchCalls } from "@/services/calls-api";
import type { CallsListQueryParams } from "@/validators/calls-list";

export function useCallsList(query: CallsListQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.calls.list(query),
    queryFn: () => fetchCalls(query),
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}
