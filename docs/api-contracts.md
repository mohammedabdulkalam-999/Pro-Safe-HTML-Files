# API Contracts

All JSON endpoints return a consistent envelope.

## Response envelope

### Success

```json
{
  "success": true,
  "data": { }
}
```

### Error

```json
{
  "success": false,
  "message": "Human-readable error",
  "errorCode": "OPTIONAL_CODE"
}
```

---

## `GET /api/health`

Health check for deployment probes.

**Response `data`:**

```json
{
  "status": "UP",
  "checks": {
    "supabase": "UP",
    "vapi": "UP"
  }
}
```

`status` is `DOWN` if either Supabase or Vapi env vars are missing.

---

## `GET /api/dashboard`

Dashboard KPI metrics.

**Response `data`:**

```json
{
  "totalCalls": 42,
  "completedCalls": 30,
  "activeCalls": 2,
  "failedCalls": 5,
  "qualifiedLeads": 12,
  "successRate": 71
}
```

---

## `GET /api/calls`

Paginated call list (from `call_dashboard` view).

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (1-based) |
| `limit` | number | `10` | Page size (max 100) |
| `search` | string | — | Filter by customer name or phone (ilike) |
| `status` | string | — | One of `CALL_STATUSES` |
| `sortBy` | string | `created_at` | `customer_name`, `status`, `duration_seconds`, `created_at` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Response `data`:**

```json
{
  "items": [
    {
      "id": "uuid",
      "customerName": "John Smith",
      "status": "completed",
      "duration": 135
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

---

## `POST /api/calls`

Start an outbound Vapi call and create a Supabase record.

**Request body:**

```json
{
  "customerName": "John Smith",
  "phoneNumber": "+15555555555"
}
```

Phone is normalized to E.164 on the server.

**Response `data` (201):**

```json
{
  "callId": "vapi-call-id",
  "status": "initiated",
  "id": "supabase-uuid"
}
```

---

## `GET /api/calls/:id`

Full call detail including transcript and summary.

**Response `data`:** `CallDetail`

```json
{
  "id": "uuid",
  "callId": "vapi-call-id",
  "customerName": "John Smith",
  "phoneNumber": "+15555555555",
  "status": "completed",
  "duration": 135,
  "assistantName": "Sarah",
  "startedAt": "2026-07-10T08:00:00.000Z",
  "endedAt": "2026-07-10T08:02:15.000Z",
  "transcript": [
    { "speaker": "assistant", "message": "Hello...", "timestamp": "..." }
  ],
  "summary": { "leadQualified": true, "summary": "...", "structuredOutput": { } },
  "downloadUrls": {
    "txt": "/api/download/{id}?format=txt",
    "pdf": "/api/download/{id}?format=pdf"
  }
}
```

---

## `DELETE /api/calls/:id`

Delete a call and cascade-related transcript/summary rows.

---

## `GET /api/download/:id`

Download call transcript report.

**Query parameters:**

| Param | Values |
|-------|--------|
| `format` | `txt` or `pdf` |

Returns `Content-Disposition: attachment` with appropriate `Content-Type`.

Report includes: customer, phone, duration, conversation, summary, generated timestamp.

---

## `POST /api/vapi/webhook`

Vapi server-to-server webhook. See [webhook-events.md](./webhook-events.md).

**Auth:** `Authorization: Bearer {VAPI_WEBHOOK_SECRET}` or `x-vapi-secret: {VAPI_WEBHOOK_SECRET}`

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "received": true,
    "vapiCallId": "...",
    "messageType": "status-update",
    "eventKinds": ["call.started"],
    "processed": true,
    "actions": ["call.started"]
  }
}
```

Non-auth failures still return **200** (with `processed: false`) so Vapi does not retry on transient DB errors. **401** only for invalid webhook secret.

---

## Client fetch layer

Browser code uses `services/calls-api.ts` + `services/api-client.ts`. Never call `/api/*` with raw `fetch` from components — use hooks.

## Polling intervals

| Hook | Interval | When |
|------|----------|------|
| `useDashboardStats` | 5s | Always |
| `useCallsList` | 5s | Always |
| `useCallDetail` | 3s | Active calls only |

Defined in `constants/api.ts`.
