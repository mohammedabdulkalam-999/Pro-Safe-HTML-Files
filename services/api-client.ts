import type { ApiErrorResponseBody } from "@/types/api";

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RequestConfig extends Omit<RequestInit, "body"> {
  body?: unknown;
}

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

async function parseErrorResponse(response: Response): Promise<ApiErrorResponseBody> {
  try {
    const data = (await response.json()) as ApiErrorResponseBody;
    return {
      success: false,
      message: data.message ?? response.statusText,
      errorCode: data.errorCode,
    };
  } catch {
    return {
      success: false,
      message: response.statusText || "An unexpected error occurred",
    };
  }
}

export async function apiClient<T>(
  url: string,
  config: RequestConfig = {},
): Promise<T> {
  const { body, headers, ...rest } = config;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new ApiClientError(
      error.message,
      response.status,
      error.errorCode,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
