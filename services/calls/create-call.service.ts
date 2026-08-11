import { DEFAULT_ASSISTANT_NAME } from "@/constants/api";
import type { CallStatus } from "@/constants/call-status";
import { logger } from "@/lib/logger";
import { createCall as persistCall } from "@/services/supabase";
import {
  createOutboundCall,
  isVapiConfigured,
  isVapiServiceError,
  mapVapiStatusToCallStatus,
} from "@/services/vapi";
import { isSupabaseServiceError } from "@/services/supabase/errors";
import { getHttpStatusFromServiceError } from "@/services/supabase/http";
import type {
  CreateCallRequestDto,
  CreateCallResponseDto,
} from "@/types/dto/create-call.dto";
import { err, ok, type Result, type ServiceFailure } from "@/types/result";

const OPERATION = "createCall";

function toServiceFailure(
  code: string,
  message: string,
  statusCode: number,
  cause?: unknown,
): ServiceFailure {
  return { code, message, statusCode, cause };
}

function mapUnknownError(error: unknown): ServiceFailure {
  if (isVapiServiceError(error)) {
    return toServiceFailure(
      error.code,
      error.message,
      error.statusCode ?? 500,
      error,
    );
  }

  if (isSupabaseServiceError(error)) {
    return toServiceFailure(
      error.code,
      error.message,
      getHttpStatusFromServiceError(error),
      error,
    );
  }

  if (error instanceof Error) {
    return toServiceFailure("UNKNOWN", error.message, 500, error);
  }

  return toServiceFailure(
    "UNKNOWN",
    "An unexpected error occurred while creating the call",
    500,
    error,
  );
}

/**
 * Orchestrates outbound call creation:
 * 1. Vapi service layer → initiate call
 * 2. Supabase service layer → persist call record
 *
 * Never calls Vapi HTTP APIs directly — only via @/services/vapi.
 */
export async function createCall(
  input: CreateCallRequestDto,
): Promise<Result<CreateCallResponseDto, ServiceFailure>> {
  if (!isVapiConfigured()) {
    const failure = toServiceFailure(
      "NOT_CONFIGURED",
      "Vapi is not configured. Set VAPI_API_KEY in environment variables.",
      503,
    );
    logger.warn(`${OPERATION}: Vapi not configured`);
    return err(failure);
  }

  try {
    const vapiResult = await createOutboundCall({
      phoneNumber: input.phoneNumber,
      customerName: input.customerName,
    });

    const mappedStatus = mapVapiStatusToCallStatus(vapiResult.status);

    const record = await persistCall({
      call_id: vapiResult.vapiCallId,
      customer_name: input.customerName,
      phone_number: input.phoneNumber,
      status: mappedStatus,
      assistant_name: DEFAULT_ASSISTANT_NAME,
      started_at: new Date().toISOString(),
    });

    logger.info(`${OPERATION}: call initiated`, {
      callId: record.callId,
      status: record.status,
      customerName: input.customerName,
    });

    return ok({
      callId: record.callId,
      status: record.status,
      id: record.id,
    });
  } catch (error) {
    const failure = mapUnknownError(error);

    logger.error(`${OPERATION}: failed`, {
      code: failure.code,
      statusCode: failure.statusCode,
      customerName: input.customerName,
      phoneNumber: input.phoneNumber,
      error: failure.cause instanceof Error ? failure.cause.message : failure.cause,
    });

    return err(failure);
  }
}
