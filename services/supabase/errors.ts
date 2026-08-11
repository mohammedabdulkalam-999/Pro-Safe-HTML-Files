import type { PostgrestError } from "@supabase/supabase-js";

export type SupabaseErrorCode =
  | "NOT_FOUND"
  | "DUPLICATE"
  | "VALIDATION"
  | "QUERY_FAILED"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

export class SupabaseServiceError extends Error {
  readonly code: SupabaseErrorCode;
  readonly operation: string;
  readonly table?: string;
  readonly originalError?: PostgrestError | Error;

  constructor(
    message: string,
    options: {
      code: SupabaseErrorCode;
      operation: string;
      table?: string;
      originalError?: PostgrestError | Error;
    },
  ) {
    super(message);
    this.name = "SupabaseServiceError";
    this.code = options.code;
    this.operation = options.operation;
    this.table = options.table;
    this.originalError = options.originalError;
  }
}

export function isSupabaseServiceError(
  error: unknown,
): error is SupabaseServiceError {
  return error instanceof SupabaseServiceError;
}

export function mapPostgrestError(
  error: PostgrestError,
  operation: string,
  table?: string,
): SupabaseServiceError {
  if (error.code === "PGRST116") {
    return new SupabaseServiceError("Record not found", {
      code: "NOT_FOUND",
      operation,
      table,
      originalError: error,
    });
  }

  if (error.code === "23505") {
    return new SupabaseServiceError("Duplicate record", {
      code: "DUPLICATE",
      operation,
      table,
      originalError: error,
    });
  }

  if (error.code === "23503" || error.code === "23502") {
    return new SupabaseServiceError(error.message, {
      code: "VALIDATION",
      operation,
      table,
      originalError: error,
    });
  }

  return new SupabaseServiceError(error.message || "Database query failed", {
    code: "QUERY_FAILED",
    operation,
    table,
    originalError: error,
  });
}

export function wrapServiceError(
  error: unknown,
  operation: string,
  table?: string,
): SupabaseServiceError {
  if (error instanceof SupabaseServiceError) {
    return error;
  }

  if (isPostgrestError(error)) {
    return mapPostgrestError(error, operation, table);
  }

  if (error instanceof Error) {
    return new SupabaseServiceError(error.message, {
      code: "UNKNOWN",
      operation,
      table,
      originalError: error,
    });
  }

  return new SupabaseServiceError("An unexpected database error occurred", {
    code: "UNKNOWN",
    operation,
    table,
  });
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}
