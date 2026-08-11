# Architecture

Pro-Vigil AI Sales Agent Demo is a **Vapi-first** outbound calling application. Vapi owns the telephony and AI conversation runtime; this app orchestrates calls, receives webhooks, and persists state in Supabase for the dashboard UI.

## System overview

```
┌─────────────┐     POST /api/calls      ┌──────────────┐     REST API     ┌──────┐
│  Dashboard  │ ───────────────────────► │  Next.js API │ ───────────────► │ Vapi │
│  (React)    │                          │   Routes     │                  └──────┘
└──────┬──────┘                          └──────┬───────┘                       │
       │                                         │                               │
       │ React Query                             │ Service layer                 │ Webhooks
       │                                         ▼                               ▼
       │                                  ┌──────────────┐              ┌─────────────────┐
       └────────────────────────────────► │   Supabase   │ ◄────────────│ POST /api/vapi/ │
              GET /api/*                  │  (Postgres)  │   persist    │    webhook      │
                                          └──────────────┘              └─────────────────┘
```

## Layering rules

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **UI** | `app/`, `components/` | Rendering, forms, React Query hooks. Never calls Supabase or Vapi directly. |
| **API** | `app/api/` | Thin HTTP controllers — validate input, call services, return JSON/files. |
| **Use cases** | `services/calls/`, `services/webhook/` | Orchestration (e.g. create call = Vapi + Supabase). |
| **Integrations** | `services/vapi/`, `services/supabase/`, `services/download/` | SDK-style adapters with typed errors. |
| **Shared** | `lib/`, `types/`, `validators/`, `constants/` | Env, logging, API responses, Zod schemas, DTOs. |

## Call lifecycle

1. **User starts call** — Dashboard form → `POST /api/calls` → `CreateCallService`.
2. **Vapi outbound** — `createOutboundCall()` dials the customer via configured assistant + phone number.
3. **Supabase record** — A `calls` row is created with `call_id` = Vapi call ID.
4. **Live updates** — Vapi sends webhooks → `VapiWebhookService` normalizes and persists transcript, summary, status.
5. **UI polling** — Dashboard (5s) and live call page (3s) refetch via React Query until call is terminal.

## Key directories

```
app/                    Next.js App Router pages + API routes
components/
  calls/                Call table, transcript viewer, summary card, downloads
  dashboard/            Dashboard shell
  data-table/           Reusable table, pagination, search, sort
  shared/               Status badges, skeletons, empty/retry states
services/
  vapi/                 Vapi HTTP client, call creation, webhook parsing
  webhook/              Webhook auth, normalization, persistence orchestration
  supabase/             Database access (calls, transcripts, summaries)
  download/             TXT/PDF transcript generation (pdf-lib)
  calls/                Create-call use case
hooks/                  React Query hooks (useCallsList, useCallDetail, etc.)
types/                  Domain models, API types, DTOs
validators/             Zod schemas for API query/body validation
supabase/migrations/    Postgres schema + seed data
docs/                   This documentation
```

## Frontend data flow

- **React Query** is the single client cache (`lib/query-keys.ts`).
- Components use hooks (`hooks/use-calls.ts`, `hooks/use-dashboard.ts`) that call `services/calls-api.ts`.
- Mutations invalidate dashboard + call list queries via `useInvalidateDashboard()`.
- `placeholderData: keepPreviousData` on paginated lists avoids flicker during page changes.

## Error handling

- API routes use `handleApiError()` from `lib/api-response.ts`, backed by `lib/service-errors.ts` (Supabase + Vapi).
- Service use cases return `Result<T, ServiceFailure>` (`types/result.ts`).
- UI surfaces errors via `RetryState` and toast notifications (Sonner).
- Route boundaries: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.

## Deployment

- **Runtime:** Vercel (Next.js 15).
- **Database:** Supabase (service role key on server only).
- **Telephony/AI:** Vapi (API key, assistant ID, phone number ID, webhook secret).
- Legacy root `*.html` wireframes are excluded via `.vercelignore`.

See also: [api-contracts.md](./api-contracts.md), [vapi.md](./vapi.md), [webhook-events.md](./webhook-events.md), [database.md](./database.md).
