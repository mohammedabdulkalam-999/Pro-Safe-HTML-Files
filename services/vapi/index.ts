export {
  createVapiHttpClient,
  getVapiClient,
  isVapiConfigured,
  resetVapiClient,
  VapiHttpClient,
} from "./client";

export {
  computeDurationSeconds,
  createOutboundCall,
  getCall,
  mapVapiStatusToCallStatus,
  type CreateOutboundCallInput,
  type CreateOutboundCallResult,
} from "./calls";

export {
  assertValidTranscript,
  buildRawTranscript,
  normalizeTranscript,
  normalizeTranscriptMessages,
  parsePlainTextTranscript,
} from "./transcript";

export {
  hasSummaryData,
  hasTranscriptData,
  isTerminalWebhook,
  mapStructuredOutputToSummaryFields,
  parseWebhook,
  resolveWebhookEventKinds,
  shouldUpdateCallStatus,
  verifyWebhookSecret,
  type WebhookVerificationInput,
} from "./webhook";

export {
  isRetryableStatusCode,
  isVapiServiceError,
  mapHttpStatusToVapiErrorCode,
  VapiServiceError,
  wrapVapiError,
} from "./errors";

export type {
  ParsedVapiWebhook,
  VapiApiErrorBody,
  VapiArtifactMessage,
  VapiCallAnalysis,
  VapiCallArtifact,
  VapiCallResponse,
  VapiCallStatus,
  VapiCallType,
  VapiClientConfig,
  VapiCreateCallRequest,
  VapiCustomer,
  VapiErrorCode,
  VapiRequestOptions,
  VapiWebhookEnvelope,
  VapiWebhookMessage,
  VapiWebhookMessageType,
} from "./types";
