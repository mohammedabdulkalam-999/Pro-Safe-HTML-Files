import type { CallDownloadInput, DownloadFileResult } from "@/services/download/types";
import {
  buildDownloadFooter,
  buildDownloadHeader,
  formatMessageLine,
  getAssistantLabel,
  getConversationMessages,
  getSummaryText,
} from "@/services/download/formatters";

export function buildCallTranscriptTxt(
  input: CallDownloadInput,
): DownloadFileResult {
  const generatedAt = input.generatedAt ?? new Date();
  const assistantName = getAssistantLabel(input.row.assistantName);
  const lines = [
    ...buildDownloadHeader(input.row, generatedAt),
    "CONVERSATION",
    "-".repeat(48),
    "",
  ];

  const messages = getConversationMessages(input.row);

  if (messages.length === 0) {
    lines.push("No conversation recorded.");
  } else {
    for (const message of messages) {
      lines.push(formatMessageLine(message, assistantName));
      lines.push("");
    }
  }

  const summaryText = getSummaryText(input.summary);

  lines.push("SUMMARY", "-".repeat(48), "");

  if (summaryText) {
    lines.push(summaryText);
  } else {
    lines.push("No summary available.");
  }

  lines.push(...buildDownloadFooter(generatedAt));

  return {
    body: lines.join("\n"),
    contentType: "text/plain; charset=utf-8",
    filename: `call-${input.row.callId}.txt`,
  };
}
