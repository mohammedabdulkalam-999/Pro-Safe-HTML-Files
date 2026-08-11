# Database

PostgreSQL on Supabase. Migrations live in `supabase/migrations/`.

## Entity relationship

```
calls (1) ──< transcripts (1)
   │
   └──< summaries (1)

call_dashboard (view) — joins calls + transcripts + summaries
```

## Tables

### `calls`

Core call metadata. `call_id` is the **external Vapi call ID** (unique).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Internal Supabase ID (used in URLs) |
| `call_id` | text UNIQUE | Vapi call ID |
| `customer_name` | text | Nullable |
| `phone_number` | text | E.164 |
| `status` | text | See status enum below |
| `duration_seconds` | integer | Default 0 |
| `started_at` | timestamptz | Nullable |
| `ended_at` | timestamptz | Nullable |
| `assistant_name` | text | Default `Sarah` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Status enum** (matches `constants/call-status.ts`):

`initiated`, `ringing`, `in-progress`, `completed`, `failed`, `busy`, `no-answer`, `voicemail`

### `transcripts`

One row per call (unique on `call_id`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `call_id` | uuid FK → calls.id | CASCADE delete |
| `transcript` | jsonb | `[{ speaker, message, timestamp? }]` |
| `raw_transcript` | text | Plain text fallback |
| `created_at` | timestamptz | |

### `summaries`

AI qualification output. One row per call.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `call_id` | uuid FK → calls.id | CASCADE delete |
| `lead_qualified` | boolean | |
| `consultation_requested` | boolean | |
| `company_name` | text | |
| `callback_date` | text | |
| `callback_time` | text | |
| `summary` | text | Narrative summary |
| `structured_output` | jsonb | Full Vapi structured data |
| `created_at` | timestamptz | |

**Structured output shape** (`types/call.ts` → `StructuredOutput`):

```json
{
  "leadQualified": true,
  "consultationRequested": false,
  "companyName": "Acme Corp",
  "cameraInstalled": true,
  "hasCameras": true,
  "monitoring": "24/7",
  "securityIncident": "none",
  "interestLevel": "high",
  "nextAction": "Schedule demo",
  "callbackDate": "2026-07-15",
  "callbackTime": "14:00"
}
```

## View: `call_dashboard`

Denormalized read model for list + detail pages. Defined in migration `20260710000005`.

Joins `calls` + `summaries` + `transcripts`. Queried by `listDashboardCalls()` and `getDashboardCallById()`.

## Indexes

Migration `20260710000004`:

- `calls(status)`, `calls(created_at DESC)`, `calls(call_id)`
- `summaries(lead_qualified)` — qualified lead counts

## Security

Migration `20260710000006` configures RLS. The Next.js server uses **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) — never expose this to the client.

Client-side code only receives data through `/api/*` routes.

## Seed data

`supabase/migrations/20260710000007_seed_demo_data.sql` inserts sample calls for local demo. Run via Supabase SQL editor or `npm run db:seed`.

## Service layer

| Function | Table/View | Purpose |
|----------|------------|---------|
| `createCall` | calls | Insert on outbound start |
| `updateCallByCallId` | calls | Webhook status updates |
| `listDashboardCalls` | call_dashboard | Paginated list |
| `getDashboardCallById` | call_dashboard | Detail page |
| `upsertTranscriptByCallId` | transcripts | Webhook transcript |
| `upsertSummaryByCallId` | summaries | Webhook structured output |
| `countCallsByStatus` | calls | Dashboard KPIs |
| `countQualifiedLeads` | summaries | Dashboard KPIs |

## Vapi ↔ Supabase ID mapping

| Context | ID used |
|---------|---------|
| Vapi API + webhooks | `call_id` (text) |
| App URLs (`/calls/[id]`) | `id` (uuid) |
| Foreign keys | `calls.id` (uuid) |

Webhook handlers look up calls by `call_id` (Vapi ID). UI routes use Supabase `id`.
