import { VapiServiceError } from "@/services/vapi/errors";
import { computeDurationSeconds } from "@/services/vapi/calls";
import { normalizeTranscript } from "@/services/vapi/transcript";
import type { StructuredOutput } from "@/types/call";
import type { InsertSummaryRow } from "@/types/database";
import type {
  ParsedVapiWebhook,
  VapiCallResponse,
  VapiWebhookEnvelope,
  VapiWebhookMessage,
  VapiWebhookMessageType,
} from "@/services/vapi/types";

export interface WebhookVerificationInput {
  secret?: string;
  authorizationHeader?: string | null;
  vapiSecretHeader?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessage(
  payload: VapiWebhookEnvelope,
): VapiWebhookMessage | null {
  if (payload.message && isRecord(payload.message)) {
    return payload.message as VapiWebhookMessage;
  }

  if (payload.type) {
    return {
      type: payload.type,
      call: payload.call,
      transcript: payload.transcript,
      summary: payload.summary,
      analysis: payload.analysis,
      status: payload.status,
      endedReason: payload.endedReason,
    };
  }

  return null;
}

function extractCall(
  message: VapiWebhookMessage | null,
  envelope: VapiWebhookEnvelope,
): VapiCallResponse | null {
  return message?.call ?? envelope.call ?? null;
}

function extractSummary(
  message: VapiWebhookMessage | null,
  call: VapiCallResponse | null,
): string | null {
  return (
    message?.summary ??
    message?.analysis?.summary ??
    call?.summary ??
    call?.analysis?.summary ??
    null
  );
}

function extractStructuredOutput(
  message: VapiWebhookMessage | null,
  call: VapiCallResponse | null,
) {
  return (
    message?.analysis?.structuredData ??
    call?.analysis?.structuredData ??
    null
  );
}

/**
 * Verifies incoming webhook requests against configured secret.
 * Supports Authorization Bearer and x-vapi-secret header.
 */
export function verifyWebhookSecret(
  input: WebhookVerificationInput,
): boolean {
  const expected = input.secret?.trim();
  if (!expected) {
    return true;
  }

  const auth = input.authorizationHeader?.trim();
  if (auth === `Bearer ${expected}` || auth === expected) {
    return true;
  }

  const headerSecret = input.vapiSecretHeader?.trim();
  if (headerSecret === expected) {
    return true;
  }

  return false;
}

/**
 * Parses and normalizes a raw Vapi webhook payload.
 * Throws VapiServiceError on invalid payloads.
 */
export function parseWebhook(payload: unknown): ParsedVapiWebhook {
  const operation = "parseWebhook";

  if (!isRecord(payload)) {
    throw new VapiServiceError("Webhook payload must be a JSON object", {
      code: "WEBHOOK_INVALID",
      operation,
    });
  }

  const envelope = payload as VapiWebhookEnvelope;
  const message = extractMessage(envelope);

  if (!message?.type) {
    throw new VapiServiceError("Webhook missing message type", {
      code: "WEBHOOK_INVALID",
      operation,
    });
  }

  const call = extractCall(message, envelope);

  if (!call?.id) {
    throw new VapiServiceError("Webhook missing Vapi call ID", {
      code: "WEBHOOK_INVALID",
      operation,
    });
  }

  const { messages, raw } = normalizeTranscript({
    transcript:
      typeof message.transcript === "string" ? message.transcript : undefined,
    messages: Array.isArray(message.transcript) ? message.transcript : undefined,
    artifact: call.artifact,
    call,
  });

  const durationSeconds = computeDurationSeconds(call);

  return {
    messageType: message.type as VapiWebhookMessageType,
    vapiCallId: call.id,
    status: message.status ?? call.status ?? null,
    durationSeconds,
    customerName: call.customer?.name ?? null,
    phoneNumber: call.customer?.number ?? null,
    transcript: messages,
    rawTranscript: raw,
    summary: extractSummary(message, call),
    structuredOutput: extractStructuredOutput(message, call),
    endedReason: message.endedReason ?? call.endedReason ?? null,
    startedAt: call.startedAt ?? null,
    endedAt: call.endedAt ?? null,
  };
}

/**
 * Returns true if the webhook represents a terminal call event.
 */
export function isTerminalWebhook(messageType: VapiWebhookMessageType): boolean {
  return messageType === "end-of-call-report";
}

/**
 * Returns true if webhook should trigger a database status update.
 */
export function shouldUpdateCallStatus(
  messageType: VapiWebhookMessageType,
): boolean {
  return (
    messageType === "status-update" ||
    messageType === "end-of-call-report"
  );
}

/**
 * Returns true if webhook contains transcript data worth persisting.
 */
export function hasTranscriptData(parsed: ParsedVapiWebhook): boolean {
  return (
    parsed.transcript.length > 0 ||
    Boolean(parsed.rawTranscript?.trim())
  );
}

/**
 * Returns true if webhook contains summary data worth persisting.
 */
export function hasSummaryData(parsed: ParsedVapiWebhook): boolean {
  return (
    Boolean(parsed.summary?.trim()) ||
    Boolean(parsed.structuredOutput)
  );
}

const STARTED_STATUSES = new Set(["queued", "ringing", "in-progress", "forwarding"]);
const ENDED_STATUSES = new Set([
  "ended",
  "busy",
  "no-answer",
  "failed",
  "canceled",
]);

/**
 * Resolves supported webhook event kinds from a parsed Vapi payload.
 */
export function resolveWebhookEventKinds(
  parsed: ParsedVapiWebhook,
): import("@/types/dto/vapi-webhook.dto").VapiWebhookEventKind[] {
  const kinds = new Set<
    import("@/types/dto/vapi-webhook.dto").VapiWebhookEventKind
  >();

  if (parsed.messageType === "transcript" || hasTranscriptData(parsed)) {
    kinds.add("transcript");
  }

  if (parsed.structuredOutput) {
    kinds.add("structured-output");
  } else if (
    parsed.messageType === "end-of-call-report" &&
    hasSummaryData(parsed)
  ) {
    kinds.add("structured-output");
  }

  if (parsed.messageType === "status-update" && parsed.status) {
    if (STARTED_STATUSES.has(parsed.status)) {
      kinds.add("call.started");
    }
    if (ENDED_STATUSES.has(parsed.status)) {
      kinds.add("call.ended");
    }
  }

  if (parsed.messageType === "end-of-call-report") {
    kinds.add("call.ended");
  }

  if (kinds.size === 0) {
    kinds.add("unknown");
  }

  return [...kinds];
}

/** Maps Vapi structured output fields into summary table columns. */
export function mapStructuredOutputToSummaryFields(
  structured: StructuredOutput | null | undefined,
): Pick<
  InsertSummaryRow,
  | "lead_qualified"
  | "consultation_requested"
  | "company_name"
  | "callback_date"
  | "callback_time"
> {
  return {
    lead_qualified: structured?.leadQualified ?? null,
    consultation_requested: structured?.consultationRequested ?? null,
    company_name: structured?.companyName ?? null,
    callback_date: structured?.callbackDate ?? null,
    callback_time: structured?.callbackTime ?? null,
  };
}
