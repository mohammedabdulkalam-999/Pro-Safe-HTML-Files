"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/data-table/data-table-sort-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ACTIVE_CALL_STATUSES, toStatusBadgeVariant } from "@/constants/call-status";
import { ROUTES } from "@/constants/routes";
import type { CallListItem } from "@/types/call";
import { formatDuration } from "@/utils/call";
import type { CallsListSortField } from "@/validators/calls-list";

interface CallTableColumnOptions {
  sortBy: CallsListSortField;
  sortOrder: "asc" | "desc";
  onSort: (column: CallsListSortField) => void;
}

export function createCallTableColumns({
  sortBy,
  sortOrder,
  onSort,
}: CallTableColumnOptions): ColumnDef<CallListItem>[] {
  return [
    {
      accessorKey: "customerName",
      header: () => (
        <DataTableSortHeader
          title="Customer"
          sorted={sortBy === "customer_name" ? sortOrder : false}
          onSort={() => onSort("customer_name")}
        />
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <DataTableSortHeader
          title="Status"
          sorted={sortBy === "status" ? sortOrder : false}
          onSort={() => onSort("status")}
        />
      ),
      cell: ({ row }) => (
        <StatusBadge status={toStatusBadgeVariant(row.original.status)} />
      ),
    },
    {
      accessorKey: "duration",
      header: () => (
        <DataTableSortHeader
          title="Duration"
          sorted={sortBy === "duration_seconds" ? sortOrder : false}
          onSort={() => onSort("duration_seconds")}
        />
      ),
      cell: ({ row }) => formatDuration(row.original.duration),
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = ACTIVE_CALL_STATUSES.includes(row.original.status);

        return (
          <div className="flex gap-2">
            {isActive ? (
              <Button variant="default" size="sm" asChild>
                <Link href={ROUTES.LIVE_CALL(row.original.id)}>Live</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.CALL_DETAIL(row.original.id)}>View</Link>
            </Button>
          </div>
        );
      },
    },
  ];
}
