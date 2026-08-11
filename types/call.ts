import type { CallStatus } from "@/constants/call-status";

export interface TranscriptMessage {
  speaker: "assistant" | "customer";
  message: string;
  timestamp?: string;
}

export interface StructuredOutput {
  industry?: string;
  leadQualified?: boolean;
  cameraInstalled?: boolean;
  monitoring?: string;
  securityIncident?: string;
  interestLevel?: string;
  nextAction?: string;
  hasCameras?: boolean;
  consultationRequested?: boolean;
  callbackDate?: string;
  callbackTime?: string;
  companyName?: string;
}

export interface CallRecord {
  id: string;
  callId: string;
  customerName: string | null;
  phoneNumber: string;
  status: CallStatus;
  durationSeconds: number;
  startedAt: string | null;
  endedAt: string | null;
  assistantName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallSummary {
  id: string;
  callId: string;
  leadQualified: boolean | null;
  consultationRequested: boolean | null;
  companyName: string | null;
  callbackDate: string | null;
  callbackTime: string | null;
  summary: string | null;
  structuredOutput: StructuredOutput | null;
  createdAt: string;
}

export interface CallTranscript {
  id: string;
  callId: string;
  transcript: TranscriptMessage[] | null;
  rawTranscript: string | null;
  createdAt: string;
}

export interface CallDashboardRow extends CallRecord {
  summary: string | null;
  leadQualified: boolean | null;
  consultationRequested: boolean | null;
  rawTranscript: string | null;
  transcript: TranscriptMessage[] | null;
}

export interface CallListItem {
  id: string;
  customerName: string;
  status: CallStatus;
  duration: number;
}

export interface CallDetail extends CallListItem {
  callId: string;
  phoneNumber: string;
  assistantName: string;
  startedAt: string | null;
  endedAt: string | null;
  transcript: TranscriptMessage[];
  summary: CallSummary | null;
  downloadUrls?: {
    txt: string;
    pdf: string;
  };
}

export interface DownloadUrls {
  txt: string;
  pdf: string;
}
