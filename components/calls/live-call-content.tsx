"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TranscriptViewer } from "@/components/calls/transcript-viewer";
import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/shared/metric-card";
import { MetricsSkeleton } from "@/components/shared/metrics-skeleton";
import { RetryState } from "@/components/shared/retry-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ACTIVE_CALL_STATUSES, toStatusBadgeVariant } from "@/constants/call-status";
import { ROUTES } from "@/constants/routes";
import { useCallDetail } from "@/hooks/use-call-detail";
import { getApiErrorMessage } from "@/services/calls-api";
import { formatDuration } from "@/utils/call";

interface LiveCallContentProps {
  callId: string;
}

export function LiveCallContent({ callId }: LiveCallContentProps) {
  const router = useRouter();
  const {
    data: call,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCallDetail(callId);

  useEffect(() => {
    if (!call) return;

    if (!ACTIVE_CALL_STATUSES.includes(call.status)) {
      router.replace(ROUTES.CALL_DETAIL(call.id));
    }
  }, [call, router]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="admin-shell p-4 md:p-5">
          <MetricsSkeleton count={4} className="mb-4 sm:grid-cols-2 lg:grid-cols-4" />
          <TranscriptViewer messages={[]} isLoading bordered={false} showSearch={false} />
        </div>
      </PageContainer>
    );
  }

  if (isError || !call) {
    return (
      <PageContainer>
        <div className="admin-shell">
          <RetryState
            title="Failed to load live call"
            description={getApiErrorMessage(error)}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="rounded-xl">
          <Link href={ROUTES.DASHBOARD} aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        </Button>
        <StatusBadge status={toStatusBadgeVariant(call.status)} pulse />
      </div>

      <div className="admin-shell p-4 md:p-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">
            {call.customerName}
          </h1>
          <p className="text-sm text-muted-foreground" role="status">
            {call.status === "ringing"
              ? "Ringing..."
              : call.status === "in-progress"
                ? "Call in progress"
                : "Connecting..."}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Customer" value={call.customerName} />
          <MetricCard label="Phone" value={call.phoneNumber} />
          <MetricCard label="Duration" value={formatDuration(call.duration)} />
          <MetricCard
            label="AI Status"
            value={
              call.status === "in-progress"
                ? "Listening"
                : call.status === "ringing"
                  ? "Dialing"
                  : "Starting"
            }
          />
        </div>

        <div className="admin-content-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40 px-4 py-3 md:px-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Transcript
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={call.status === "in-progress" ? "listening" : "calling"}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.CALL_TRANSCRIPT(call.id)}>Full view</Link>
              </Button>
            </div>
          </div>
          <TranscriptViewer
            messages={call.transcript}
            assistantName={call.assistantName}
            autoScroll
            bordered={false}
            showSearch={false}
          />
        </div>

        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Call ID: {call.callId}
        </p>
      </div>
    </PageContainer>
  );
}
