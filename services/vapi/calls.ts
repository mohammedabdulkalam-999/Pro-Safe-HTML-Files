import type { CallStatus } from "@/constants/call-status";
import { VapiServiceError } from "@/services/vapi/errors";
import type { VapiHttpClient } from "@/services/vapi/client";
import { getVapiClient } from "@/services/vapi/client";
import type {
  VapiCallResponse,
  VapiCreateCallRequest,
} from "@/services/vapi/types";

export interface CreateOutboundCallInput {
  phoneNumber: string;
  customerName?: string;
  assistantId?: string;
  phoneNumberId?: string;
}

export interface CreateOutboundCallResult {
  vapiCallId: string;
  status: string;
  customerNumber: string;
  customerName: string | null;
  assistantId: string;
  phoneNumberId: string;
  createdAt: string | null;
  raw: VapiCallResponse;
}

function resolveAssistantId(
  client: VapiHttpClient,
  override?: string,
): string {
  const id = override ?? client.assistantId;
  if (!id) {
    throw new VapiServiceError(
      "VAPI_ASSISTANT_ID is required to create outbound calls",
      { code: "NOT_CONFIGURED", operation: "createOutboundCall" },
    );
  }
  return id;
}

function resolvePhoneNumberId(
  client: VapiHttpClient,
  override?: string,
): string {
  const id = override ?? client.phoneNumberId;
  if (!id) {
    throw new VapiServiceError(
      "VAPI_PHONE_NUMBER_ID is required to create outbound calls",
      { code: "NOT_CONFIGURED", operation: "createOutboundCall" },
    );
  }
  return id;
}

/**
 * Initiates an outbound phone call via Vapi.
 * POST /call
 */
export async function createOutboundCall(
  input: CreateOutboundCallInput,
  client?: VapiHttpClient,
): Promise<CreateOutboundCallResult> {
  const vapi = client ?? getVapiClient();
  const operation = "createOutboundCall";

  const assistantId = resolveAssistantId(vapi, input.assistantId);
  const phoneNumberId = resolvePhoneNumberId(vapi, input.phoneNumberId);

  const payload: VapiCreateCallRequest = {
    assistantId,
    phoneNumberId,
    customer: {
      number: input.phoneNumber,
      name: input.customerName,
      numberE164CheckEnabled: true,
    },
  };

  const response = await vapi.request<VapiCallResponse>("/call", {
    method: "POST",
    body: payload,
    operation,
  });

  if (!response.id) {
    throw new VapiServiceError("Vapi did not return a call ID", {
      code: "API_ERROR",
      operation,
    });
  }

  return {
    vapiCallId: response.id,
    status: response.status ?? "queued",
    customerNumber: input.phoneNumber,
    customerName: input.customerName ?? response.customer?.name ?? null,
    assistantId,
    phoneNumberId,
    createdAt: response.createdAt ?? null,
    raw: response,
  };
}

/**
 * Retrieves a call by Vapi call ID.
 * GET /call/:id
 */
export async function getCall(
  vapiCallId: string,
  client?: VapiHttpClient,
): Promise<VapiCallResponse> {
  if (!vapiCallId.trim()) {
    throw new VapiServiceError("Vapi call ID is required", {
      code: "VALIDATION",
      operation: "getCall",
    });
  }

  const vapi = client ?? getVapiClient();

  return vapi.request<VapiCallResponse>(
    `/call/${encodeURIComponent(vapiCallId)}`,
    {
      method: "GET",
      operation: "getCall",
    },
  );
}

/**
 * Maps Vapi status to internal call status used in Supabase.
 */
export function mapVapiStatusToCallStatus(
  vapiStatus: string | undefined,
): CallStatus {
  const map: Record<string, CallStatus> = {
    queued: "initiated",
    ringing: "ringing",
    "in-progress": "in-progress",
    forwarding: "in-progress",
    ended: "completed",
    busy: "busy",
    "no-answer": "no-answer",
    failed: "failed",
    canceled: "failed",
  };

  if (!vapiStatus) return "initiated";
  return map[vapiStatus] ?? "initiated";
}

/**
 * Computes call duration in seconds from Vapi timestamps.
 */
export function computeDurationSeconds(call: VapiCallResponse): number {
  if (!call.startedAt || !call.endedAt) {
    return 0;
  }

  const start = new Date(call.startedAt).getTime();
  const end = new Date(call.endedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  return Math.round((end - start) / 1000);
}
