"use client";

import { useQuery } from "@tanstack/react-query";

import { LIVE_CALL_POLL_INTERVAL_MS } from "@/constants/api";
import { ACTIVE_CALL_STATUSES } from "@/constants/call-status";
import { queryKeys } from "@/lib/query-keys";
import { fetchCallById } from "@/services/calls-api";

export function useCallDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(id),
    queryFn: () => fetchCallById(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return LIVE_CALL_POLL_INTERVAL_MS;
      return ACTIVE_CALL_STATUSES.includes(status)
        ? LIVE_CALL_POLL_INTERVAL_MS
        : false;
    },
  });
}
