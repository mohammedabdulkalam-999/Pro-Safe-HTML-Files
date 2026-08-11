import { isVapiServiceError } from "@/services/vapi/errors";
import { isSupabaseServiceError } from "@/services/supabase/errors";

export function getHttpStatusFromServiceError(error: unknown): number {
  if (isSupabaseServiceError(error)) {
    switch (error.code) {
      case "NOT_FOUND":
        return 404;
      case "DUPLICATE":
        return 409;
      case "VALIDATION":
        return 400;
      case "NOT_CONFIGURED":
        return 503;
      case "QUERY_FAILED":
      case "UNKNOWN":
      default:
        return 500;
    }
  }

  if (isVapiServiceError(error)) {
    if (error.statusCode) {
      return error.statusCode;
    }

    switch (error.code) {
      case "NOT_FOUND":
        return 404;
      case "VALIDATION":
      case "WEBHOOK_INVALID":
        return 400;
      case "UNAUTHORIZED":
        return 401;
      case "RATE_LIMITED":
        return 429;
      case "NOT_CONFIGURED":
        return 503;
      case "TIMEOUT":
      case "NETWORK":
      case "API_ERROR":
      case "UNKNOWN":
      default:
        return 500;
    }
  }

  return 500;
}

export function getPublicErrorMessage(error: unknown): string {
  if (isSupabaseServiceError(error)) {
    if (error.code === "NOT_CONFIGURED") {
      return "Database is not configured";
    }
    return error.message;
  }

  if (isVapiServiceError(error)) {
    if (error.code === "NOT_CONFIGURED") {
      return "Vapi is not configured";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

export function getServiceErrorCode(error: unknown): string | undefined {
  if (isSupabaseServiceError(error)) {
    return error.code;
  }

  if (isVapiServiceError(error)) {
    return error.code;
  }

  return undefined;
}
