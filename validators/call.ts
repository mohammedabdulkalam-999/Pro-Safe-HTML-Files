import { z } from "zod";

import { CALL_STATUSES } from "@/constants/call-status";
import { normalizePhoneNumber } from "@/utils/phone";

/** Form schema — no transforms (avoids zodResolver input/output mismatch) */
export const startCallFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be at most 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(
      (value) => normalizePhoneNumber(value) !== null,
      "Enter a valid phone number (e.g. +15555555555)",
    ),
  assistantName: z.string().trim().optional(),
});

export type StartCallFormInput = z.infer<typeof startCallFormSchema>;

/** API schema — normalizes phone to E.164 on the server */
export const startCallSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be at most 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform((value, ctx) => {
      const normalized = normalizePhoneNumber(value);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Enter a valid phone number (e.g. +15555555555 or (234) 567-8901)",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  assistantName: z.string().trim().optional(),
});

export type StartCallInput = z.infer<typeof startCallSchema>;

/** POST /api/calls — customerName + phoneNumber only */
export const createCallRequestSchema = startCallSchema.pick({
  customerName: true,
  phoneNumber: true,
});

export type CreateCallRequestInput = z.infer<typeof createCallRequestSchema>;

export const callListQuerySchema = z.object({
  status: z.enum(CALL_STATUSES).optional(),
  customer: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CallListQueryInput = z.infer<typeof callListQuerySchema>;

export const downloadQuerySchema = z.object({
  format: z.enum(["txt", "pdf"]),
});

export type DownloadQueryInput = z.infer<typeof downloadQuerySchema>;

export const callIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CallIdParam = z.infer<typeof callIdParamSchema>;
