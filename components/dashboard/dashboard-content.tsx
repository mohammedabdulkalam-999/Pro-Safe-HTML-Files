"use client";

import { toast } from "sonner";

import {
  CallInitiationPanel,
  CallsTable,
} from "@/components/calls";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { MetricsSkeleton } from "@/components/shared/metrics-skeleton";
import { RetryState } from "@/components/shared/retry-state";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { useCallsList } from "@/hooks/use-calls";
import { useCallsTableState } from "@/hooks/use-calls-table-state";
import { useCreateCallMutation } from "@/hooks/use-create-call";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useStartCall } from "@/hooks/use-start-call";
import { getApiErrorMessage } from "@/services/calls-api";
import type { CampaignContact } from "@/types/campaign";

export function DashboardContent() {
  const tableState = useCallsTableState();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsQueryError,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useDashboardStats();
  const {
    data: callsPage,
    isLoading: callsLoading,
    isError: callsError,
    error: callsQueryError,
    refetch: refetchCalls,
    isFetching: callsFetching,
  } = useCallsList(tableState.queryParams);
  const { startCall, isPending: isStartingCall } = useStartCall();
  const createCallMutation = useCreateCallMutation();

  const handleBulkCall = async (contacts: CampaignContact[]) => {
    let succeeded = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        await createCallMutation.mutateAsync({
          customerName: contact.customerName,
          phoneNumber: contact.phoneNumber,
        });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }

    if (failed === 0) {
      toast.success(`Campaign started for ${succeeded} contact(s)`);
      return;
    }

    if (succeeded === 0) {
      toast.error("Campaign failed", {
        description: "No calls could be started. Check Vapi configuration.",
      });
      return;
    }

    toast.warning(`${succeeded} started, ${failed} failed`);
  };

  const isSubmitting = isStartingCall || createCallMutation.isPending;
  const calls = callsPage?.items ?? [];

  return (
    <>
      <div className="border-b border-brand-border/40 p-4 md:p-5">
        <PageHeader title={APP_NAME} description={APP_TAGLINE} />
        <CallInitiationPanel
          onSingleCall={startCall}
          onBulkCall={handleBulkCall}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="p-4 md:p-5 md:pb-4">
        {statsLoading ? (
          <MetricsSkeleton />
        ) : statsError ? (
          <RetryState
            title="Failed to load dashboard metrics"
            description={getApiErrorMessage(statsQueryError)}
            onRetry={() => void refetchStats()}
            isRetrying={statsFetching}
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Calls"
              value={stats?.totalCalls ?? 0}
            />
            <MetricCard
              label="Active Calls"
              value={stats?.activeCalls ?? 0}
            />
            <MetricCard
              label="Qualified"
              value={stats?.qualifiedLeads ?? 0}
            />
            <MetricCard
              label="Success %"
              value={`${stats?.successRate ?? 0}%`}
            />
          </div>
        )}
      </div>

      <div className="px-4 pb-5 md:px-5">
        <div className="admin-content-card">
          <div className="border-b border-brand-border/40 px-4 py-3 md:px-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recent Calls
            </h2>
          </div>
          <CallsTable
            calls={calls}
            total={callsPage?.total ?? 0}
            page={tableState.page}
            pageSize={tableState.pageSize}
            sortBy={tableState.sortBy}
            sortOrder={tableState.sortOrder}
            search={tableState.searchInput}
            isLoading={callsLoading}
            isFetching={callsFetching}
            isError={callsError}
            error={callsQueryError}
            onSearchChange={tableState.setSearchInput}
            onPageChange={tableState.setPage}
            onSort={tableState.handleSort}
            onRetry={() => void refetchCalls()}
            isRetrying={callsFetching}
            emptyAction={() => {
              document
                .getElementById("start-call-form")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>
      </div>
    </>
  );
}
