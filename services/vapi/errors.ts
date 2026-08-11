import type { VapiErrorCode } from "@/services/vapi/types";

export class VapiServiceError extends Error {
  readonly code: VapiErrorCode;
  readonly operation: string;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly originalError?: Error;

  constructor(
    message: string,
    options: {
      code: VapiErrorCode;
      operation: string;
      statusCode?: number;
      retryable?: boolean;
      originalError?: Error;
    },
  ) {
    super(message);
    this.name = "VapiServiceError";
    this.code = options.code;
    this.operation = options.operation;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError;
  }
}

export function isVapiServiceError(error: unknown): error is VapiServiceError {
  return error instanceof VapiServiceError;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableStatusCode(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

export function mapHttpStatusToVapiErrorCode(status: number): VapiErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 429) return "RATE_LIMITED";
  if (status === 408) return "TIMEOUT";
  if (status >= 500) return "API_ERROR";
  return "UNKNOWN";
}

export function wrapVapiError(
  error: unknown,
  operation: string,
): VapiServiceError {
  if (error instanceof VapiServiceError) {
    return error;
  }

  if (error instanceof Error) {
    const isNetwork =
      error.name === "AbortError" ||
      error.message.includes("fetch failed") ||
      error.message.includes("network");

    return new VapiServiceError(error.message, {
      code: isNetwork ? "NETWORK" : "UNKNOWN",
      operation,
      retryable: isNetwork,
      originalError: error,
    });
  }

  return new VapiServiceError("An unexpected Vapi error occurred", {
    code: "UNKNOWN",
    operation,
  });
}
