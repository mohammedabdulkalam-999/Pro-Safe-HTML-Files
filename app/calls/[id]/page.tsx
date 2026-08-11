import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  DownloadPanel,
  SummaryCard,
  TranscriptViewer,
} from "@/components/calls";
import { PageContainer } from "@/components/layout/page-container";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toStatusBadgeVariant } from "@/constants/call-status";
import {
  buildCallDetail,
  getDashboardCallById,
  getSummaryByCallId,
} from "@/services/supabase";
import { formatDuration } from "@/utils/call";

interface CallDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { id } = await params;

  const row = await getDashboardCallById(id);
  if (!row) {
    notFound();
  }

  const summary = await getSummaryByCallId(id);
  const call = buildCallDetail(row, summary);

  const badgeStatus = toStatusBadgeVariant(call.status);

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="rounded-xl">
          <Link href={ROUTES.DASHBOARD} aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="admin-shell p-4 md:p-5">
        <div className="admin-content-card mb-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer
              </p>
              <h1 className="text-xl font-bold text-foreground">
                {call.customerName}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {call.phoneNumber}
              </p>
            </div>
            <StatusBadge status={badgeStatus} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{call.phoneNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{formatDuration(call.duration)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Call ID</p>
              <p className="font-mono text-sm">{row.callId}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SummaryCard summary={call.summary} />
          <DownloadPanel
            callId={call.id}
            disabled={!call.transcript.length && !call.summary}
            txtUrl={call.downloadUrls?.txt}
            pdfUrl={call.downloadUrls?.pdf}
          />
        </div>

        <div className="admin-content-card mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40 px-4 py-3 md:px-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Transcript
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.CALL_TRANSCRIPT(call.id)}>Open transcript view</Link>
            </Button>
          </div>
          <TranscriptViewer
            messages={call.transcript}
            assistantName={call.assistantName}
            autoScroll={false}
            bordered={false}
            showSearch={false}
          />
        </div>
      </div>
    </PageContainer>
  );
}
