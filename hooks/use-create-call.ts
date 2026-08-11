"use client";

import { useMutation } from "@tanstack/react-query";

import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import {
  createCall,
  type CreateCallResult,
} from "@/services/calls-api";
import type { StartCallFormInput } from "@/validators/call";

/**
 * TanStack Query mutation for POST /api/calls.
 * Refreshes dashboard data on success.
 */
export function useCreateCallMutation() {
  const invalidateDashboard = useInvalidateDashboard();

  return useMutation<CreateCallResult, Error, StartCallFormInput>({
    mutationFn: createCall,
    onSuccess: async () => {
      await invalidateDashboard();
    },
  });
}
