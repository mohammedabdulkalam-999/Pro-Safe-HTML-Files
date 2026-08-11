"use client";

import { CallsTable } from "@/components/calls";
import { useCallsList } from "@/hooks/use-calls";
import { useCallsTableState } from "@/hooks/use-calls-table-state";

export function CallsPageContent() {
  const tableState = useCallsTableState();
  const {
    data: callsPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCallsList(tableState.queryParams);

  return (
    <CallsTable
      calls={callsPage?.items ?? []}
      total={callsPage?.total ?? 0}
      page={tableState.page}
      pageSize={tableState.pageSize}
      sortBy={tableState.sortBy}
      sortOrder={tableState.sortOrder}
      search={tableState.searchInput}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onSearchChange={tableState.setSearchInput}
      onPageChange={tableState.setPage}
      onSort={tableState.handleSort}
      onRetry={() => void refetch()}
      isRetrying={isFetching}
    />
  );
}
