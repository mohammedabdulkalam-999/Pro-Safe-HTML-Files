import type {
  CallDashboardViewRow,
  CallRow,
  SummaryRow,
  TranscriptRow,
} from "@/types/database";
import type {
  CallDashboardRow,
  CallDetail,
  CallListItem,
  CallRecord,
  CallSummary,
  CallTranscript,
} from "@/types/call";
import { buildCallDownloadUrls } from "@/lib/download-urls";

export function mapCallRowToModel(row: CallRow): CallRecord {
  return {
    id: row.id,
    callId: row.call_id,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    status: row.status,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    assistantName: row.assistant_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTranscriptRowToModel(row: TranscriptRow): CallTranscript {
  return {
    id: row.id,
    callId: row.call_id,
    transcript: row.transcript,
    rawTranscript: row.raw_transcript,
    createdAt: row.created_at,
  };
}

export function mapSummaryRowToModel(row: SummaryRow): CallSummary {
  return {
    id: row.id,
    callId: row.call_id,
    leadQualified: row.lead_qualified,
    consultationRequested: row.consultation_requested,
    companyName: row.company_name,
    callbackDate: row.callback_date,
    callbackTime: row.callback_time,
    summary: row.summary,
    structuredOutput: row.structured_output,
    createdAt: row.created_at,
  };
}

export function mapDashboardRowToModel(
  row: CallDashboardViewRow,
): CallDashboardRow {
  return {
    ...mapCallRowToModel(row),
    summary: row.summary,
    leadQualified: row.lead_qualified,
    consultationRequested: row.consultation_requested,
    rawTranscript: row.raw_transcript,
    transcript: row.transcript,
  };
}

export function buildCallDetail(
  row: CallDashboardRow,
  summary: CallSummary | null,
): CallDetail {
  return {
    id: row.id,
    callId: row.callId,
    customerName: row.customerName ?? "Unknown",
    status: row.status,
    duration: row.durationSeconds,
    phoneNumber: row.phoneNumber,
    assistantName: row.assistantName,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    transcript: row.transcript ?? [],
    summary,
    downloadUrls: buildCallDownloadUrls(row.id),
  };
}

export function mapCallRecordToListItem(record: CallRecord): CallListItem {
  return {
    id: record.id,
    customerName: record.customerName ?? "Unknown",
    status: record.status,
    duration: record.durationSeconds,
  };
}
