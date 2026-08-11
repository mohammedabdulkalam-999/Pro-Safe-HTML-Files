import { NextResponse } from "next/server";

import {
  getHttpStatusFromServiceError,
  getPublicErrorMessage,
  getServiceErrorCode,
} from "@/lib/service-errors";
import type { ApiErrorResponseBody, ApiSuccessResponse } from "@/types/api";
import type { Result, ServiceFailure } from "@/types/result";

export function apiSuccess<T>(
  data: T,
  status = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  errorCode?: string,
): NextResponse<ApiErrorResponseBody> {
  return NextResponse.json(
    { success: false, message, errorCode },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponseBody> {
  const status = getHttpStatusFromServiceError(error);
  const message = getPublicErrorMessage(error);
  const errorCode = getServiceErrorCode(error);
  return apiError(message, status, errorCode);
}

/** Maps a service-layer Result failure to an HTTP error response. */
export function fromServiceFailure(
  failure: ServiceFailure,
): NextResponse<ApiErrorResponseBody> {
  return apiError(failure.message, failure.statusCode, failure.code);
}

/** Maps a service-layer Result to an HTTP JSON response. */
export function fromResult<T>(
  result: Result<T, ServiceFailure>,
  successStatus = 200,
): NextResponse<ApiSuccessResponse<T> | ApiErrorResponseBody> {
  if (!result.success) {
    return fromServiceFailure(result.error);
  }
  return apiSuccess(result.data, successStatus);
}
