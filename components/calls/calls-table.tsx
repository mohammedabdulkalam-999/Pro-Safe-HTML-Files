"use client";

import { useMemo } from "react";

import { createCallTableColumns } from "@/components/calls/call-table-columns";
import { DataTable } from "@/components/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSearch } from "@/components/data-table/data-table-search";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryState } from "@/components/shared/retry-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { getApiErrorMessage } from "@/services/calls-api";
import type { CallListItem } from "@/types/call";
import type { CallsListSortField } from "@/validators/calls-list";
import { cn } from "@/lib/utils";

export interface CallsTableProps {
  calls: CallListItem[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: CallsListSortField;
  sortOrder: "asc" | "desc";
  search: string;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSort: (column: CallsListSortField) => void;
  onRetry: () => void;
  isRetrying?: boolean;
  emptyAction?: () => void;
  searchPlaceholder?: string;
  className?: string;
}

export function CallsTable({
  calls,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
  search,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  onSearchChange,
  onPageChange,
  onSort,
  onRetry,
  isRetrying = false,
  emptyAction,
  searchPlaceholder = "Search by customer or phone…",
  className,
}: CallsTableProps) {
  const columns = useMemo(
    () => createCallTableColumns({ sortBy, sortOrder, onSort }),
    [sortBy, sortOrder, onSort],
  );

  const showInitialLoading = isLoading && calls.length === 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col gap-3 border-b border-brand-border/40 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <DataTableSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {isFetching && !showInitialLoading ? (
          <span className="text-xs text-muted-foreground">Refreshing…</span>
        ) : null}
      </div>

      {showInitialLoading ? (
        <TableSkeleton rows={pageSize} columns={4} />
      ) : isError ? (
        <RetryState
          title="Failed to load calls"
          description={getApiErrorMessage(error)}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : calls.length === 0 ? (
        <EmptyState
          title={search ? "No matching calls" : "No Calls Yet"}
          description={
            search
              ? "Try a different search term or clear the filter."
              : "Start your first AI sales call."
          }
          onAction={search ? undefined : emptyAction}
        />
      ) : (
        <DataTable
          columns={columns}
          data={calls}
          emptyMessage="No calls found."
        />
      )}

      {!showInitialLoading && !isError && total > 0 ? (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
