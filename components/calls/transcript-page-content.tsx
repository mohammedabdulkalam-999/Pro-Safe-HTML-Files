"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { TranscriptViewer } from "@/components/calls/transcript-viewer";
import { RetryState } from "@/components/shared/retry-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes";
import { toStatusBadgeVariant } from "@/constants/call-status";
import { useCallDetail } from "@/hooks/use-call-detail";
import { getApiErrorMessage } from "@/services/calls-api";
import { formatDuration } from "@/utils/call";

interface TranscriptPageContentProps {
  callId: string;
}

export function TranscriptPageContent({ callId }: TranscriptPageContentProps) {
  const {
    data: call,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCallDetail(callId);

  if (isLoading) {
    return (
      <div className="admin-shell p-4 md:p-5">
        <TranscriptViewer messages={[]} isLoading showSearch={false} />
      </div>
    );
  }

  if (isError || !call) {
    return (
      <div className="admin-shell">
        <RetryState
          title="Failed to load transcript"
          description={getApiErrorMessage(error)}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  const badgeStatus = toStatusBadgeVariant(call.status);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href={ROUTES.CALL_DETAIL(call.id)} aria-label="Back to call details">
              <ArrowLeft className="h-4 w-4" />
              Back to call
            </Link>
          </Button>
          {isFetching ? (
            <Badge variant="outline" className="font-normal">
              Updating…
            </Badge>
          ) : null}
        </div>
        <StatusBadge status={badgeStatus} />
      </div>

      <div className="admin-shell p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-teal">
              <FileText className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Transcript
              </p>
            </div>
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {call.customerName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {call.phoneNumber} · {formatDuration(call.duration)}
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {call.callId}
          </p>
        </div>

        <Separator className="mb-4" />

        <TranscriptViewer
          messages={call.transcript}
          assistantName={call.assistantName}
          autoScroll
          showSearch
        />
      </div>
    </>
  );
}
