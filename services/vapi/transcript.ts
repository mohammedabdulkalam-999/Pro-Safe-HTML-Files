import type { TranscriptMessage } from "@/types/call";
import { VapiServiceError } from "@/services/vapi/errors";
import type {
  VapiArtifactMessage,
  VapiCallArtifact,
  VapiCallResponse,
} from "@/services/vapi/types";

const ASSISTANT_ROLES = new Set([
  "assistant",
  "bot",
  "ai",
  "agent",
  "system",
]);

const CUSTOMER_ROLES = new Set([
  "user",
  "customer",
  "human",
  "caller",
]);

function mapRoleToSpeaker(
  role: string | undefined,
): TranscriptMessage["speaker"] {
  const normalized = role?.toLowerCase().trim() ?? "";

  if (ASSISTANT_ROLES.has(normalized)) {
    return "assistant";
  }

  if (CUSTOMER_ROLES.has(normalized)) {
    return "customer";
  }

  return "assistant";
}

function extractMessageText(entry: VapiArtifactMessage): string {
  const text = entry.message ?? entry.content ?? "";
  return typeof text === "string" ? text.trim() : "";
}

/**
 * Normalizes Vapi artifact messages into chat-ready transcript pairs.
 */
export function normalizeTranscriptMessages(
  messages: VapiArtifactMessage[] | null | undefined,
): TranscriptMessage[] {
  if (!messages?.length) {
    return [];
  }

  return messages.flatMap((entry) => {
    const message = extractMessageText(entry);
    if (!message) return [];

    const speaker = mapRoleToSpeaker(entry.role);
    const timestamp =
      entry.secondsFromStart !== undefined
        ? String(entry.secondsFromStart)
        : entry.time !== undefined
          ? String(entry.time)
          : undefined;

    return [{ speaker, message, timestamp } satisfies TranscriptMessage];
  });
}

/**
 * Parses a plain-text Vapi transcript into structured messages.
 * Handles formats like:
 * - "AI: Hello\nUser: Hi"
 * - "Assistant: Hello\nCustomer: Hi"
 */
export function parsePlainTextTranscript(
  raw: string | null | undefined,
): TranscriptMessage[] {
  if (!raw?.trim()) {
    return [];
  }

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const messages: TranscriptMessage[] = [];

  const linePattern =
    /^(AI|Assistant|Bot|Sarah|User|Customer|Human)\s*:\s*(.+)$/i;

  for (const line of lines) {
    const match = line.match(linePattern);

    if (match) {
      const [, roleLabel, text] = match;
      if (!text?.trim()) continue;

      const speaker =
        roleLabel && CUSTOMER_ROLES.has(roleLabel.toLowerCase())
          ? "customer"
          : "assistant";

      messages.push({ speaker, message: text.trim() });
      continue;
    }

    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last) {
        last.message = `${last.message} ${line}`.trim();
      }
    } else {
      messages.push({ speaker: "assistant", message: line });
    }
  }

  return messages;
}

/**
 * Builds a downloadable plain-text transcript from normalized messages.
 */
export function buildRawTranscript(messages: TranscriptMessage[]): string {
  return messages
    .map((entry) => {
      const label = entry.speaker === "assistant" ? "Sarah" : "Customer";
      return `${label}: ${entry.message}`;
    })
    .join("\n");
}

/**
 * Primary entry point — normalizes any Vapi transcript shape.
 */
export function normalizeTranscript(input: {
  transcript?: string | null;
  messages?: VapiArtifactMessage[] | null;
  artifact?: VapiCallArtifact | null;
  call?: VapiCallResponse | null;
}): { messages: TranscriptMessage[]; raw: string | null } {
  const artifactMessages =
    input.messages ??
    input.artifact?.messages ??
    input.call?.artifact?.messages;

  let messages = normalizeTranscriptMessages(artifactMessages);

  const plainText =
    (typeof input.transcript === "string" ? input.transcript : null) ??
    input.artifact?.transcript ??
    input.call?.artifact?.transcript ??
    input.call?.transcript ??
    null;

  if (messages.length === 0 && plainText) {
    messages = parsePlainTextTranscript(plainText);
  }

  const raw =
    plainText?.trim() ||
    (messages.length > 0 ? buildRawTranscript(messages) : null);

  return { messages, raw };
}

/**
 * Validates transcript structure before persistence.
 */
export function assertValidTranscript(messages: TranscriptMessage[]): void {
  if (messages.some((m) => !m.message.trim())) {
    throw new VapiServiceError("Transcript contains empty messages", {
      code: "VALIDATION",
      operation: "assertValidTranscript",
    });
  }
}
