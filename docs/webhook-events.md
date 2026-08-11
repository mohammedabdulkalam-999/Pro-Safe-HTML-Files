# Webhook Events

Endpoint: **`POST /api/vapi/webhook`**

## Authentication

Validated by `VapiWebhookAuthService` against `VAPI_WEBHOOK_SECRET`:

- `Authorization: Bearer {secret}`
- `x-vapi-secret: {secret}`

Returns **401** if secret is configured and request does not match.

## Processing pipeline

```
HTTP Request
  → VapiWebhookAuthService.verify()
  → VapiWebhookNormalizerService.normalize()    // parseWebhook + resolveWebhookEventKinds
  → VapiWebhookPersistenceService.persist()       // Supabase upserts
  → VapiWebhookService (orchestrator + logging)
```

Implementation: `services/webhook/`

## Raw payload shape

Vapi sends a JSON envelope. The parser (`services/vapi/webhook.ts` → `parseWebhook()`) handles:

```json
{
  "message": {
    "type": "status-update",
    "status": "in-progress",
    "call": { "id": "vapi-call-id", "status": "in-progress", ... },
    "transcript": "...",
    "analysis": {
      "summary": "...",
      "structuredData": { "leadQualified": true }
    }
  }
}
```

Legacy/flat envelopes with top-level `type` and `call` are also supported.

## Normalized event kinds

After parsing, payloads are classified into `VapiWebhookEventKind`:

| Kind | Trigger | Persistence action |
|------|---------|-------------------|
| `call.started` | `status-update` with `queued`, `ringing`, `in-progress`, `forwarding` | Update `calls.status`, set `started_at` |
| `call.ended` | `status-update` with terminal status, or `end-of-call-report` | Update `calls.status`, `duration_seconds`, `ended_at` |
| `transcript` | `transcript` message type, or payload contains transcript data | Upsert `transcripts` |
| `structured-output` | `analysis.structuredData` present, or `end-of-call-report` with summary | Upsert `summaries` |
| `unknown` | No recognized actions | Logged, skipped |

## Supported Vapi message types

The parser accepts all Vapi server message types (`services/vapi/types.ts`). Only the kinds above trigger database writes.

Commonly received:

- `status-update` — call lifecycle
- `transcript` — real-time transcript chunks
- `end-of-call-report` — final transcript, summary, structured data

## HTTP response behavior

| Scenario | Status | Body |
|----------|--------|------|
| Valid secret, processed | 200 | `{ received: true, processed: true, actions: [...] }` |
| Valid secret, call not in DB | 200 | `{ received: true, skipped: true, reason: "Call not found" }` |
| Valid secret, processing error | 200 | `{ received: true, processed: false, errorCode: "..." }` |
| Invalid secret | 401 | `{ success: false, message: "Unauthorized" }` |

**Why 200 on errors?** Prevents Vapi from retrying indefinitely on application-level failures (e.g. race before call record exists). Errors are logged via structured `logger`.

## Idempotency

- Transcripts and summaries use **upsert** by `call_id`.
- Status updates are overwrite-safe.
- Duplicate webhooks for the same event are harmless.

## Call lookup

Persistence looks up `calls` by `call_id` (Vapi ID). If no row exists (e.g. webhook arrives before `POST /api/calls` completes), the event is skipped with `reason: "Call not found in database"`.

## Structured output field mapping

| Vapi `structuredData` | Supabase column |
|-----------------------|-----------------|
| `leadQualified` | `summaries.lead_qualified` |
| `consultationRequested` | `summaries.consultation_requested` |
| `companyName` | `summaries.company_name` |
| `callbackDate` | `summaries.callback_date` |
| `callbackTime` | `summaries.callback_time` |
| (full object) | `summaries.structured_output` |

## Local testing

1. Use [ngrok](https://ngrok.com/) or Vercel preview URL.
2. Set Vapi webhook URL to `https://{tunnel}/api/vapi/webhook`.
3. Start a call from the dashboard.
4. Watch server logs for `vapiWebhook: event received` / `persistence complete`.

## Related files

- `app/api/vapi/webhook/route.ts` — HTTP entry
- `services/webhook/vapi-webhook.service.ts` — orchestrator
- `services/vapi/webhook.ts` — parse, verify, event kind resolution
- `types/dto/vapi-webhook.dto.ts` — normalized DTOs
