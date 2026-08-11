# Vapi Integration

This application treats **Vapi as the source of truth for live call state**. Supabase is the durable store; the dashboard reflects what Vapi reports via API + webhooks.

## Environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VAPI_API_KEY` | Server | REST API authentication |
| `VAPI_ASSISTANT_ID` | Server | Outbound assistant to use |
| `VAPI_PHONE_NUMBER_ID` | Server | Outbound caller ID |
| `VAPI_WEBHOOK_SECRET` | Server | Webhook request validation |

Check configuration: `isVapiConfigured()` in `services/vapi/client.ts`.

## Service module (`services/vapi/`)

| File | Purpose |
|------|---------|
| `client.ts` | HTTP client with retries, auth header, timeout |
| `calls.ts` | `createOutboundCall()`, `getCall()`, status mapping |
| `webhook.ts` | Parse + verify webhook payloads |
| `transcript.ts` | Normalize Vapi transcript formats to `TranscriptMessage[]` |
| `errors.ts` | `VapiServiceError`, retryable status codes |
| `types.ts` | Vapi API + webhook TypeScript types |

## Outbound call flow

```
POST /api/calls
  → CreateCallService
    → createOutboundCall({ phoneNumber, customerName })
    → persistCall({ call_id: vapiCallId, status, ... })
```

**Vapi request** (`POST https://api.vapi.ai/call`):

```json
{
  "assistantId": "{VAPI_ASSISTANT_ID}",
  "phoneNumberId": "{VAPI_PHONE_NUMBER_ID}",
  "customer": {
    "number": "+15555555555",
    "name": "John Smith"
  }
}
```

## Status mapping

Vapi statuses are mapped to internal `CallStatus` via `mapVapiStatusToCallStatus()`:

| Vapi status | Internal status |
|-------------|-----------------|
| `queued` | `initiated` |
| `ringing` | `ringing` |
| `in-progress`, `forwarding` | `in-progress` |
| `ended` | `completed` |
| `busy` | `busy` |
| `no-answer` | `no-answer` |
| `failed`, `canceled` | `failed` |

## Webhook configuration

In the Vapi dashboard, set the server URL to:

```
https://{your-domain}/api/vapi/webhook
```

Enable server messages:

- `status-update`
- `transcript`
- `end-of-call-report`

Set the webhook secret to match `VAPI_WEBHOOK_SECRET`.

See [webhook-events.md](./webhook-events.md) for event handling details.

## Transcript normalization

Vapi may send transcripts as:

- JSON message arrays (artifact messages)
- Plain text strings
- Per-message `transcript` webhook events

`normalizeTranscript()` in `services/vapi/transcript.ts` converts all formats to:

```typescript
{ speaker: "assistant" | "customer", message: string, timestamp?: string }
```

Speaker detection uses role/name heuristics (`assistant`, `bot`, `user`, `customer`).

## Structured output

Vapi assistant should be configured with structured data extraction. Fields map to `StructuredOutput` in `types/call.ts` and persist to `summaries.structured_output` + denormalized columns via `mapStructuredOutputToSummaryFields()`.

UI summary card displays: lead qualified, company, CCTV, monitoring, security incident, consultation, callback date/time, recommendation (`nextAction`).

## Polling vs webhooks

| Data | Primary source | Fallback |
|------|----------------|----------|
| Call status | Webhook `status-update` | `getCall()` via polling (not implemented in UI yet) |
| Transcript | Webhook `transcript` | `end-of-call-report` artifact |
| Summary | Webhook `end-of-call-report` | — |

Live call page polls `GET /api/calls/:id` every 3s to reflect webhook-persisted data.

## Error handling

`VapiServiceError` codes: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION`, `RATE_LIMITED`, `TIMEOUT`, `NETWORK`, `API_ERROR`, `WEBHOOK_INVALID`, `NOT_CONFIGURED`, `UNKNOWN`.

Retryable HTTP status codes: 408, 429, 500, 502, 503, 504.

## Assistant setup checklist

1. Create outbound sales assistant in Vapi with Pro-Vigil script.
2. Configure structured output schema matching `StructuredOutput`.
3. Assign phone number and note `phoneNumberId`.
4. Set webhook URL + secret.
5. Copy assistant ID, API key, and env vars to `.env.local` / Vercel.
