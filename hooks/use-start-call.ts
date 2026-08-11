"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreateCallMutation } from "@/hooks/use-create-call";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/services/calls-api";
import type { StartCallFormInput } from "@/validators/call";

/**
 * Opinionated hook for the Start Call form:
 * mutation + success toast + navigate to live call + error toast.
 */
export function useStartCall() {
  const router = useRouter();
  const mutation = useCreateCallMutation();

  const startCall = useCallback(
    (data: StartCallFormInput) => {
      mutation.mutate(data, {
        onSuccess: (result) => {
          toast.success("Call initiated successfully", {
            description: `${data.customerName} — ${data.phoneNumber}`,
          });
          router.push(ROUTES.LIVE_CALL(result.id));
        },
        onError: (error) => {
          toast.error("Failed to start call", {
            description: getApiErrorMessage(error),
          });
        },
      });
    },
    [mutation, router],
  );

  return {
    startCall,
    isPending: mutation.isPending,
    mutation,
  };
}
