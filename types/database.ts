/**
 * PostgreSQL / Supabase database types
 *
 * These interfaces mirror the SQL schema exactly (snake_case).
 * Domain models (camelCase) live in types/call.ts — mapped via services/supabase/mappers.ts
 *
 * @see supabase/migrations/
 */

import type { CallStatus } from "@/constants/call-status";
import type { StructuredOutput, TranscriptMessage } from "@/types/call";

// ─── Table row types ─────────────────────────────────────────────────────────

/** public.calls */
export interface CallRow {
  id: string;
  call_id: string;
  customer_name: string | null;
  phone_number: string;
  status: CallStatus;
  duration_seconds: number;
  started_at: string | null;
  ended_at: string | null;
  assistant_name: string;
  created_at: string;
  updated_at: string;
}

/** public.transcripts */
export interface TranscriptRow {
  id: string;
  call_id: string;
  transcript: TranscriptMessage[] | null;
  raw_transcript: string | null;
  created_at: string;
}

/** public.summaries */
export interface SummaryRow {
  id: string;
  call_id: string;
  lead_qualified: boolean | null;
  consultation_requested: boolean | null;
  company_name: string | null;
  callback_date: string | null;
  callback_time: string | null;
  summary: string | null;
  structured_output: StructuredOutput | null;
  created_at: string;
}

/** public.call_dashboard (view) */
export interface CallDashboardViewRow {
  id: string;
  call_id: string;
  customer_name: string | null;
  phone_number: string;
  status: CallStatus;
  duration_seconds: number;
  started_at: string | null;
  ended_at: string | null;
  assistant_name: string;
  created_at: string;
  updated_at: string;
  summary: string | null;
  lead_qualified: boolean | null;
  consultation_requested: boolean | null;
  company_name: string | null;
  callback_date: string | null;
  callback_time: string | null;
  structured_output: StructuredOutput | null;
  raw_transcript: string | null;
  transcript: TranscriptMessage[] | null;
}

// ─── Insert / Update payloads ────────────────────────────────────────────────

export type InsertCallRow = {
  call_id: string;
  customer_name?: string | null;
  phone_number: string;
  status: CallStatus;
  duration_seconds?: number;
  started_at?: string | null;
  ended_at?: string | null;
  assistant_name?: string;
} & Record<string, unknown>;

export type UpdateCallRow = {
  customer_name?: string | null;
  phone_number?: string;
  status?: CallStatus;
  duration_seconds?: number;
  started_at?: string | null;
  ended_at?: string | null;
  assistant_name?: string;
  updated_at?: string;
} & Record<string, unknown>;

export type InsertTranscriptRow = {
  call_id: string;
  transcript?: TranscriptMessage[] | null;
  raw_transcript?: string | null;
} & Record<string, unknown>;

export type UpdateTranscriptRow = {
  transcript?: TranscriptMessage[] | null;
  raw_transcript?: string | null;
} & Record<string, unknown>;

export type InsertSummaryRow = {
  call_id: string;
  lead_qualified?: boolean | null;
  consultation_requested?: boolean | null;
  company_name?: string | null;
  callback_date?: string | null;
  callback_time?: string | null;
  summary?: string | null;
  structured_output?: StructuredOutput | null;
} & Record<string, unknown>;

export type UpdateSummaryRow = {
  lead_qualified?: boolean | null;
  consultation_requested?: boolean | null;
  company_name?: string | null;
  callback_date?: string | null;
  callback_time?: string | null;
  summary?: string | null;
  structured_output?: StructuredOutput | null;
} & Record<string, unknown>;

// ─── Supabase typed schema (for createClient<Database>) ──────────────────────

export interface Database {
  public: {
    Tables: {
      calls: {
        Row: CallRow & Record<string, unknown>;
        Insert: InsertCallRow & Record<string, unknown>;
        Update: UpdateCallRow & Record<string, unknown>;
        Relationships: [];
      };
      transcripts: {
        Row: TranscriptRow & Record<string, unknown>;
        Insert: InsertTranscriptRow & Record<string, unknown>;
        Update: UpdateTranscriptRow & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "transcripts_call_id_fkey";
            columns: ["call_id"];
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
        ];
      };
      summaries: {
        Row: SummaryRow & Record<string, unknown>;
        Insert: InsertSummaryRow & Record<string, unknown>;
        Update: UpdateSummaryRow & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "summaries_call_id_fkey";
            columns: ["call_id"];
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      call_dashboard: {
        Row: CallDashboardViewRow & Record<string, unknown>;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DB_TABLES = {
  CALLS: "calls",
  TRANSCRIPTS: "transcripts",
  SUMMARIES: "summaries",
  CALL_DASHBOARD_VIEW: "call_dashboard",
} as const;

export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES];

/** Valid call status values enforced by calls_status_check constraint */
export const DB_CALL_STATUSES = [
  "initiated",
  "ringing",
  "in-progress",
  "completed",
  "failed",
  "busy",
  "no-answer",
  "voicemail",
] as const satisfies readonly CallStatus[];

/** Foreign key constraint names */
export const DB_FOREIGN_KEYS = {
  TRANSCRIPTS_CALL_ID: "transcripts_call_id_fkey",
  SUMMARIES_CALL_ID: "summaries_call_id_fkey",
} as const;

/** Index names */
export const DB_INDEXES = {
  CALLS_STATUS: "idx_calls_status",
  CALLS_CREATED_AT: "idx_calls_created_at_desc",
  CALLS_PHONE: "idx_calls_phone_number",
  CALLS_CUSTOMER: "idx_calls_customer_name",
  TRANSCRIPTS_CALL_ID: "idx_transcripts_call_id",
  TRANSCRIPTS_CREATED_AT: "idx_transcripts_created_at_desc",
  SUMMARIES_CALL_ID: "idx_summaries_call_id",
  SUMMARIES_LEAD_QUALIFIED: "idx_summaries_lead_qualified",
  SUMMARIES_CREATED_AT: "idx_summaries_created_at_desc",
} as const;

/** Seed call IDs for demo data */
export const SEED_CALL_IDS = {
  JOHN_SMITH: "call_demo_001",
  MIKE_JOHNSON: "call_demo_002",
  JANE_SMITH: "call_demo_003",
  BOB_JOHNSON: "call_demo_004",
  DAVID_LEE: "call_demo_005",
} as const;
