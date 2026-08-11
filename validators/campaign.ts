import { z } from "zod";

const e164PhoneRegex = /^\+[1-9]\d{1,14}$/;

export const campaignContactSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .regex(e164PhoneRegex, "Invalid phone number after normalization"),
  notes: z.string().trim().max(500).optional(),
  rowNumber: z.number().int().positive(),
});

export type CampaignContactInput = z.infer<typeof campaignContactSchema>;

export const bulkCallSchema = z.object({
  contacts: z
    .array(campaignContactSchema)
    .min(1, "At least one valid contact is required")
    .max(100, "Maximum 100 contacts per campaign"),
});

export type BulkCallInput = z.infer<typeof bulkCallSchema>;

export const CAMPAIGN_FILE_TYPES = [".csv", ".xml"] as const;

export const CAMPAIGN_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
