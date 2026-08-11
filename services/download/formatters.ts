import { APP_NAME, COMPANY_NAME } from "@/constants/app";
import { DEFAULT_ASSISTANT_NAME } from "@/constants/api";
import type { CallDashboardRow, CallSummary, TranscriptMessage } from "@/types/call";
import { formatDuration } from "@/utils/call";
import { formatTranscriptTimestamp } from "@/utils/transcript";

export function formatGeneratedTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function getAssistantLabel(assistantName?: string): string {
  return assistantName?.trim() || DEFAULT_ASSISTANT_NAME;
}

export function getCustomerLabel(row: CallDashboardRow): string {
  return row.customerName?.trim() || "Unknown";
}

export function getSummaryText(summary: CallSummary | null): string | null {
  const text = summary?.summary?.trim();
  return text && text.length > 0 ? text : null;
}

export function getConversationMessages(
  row: CallDashboardRow,
): TranscriptMessage[] {
  if (row.transcript?.length) {
    return row.transcript;
  }

  if (row.rawTranscript?.trim()) {
    return [
      {
        speaker: "assistant",
        message: row.rawTranscript.trim(),
      },
    ];
  }

  return [];
}

export function formatMessageLine(
  message: TranscriptMessage,
  assistantName: string,
): string {
  const speaker =
    message.speaker === "assistant" ? assistantName : "Customer";
  const timestamp = formatTranscriptTimestamp(message.timestamp);
  const prefix = timestamp ? `[${timestamp}] ${speaker}` : speaker;
  return `${prefix}: ${message.message}`;
}

export function buildDownloadHeader(
  row: CallDashboardRow,
  generatedAt: Date,
): string[] {
  return [
    `${COMPANY_NAME.toUpperCase()} — ${APP_NAME.toUpperCase()}`,
    "CALL TRANSCRIPT REPORT",
    "=".repeat(48),
    "",
    `Customer: ${getCustomerLabel(row)}`,
    `Phone: ${row.phoneNumber}`,
    `Duration: ${formatDuration(row.durationSeconds)}`,
    `Call ID: ${row.callId}`,
    "",
  ];
}

export function buildDownloadFooter(generatedAt: Date): string[] {
  return [
    "",
    "-".repeat(48),
    `Generated: ${formatGeneratedTimestamp(generatedAt)}`,
  ];
}
