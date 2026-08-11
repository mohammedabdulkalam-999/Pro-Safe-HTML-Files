import { z } from "zod";

import { CALL_STATUSES } from "@/constants/call-status";

export const CALLS_LIST_SORT_FIELDS = [
  "customer_name",
  "status",
  "duration_seconds",
  "created_at",
] as const;

export type CallsListSortField = (typeof CALLS_LIST_SORT_FIELDS)[number];

export const callsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(CALL_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(CALLS_LIST_SORT_FIELDS).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CallsListQueryInput = z.infer<typeof callsListQuerySchema>;

export interface CallsListQueryParams {
  page?: number;
  limit?: number;
  status?: CallsListQueryInput["status"];
  search?: string;
  sortBy?: CallsListSortField;
  sortOrder?: "asc" | "desc";
}
