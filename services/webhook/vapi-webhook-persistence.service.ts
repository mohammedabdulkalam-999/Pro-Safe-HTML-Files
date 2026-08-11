import type { CallStatus } from "@/constants/call-status";
import {
  getCallByCallId,
  updateCallByCallId,
  upsertSummaryByCallId,
  upsertTranscriptByCallId,
} from "@/services/supabase";
import type { CallRecord } from "@/types/call";
import {
  mapStructuredOutputToSummaryFields,
  mapVapiStatusToCallStatus,
} from "@/services/vapi";
import type {
  NormalizedVapiWebhookDto,
  VapiWebhookEventKind,
} from "@/types/dto/vapi-webhook.dto";

export interface WebhookPersistenceResult {
  vapiCallId: string;
  processed: boolean;
  skipped: boolean;
  reason?: string;
  actions: string[];
}

/** Persists normalized webhook events to Supabase. */
export class VapiWebhookPersistenceService {
  async persist(
    event: NormalizedVapiWebhookDto,
  ): Promise<WebhookPersistenceResult> {
    const existing = await getCallByCallId(event.vapiCallId);

    if (!existing) {
      return {
        vapiCallId: event.vapiCallId,
        processed: false,
        skipped: true,
        reason: "Call not found in database",
        actions: [],
      };
    }

    const actions: string[] = [];

    for (const kind of event.eventKinds) {
      const action = await this.applyEventKind(kind, event, existing);
      if (action) {
        actions.push(action);
      }
    }

    return {
      vapiCallId: event.vapiCallId,
      processed: actions.length > 0,
      skipped: actions.length === 0,
      reason: actions.length === 0 ? "No supported actions for event" : undefined,
      actions,
    };
  }

  private async applyEventKind(
    kind: VapiWebhookEventKind,
    event: NormalizedVapiWebhookDto,
    call: CallRecord,
  ): Promise<string | null> {
    switch (kind) {
      case "call.started":
        return this.handleCallStarted(event);
      case "call.ended":
        return this.handleCallEnded(event);
      case "transcript":
        return this.handleTranscript(event, call.id);
      case "structured-output":
        return this.handleStructuredOutput(event, call.id);
      default:
        return null;
    }
  }

  private async handleCallStarted(
    event: NormalizedVapiWebhookDto,
  ): Promise<string> {
    const status = mapVapiStatusToCallStatus(
      event.status ?? "in-progress",
    );

    await updateCallByCallId(event.vapiCallId, {
      status,
      started_at: event.startedAt ?? new Date().toISOString(),
    });

    return "call.started";
  }

  private async handleCallEnded(
    event: NormalizedVapiWebhookDto,
  ): Promise<string> {
    const status = mapVapiStatusToCallStatus(event.status ?? "ended");
    const finalStatus: CallStatus =
      status === "completed" || status === "failed" || status === "busy" ||
      status === "no-answer" || status === "voicemail"
        ? status
        : "completed";

    await updateCallByCallId(event.vapiCallId, {
      status: finalStatus,
      duration_seconds: event.durationSeconds,
      started_at: event.startedAt,
      ended_at: event.endedAt ?? new Date().toISOString(),
    });

    return "call.ended";
  }

  private async handleTranscript(
    event: NormalizedVapiWebhookDto,
    callRowId: string,
  ): Promise<string | null> {
    if (!event.transcript.length && !event.rawTranscript?.trim()) {
      return null;
    }

    await upsertTranscriptByCallId(callRowId, {
      transcript: event.transcript,
      raw_transcript: event.rawTranscript,
    });

    return "transcript";
  }

  private async handleStructuredOutput(
    event: NormalizedVapiWebhookDto,
    callRowId: string,
  ): Promise<string | null> {
    if (!event.summary?.trim() && !event.structuredOutput) {
      return null;
    }

    await upsertSummaryByCallId(callRowId, {
      summary: event.summary,
      structured_output: event.structuredOutput,
      ...mapStructuredOutputToSummaryFields(event.structuredOutput),
    });

    return "structured-output";
  }
}

export const vapiWebhookPersistenceService = new VapiWebhookPersistenceService();
