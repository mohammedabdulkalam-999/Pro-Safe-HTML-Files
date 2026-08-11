import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const searchSchema = z.object({
  query: z.string().trim().max(200).optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
