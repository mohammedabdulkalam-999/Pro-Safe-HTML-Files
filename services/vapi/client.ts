import {
  isRetryableStatusCode,
  mapHttpStatusToVapiErrorCode,
  VapiServiceError,
  wrapVapiError,
} from "@/services/vapi/errors";
import type {
  VapiApiErrorBody,
  VapiClientConfig,
  VapiRequestOptions,
} from "@/services/vapi/types";

const DEFAULT_BASE_URL = "https://api.vapi.ai";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_TIMEOUT_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * 100;
  return exponential + jitter;
}

function parseErrorBody(text: string): VapiApiErrorBody | null {
  try {
    return JSON.parse(text) as VapiApiErrorBody;
  } catch {
    return null;
  }
}

export class VapiHttpClient {
  private readonly config: Required<
    Pick<VapiClientConfig, "apiKey" | "baseUrl" | "maxRetries" | "retryDelayMs" | "timeoutMs">
  > &
    Pick<VapiClientConfig, "assistantId" | "phoneNumberId" | "webhookSecret">;

  constructor(config: VapiClientConfig) {
    if (!config.apiKey.trim()) {
      throw new VapiServiceError("VAPI_API_KEY is required", {
        code: "NOT_CONFIGURED",
        operation: "VapiHttpClient",
      });
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      assistantId: config.assistantId,
      phoneNumberId: config.phoneNumberId,
      webhookSecret: config.webhookSecret,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
  }

  get assistantId(): string | undefined {
    return this.config.assistantId;
  }

  get phoneNumberId(): string | undefined {
    return this.config.phoneNumberId;
  }

  get webhookSecret(): string | undefined {
    return this.config.webhookSecret;
  }

  async request<T>(path: string, options: VapiRequestOptions): Promise<T> {
    const {
      method = "GET",
      body,
      headers = {},
      operation,
      retry = true,
    } = options;

    const url = `${this.config.baseUrl.replace(/\/$/, "")}${path}`;
    const maxAttempts = retry ? this.config.maxRetries + 1 : 1;

    let lastError: VapiServiceError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs,
      );

      try {
        const response = await fetch(url, {
          method,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            ...headers,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          const parsed = parseErrorBody(errorText);
          const message =
            parsed?.message ??
            parsed?.error ??
            (errorText || `Vapi API error (${response.status})`);

          const retryable = isRetryableStatusCode(response.status);
          const error = new VapiServiceError(message, {
            code: mapHttpStatusToVapiErrorCode(response.status),
            operation,
            statusCode: response.status,
            retryable,
          });

          if (retryable && attempt < maxAttempts - 1) {
            lastError = error;
            await sleep(getRetryDelay(attempt, this.config.retryDelayMs));
            continue;
          }

          throw error;
        }

        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeout);

        const wrapped = wrapVapiError(error, operation);

        if (wrapped.retryable && attempt < maxAttempts - 1) {
          lastError = wrapped;
          await sleep(getRetryDelay(attempt, this.config.retryDelayMs));
          continue;
        }

        throw wrapped;
      }
    }

    throw (
      lastError ??
      new VapiServiceError("Vapi request failed after retries", {
        code: "API_ERROR",
        operation,
        retryable: false,
      })
    );
  }
}

let cachedClient: VapiHttpClient | null = null;

export function createVapiHttpClient(
  config?: Partial<VapiClientConfig>,
): VapiHttpClient {
  const apiKey = config?.apiKey ?? process.env.VAPI_API_KEY ?? "";

  if (!apiKey) {
    throw new VapiServiceError(
      "Vapi is not configured. Set VAPI_API_KEY in environment variables.",
      { code: "NOT_CONFIGURED", operation: "createVapiHttpClient" },
    );
  }

  return new VapiHttpClient({
    apiKey,
    baseUrl: config?.baseUrl ?? process.env.VAPI_BASE_URL,
    assistantId: config?.assistantId ?? process.env.VAPI_ASSISTANT_ID,
    phoneNumberId: config?.phoneNumberId ?? process.env.VAPI_PHONE_NUMBER_ID,
    webhookSecret: config?.webhookSecret ?? process.env.VAPI_WEBHOOK_SECRET,
    maxRetries: config?.maxRetries,
    retryDelayMs: config?.retryDelayMs,
    timeoutMs: config?.timeoutMs,
  });
}

/** Singleton client for server-side reuse */
export function getVapiClient(): VapiHttpClient {
  if (!cachedClient) {
    cachedClient = createVapiHttpClient();
  }
  return cachedClient;
}

export function resetVapiClient(): void {
  cachedClient = null;
}

export function isVapiConfigured(): boolean {
  return Boolean(process.env.VAPI_API_KEY?.trim());
}
