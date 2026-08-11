import type { ParsedVapiWebhook } from "@/services/vapi/types";

/** Normalized webhook event kinds consumed by persistence layer. */
export type VapiWebhookEventKind =
  | "call.started"
  | "call.ended"
  | "transcript"
  | "structured-output"
  | "unknown";

/** Normalized webhook payload passed from parser → handler. */
export interface NormalizedVapiWebhookDto extends ParsedVapiWebhook {
  eventKinds: VapiWebhookEventKind[];
}

export interface VapiWebhookProcessResultDto {
  received: true;
  vapiCallId: string;
  messageType: string;
  eventKinds: VapiWebhookEventKind[];
  processed: boolean;
  skipped?: boolean;
  reason?: string;
  actions: string[];
}

export interface VapiWebhookRequestDto {
  rawBody: unknown;
  authorizationHeader: string | null;
  vapiSecretHeader: string | null;
}
