"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

import { CallForm } from "@/components/calls/call-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/services/calls-api";
import type { CampaignContact } from "@/types/campaign";
import type { StartCallFormInput } from "@/validators/call";
import { cn } from "@/lib/utils";

const CampaignUpload = dynamic(
  () =>
    import("@/components/calls/campaign-upload").then(
      (module) => module.CampaignUpload,
    ),
  {
    loading: () => <Skeleton className="h-32 w-full rounded-xl" />,
    ssr: false,
  },
);

type CallMode = "single" | "campaign";

interface CallInitiationPanelProps {
  onSingleCall: (data: StartCallFormInput) => void;
  onBulkCall: (contacts: CampaignContact[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function CallInitiationPanel({
  onSingleCall,
  onBulkCall,
  isSubmitting = false,
}: CallInitiationPanelProps) {
  const [mode, setMode] = useState<CallMode>("single");
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const isBusy = isSubmitting || isBulkRunning;

  const handleBulkCall = async (contacts: CampaignContact[]) => {
    setIsBulkRunning(true);
    try {
      await onBulkCall(contacts);
    } catch (error) {
      toast.error("Failed to start campaign", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsBulkRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="inline-flex rounded-xl border border-brand-border/60 bg-brand-soft/40 p-1"
        role="tablist"
        aria-label="Call initiation mode"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          role="tab"
          aria-selected={mode === "single"}
          disabled={isBusy}
          className={cn(
            "rounded-lg px-4",
            mode === "single" && "bg-white shadow-sm",
          )}
          onClick={() => setMode("single")}
        >
          Single Call
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          role="tab"
          aria-selected={mode === "campaign"}
          disabled={isBusy}
          className={cn(
            "rounded-lg px-4",
            mode === "campaign" && "bg-white shadow-sm",
          )}
          onClick={() => setMode("campaign")}
        >
          Upload Campaign
        </Button>
      </div>

      {mode === "single" ? (
        <CallForm onSubmit={onSingleCall} isSubmitting={isSubmitting} />
      ) : (
        <CampaignUpload
          onStartCampaign={handleBulkCall}
          isSubmitting={isBulkRunning}
        />
      )}
    </div>
  );
}
