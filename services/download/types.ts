import type { CallDashboardRow, CallSummary } from "@/types/call";

export type DownloadFormat = "txt" | "pdf";

export interface CallDownloadInput {
  row: CallDashboardRow;
  summary: CallSummary | null;
  generatedAt?: Date;
}

export interface DownloadFileResult {
  body: Uint8Array | string;
  contentType: string;
  filename: string;
}
