import type { StructuredOutput, TranscriptMessage } from "@/types/call";

/** Vapi call lifecycle statuses returned by the API */
export type VapiCallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "forwarding"
  | "ended"
  | "busy"
  | "no-answer"
  | "failed"
  | "canceled";

export type VapiCallType =
  | "inboundPhoneCall"
  | "outboundPhoneCall"
  | "webCall";

/** Server message types sent to webhook endpoints */
export type VapiWebhookMessageType =
  | "assistant-request"
  | "conversation-update"
  | "end-of-call-report"
  | "function-call"
  | "hang"
  | "language-changed"
  | "model-output"
  | "phone-call-control"
  | "speech-update"
  | "status-update"
  | "transcript"
  | "tool-calls"
  | "transfer-destination-request"
  | "transfer-update"
  | "user-interrupted"
  | "voice-input"
  | "voicemail-detected";

export interface VapiCustomer {
  number: string;
  name?: string;
  numberE164CheckEnabled?: boolean;
}

export interface VapiCreateCallRequest {
  assistantId: string;
  phoneNumberId: string;
  customer: VapiCustomer;
  name?: string;
}

export interface VapiCallResponse {
  id: string;
  orgId?: string;
  type?: VapiCallType;
  status?: VapiCallStatus;
  assistantId?: string;
  phoneNumberId?: string;
  customer?: VapiCustomer;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  transcript?: string;
  summary?: string;
  endedReason?: string;
  analysis?: VapiCallAnalysis;
  artifact?: VapiCallArtifact;
  metadata?: Record<string, string>;
}

export interface VapiCallAnalysis {
  summary?: string;
  structuredData?: StructuredOutput;
  successEvaluation?: string;
}

export interface VapiCallArtifact {
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  messages?: VapiArtifactMessage[];
}

export interface VapiArtifactMessage {
  role?: string;
  message?: string;
  content?: string;
  time?: number;
  secondsFromStart?: number;
}

export interface VapiApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}

/** Raw webhook envelope — Vapi may nest under `message` */
export interface VapiWebhookEnvelope {
  message?: VapiWebhookMessage;
  type?: VapiWebhookMessageType;
  call?: VapiCallResponse;
  transcript?: string | VapiArtifactMessage[];
  summary?: string;
  analysis?: VapiCallAnalysis;
  status?: VapiCallStatus;
  endedReason?: string;
}

export interface VapiWebhookMessage {
  type: VapiWebhookMessageType;
  call?: VapiCallResponse;
  transcript?: string | VapiArtifactMessage[];
  summary?: string;
  analysis?: VapiCallAnalysis;
  status?: VapiCallStatus;
  endedReason?: string;
  timestamp?: string;
}

/** Normalized domain output from webhook parsing */
export interface ParsedVapiWebhook {
  messageType: VapiWebhookMessageType;
  vapiCallId: string;
  status: VapiCallStatus | null;
  durationSeconds: number;
  customerName: string | null;
  phoneNumber: string | null;
  transcript: TranscriptMessage[];
  rawTranscript: string | null;
  summary: string | null;
  structuredOutput: StructuredOutput | null;
  endedReason: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface VapiClientConfig {
  apiKey: string;
  baseUrl?: string;
  assistantId?: string;
  phoneNumberId?: string;
  webhookSecret?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export interface VapiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  operation: string;
  retry?: boolean;
}

export type VapiErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "NETWORK"
  | "API_ERROR"
  | "WEBHOOK_INVALID"
  | "UNKNOWN";
