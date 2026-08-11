# Pro-Vigil AI Sales Agent Demo — Project Development Guide

This document describes **what we built**, **how we built it**, and **how to run and deploy** the Pro-Vigil AI Sales Agent Demo. It is the main reference for developers, stakeholders, and future maintainers.

For the full chronological journey **from start to production**, see **[end-to-end-guide.md](./end-to-end-guide.md)**.

---

## 1. Project overview

**Pro-Vigil AI Sales Agent Demo** is a production-ready SaaS-style demo for AI-powered outbound sales calling. It lets users:

- Start single outbound calls or upload a campaign CSV
- Track call status in a live dashboard
- View transcripts in a chat-style UI
- Review AI-generated lead qualification summaries
- Download call reports as TXT or PDF

**Vapi** handles telephony and the AI voice conversation. **Supabase** stores durable call data. **Next.js on Vercel** is the application layer that connects UI, API, webhooks, and database.

### Business flow

```
User starts call → Vapi dials customer → AI conversation runs
       ↓
Vapi sends webhooks (status, transcript, summary) → App persists to Supabase
       ↓
Dashboard polls API → User sees live status, transcript, and qualification data
```

---

## 2. Technology stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Client state | TanStack React Query v5 |
| Tables | TanStack React Table |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) |
| Telephony / AI | Vapi (outbound calls, webhooks) |
| PDF export | pdf-lib |
| Deployment | Vercel |
| Notifications | Sonner (toasts) |

---

## 3. Repository layout

The project lives in two local folders:

| Folder | Purpose |
|--------|---------|
| `prosafe-html-files` | Primary development workspace (Cursor) |
| `prosafe-html-files_Sales agent AI` | GitHub Desktop + Vercel deployment source |

GitHub repo: `mohammedabdulkalam-999/prosafe-html-files_Sales-agent-AI`

Root-level `*.html` files are legacy wireframes. They are excluded from Vercel via `.vercelignore`.

---

## 4. Architecture

### Design principle: strict layering

```
React UI  →  /api/* routes  →  services/*  →  Vapi / Supabase
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **UI** | `app/`, `components/` | Pages, forms, tables, viewers. Never calls Vapi or Supabase directly. |
| **API** | `app/api/` | HTTP controllers — validate input, call services, return JSON or files. |
| **Use cases** | `services/calls/`, `services/webhook/` | Orchestration (e.g. create call = Vapi + Supabase). |
| **Integrations** | `services/vapi/`, `services/supabase/`, `services/download/` | Typed adapters with structured errors. |
| **Shared** | `lib/`, `types/`, `validators/`, `constants/` | Env, logging, API responses, Zod schemas, DTOs. |

### System diagram

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

See [architecture.md](./architecture.md) for full detail.

---

## 5. What we built (development phases)

### Phase 1 — Foundation

- Next.js 15 App Router project with TypeScript and Tailwind
- shadcn/ui component library (buttons, cards, tables, dialogs, etc.)
- App shell: top nav, page container, footer
- Environment validation in `lib/env.ts`
- Result pattern for service-layer errors (`types/result.ts`)
- Unified API response envelope (`lib/api-response.ts`)

### Phase 2 — Database (Supabase)

Six SQL migrations in `supabase/migrations/`:

1. `calls` table — call metadata, Vapi `call_id`, status, duration
2. `transcripts` table — JSONB message array + raw text
3. `summaries` table — lead qualification fields + structured output
4. Indexes for performance
5. `call_dashboard` view — joined read model for list/detail pages
6. Security configuration (RLS disabled; server uses service role)

Demo seed data: `supabase/paste-seed-here.sql` and migration `20260710000007_seed_demo_data.sql`.

Verification script: `npm run db:verify`  
Seed script: `npm run db:seed`

### Phase 3 — Vapi integration

**Outbound calls** (`services/vapi/calls.ts`):

- `createOutboundCall()` — POST to Vapi with assistant ID, phone number ID, customer
- `getCall()` — fetch call status from Vapi
- Status mapping from Vapi statuses to internal `CallStatus`

**HTTP client** (`services/vapi/client.ts`):

- Bearer auth, retries, timeouts, typed `VapiServiceError`

**Create call use case** (`services/calls/create-call.service.ts`):

1. Validate phone number and customer name
2. Call Vapi to start outbound call
3. Insert `calls` row in Supabase with Vapi `call_id`

### Phase 4 — Webhook pipeline

Endpoint: `POST /api/vapi/webhook`

Service classes in `services/webhook/`:

| Service | Role |
|---------|------|
| `VapiWebhookAuthService` | Validates `Authorization: Bearer` or `x-vapi-secret` against `VAPI_WEBHOOK_SECRET` |
| `VapiWebhookNormalizerService` | Parses Vapi payload → internal event kinds |
| `VapiWebhookPersistenceService` | Upserts status, transcript, summary into Supabase |
| `VapiWebhookService` | Orchestrates the full pipeline |

**Handled events:**

| Internal kind | Vapi source | Action |
|---------------|-------------|--------|
| `call.started` | `status-update` (in-progress) | Update call status and timestamps |
| `call.ended` | `status-update` (ended) | Final status, duration |
| `transcript` | `transcript` or artifact messages | Append/update transcript JSON |
| `structured-output` | `end-of-call-report` | Persist summary + qualification fields |

**Webhook policy:** Return **401** only for bad secret. Return **200** for processing failures so Vapi does not retry endlessly. See [webhook-events.md](./webhook-events.md).

### Phase 5 — Dashboard and calls UI

**Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — metrics, single call form, recent calls |
| `/calls` | Full calls table with search, sort, pagination |
| `/calls/[id]` | Call detail — summary card, links to transcript/live |
| `/calls/[id]/live` | Live call view with 3s polling |
| `/calls/[id]/transcript` | Chat-style transcript viewer |
| `/settings` | Settings placeholder |

**Key components:**

- `CallsTable`, `CallForm`, `CampaignUpload` (dynamic import)
- `SummaryCard` — lead qualified, company, CCTV, monitoring, etc.
- `TranscriptViewer`, `TranscriptMessageBubble` — search, copy, timestamps
- Reusable `DataTable`, pagination, search, sort headers
- `RetryState`, `TableSkeleton`, `EmptyState`

**Data fetching:**

- React Query hooks in `hooks/`
- Dashboard refreshes every **5 seconds**
- Live call page refreshes every **3 seconds**
- `keepPreviousData` on paginated lists to avoid flicker

### Phase 6 — Transcript download

`GET /api/download/[id]?format=txt|pdf`

- `services/download/call-download.service.ts` — loads call from Supabase
- `build-txt.ts` — plain-text report
- `build-pdf.ts` — formatted PDF via pdf-lib

### Phase 7 — Production hardening

- Error boundaries: `app/error.tsx`, `app/global-error.tsx`
- `app/not-found.tsx`, `app/loading.tsx`
- Centralized error mapping: `lib/service-errors.ts`
- Security headers in `next.config.ts`
- Accessibility: `<main>`, `aria-current`, pagination labels, `role="status"`
- Removed dead code and deprecated shims
- ESLint + production build verified with zero errors

### Phase 8 — Documentation

| File | Contents |
|------|----------|
| [architecture.md](./architecture.md) | System design and directories |
| [api-contracts.md](./api-contracts.md) | All API endpoints and response shapes |
| [database.md](./database.md) | Schema, view, status enum |
| [vapi.md](./vapi.md) | Vapi env vars, outbound flow, assistant setup |
| [webhook-events.md](./webhook-events.md) | Webhook auth, events, response codes |
| [decisions.md](./decisions.md) | Architecture Decision Records (ADRs) |
| **This file** | End-to-end development and deployment guide |

---

## 6. API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Health check (Supabase + Vapi config) |
| `GET` | `/api/dashboard` | KPI metrics |
| `GET` | `/api/calls` | Paginated, searchable call list |
| `POST` | `/api/calls` | Start outbound call |
| `GET` | `/api/calls/[id]` | Single call detail |
| `POST` | `/api/vapi/webhook` | Vapi server-to-server webhooks |
| `GET` | `/api/download/[id]` | Download TXT or PDF report |

Full contracts: [api-contracts.md](./api-contracts.md)

---

## 7. Environment variables

Copy `.env.example` to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key

# Vapi
VAPI_API_KEY=your-private-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER_ID=your-phone-number-id
VAPI_WEBHOOK_SECRET=your-webhook-secret
```

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_*` | Client-safe | Supabase URL and publishable key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose to browser |
| `VAPI_API_KEY` | Server only | Use **Private** API key, not public |
| `VAPI_WEBHOOK_SECRET` | Server only | Must match Vapi Custom Credential token |

---

## 8. Local development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Vapi keys

# Verify database connection and schema
npm run db:verify

# Optional: seed demo data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Build for production:**

```bash
npm run build
npm run lint
```

---

## 9. Supabase setup

### Schema

Tables: `calls`, `transcripts`, `summaries`  
View: `call_dashboard`  
Project URL example: `https://csljldakjcmiiwxhlkij.supabase.co`

### Keys (from Supabase Dashboard → Settings → API Keys)

| Supabase field | Vercel / `.env.local` variable |
|----------------|-------------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Secret key | `SUPABASE_SERVICE_ROLE_KEY` |

### Migrations

All migrations are in `supabase/migrations/`. Combined script: `supabase/run-all-migrations.sql`.

Verify with:

```bash
npm run db:verify
```

Expected output: `calls`, `transcripts`, `summaries`, and `call_dashboard` all present.

---

## 10. Vercel deployment

### Steps completed

1. Push code from GitHub Desktop folder to `prosafe-html-files_Sales-agent-AI`
2. Import project in Vercel (Next.js auto-detected)
3. Add all 7 environment variables (Supabase + Vapi)
4. Deploy
5. Disable **Vercel Authentication** on Production (so Vapi can reach webhooks)
6. Use production URL for webhooks (preview URLs with hash change per deploy)

### Live URLs (example)

| Purpose | URL |
|---------|-----|
| Dashboard | `https://your-app.vercel.app/` |
| Calls list | `https://your-app.vercel.app/calls` |
| Webhook | `https://your-app.vercel.app/api/vapi/webhook` |

---

## 11. Vapi configuration

### Assistant: Pro-Vigil Qualifier

**Advanced tab → Webhook Server:**

- Server URL: `https://your-app.vercel.app/api/vapi/webhook`
- Timeout: 20s (default is fine)

**Authorization (Custom Credential):**

Vapi no longer uses an inline secret field. Create a **Bearer Token** credential:

| Field | Value |
|-------|--------|
| Name | `Pro-Vigil Webhook` |
| Token | Same as `VAPI_WEBHOOK_SECRET` |
| Header | `Authorization` |
| Bearer prefix | ON |

Attach credential in assistant **Advanced → Authorization** dropdown.

**Server Messages (enable):**

- `status-update`
- `transcript`
- `end-of-call-report`

Click **Publish** after changes.

### Verifying webhooks

In Vapi dashboard:

- **Logs → Webhooks** — POST requests to your Vercel URL (not Logs → API)
- Expect **200** responses
- **401** means credential token ≠ `VAPI_WEBHOOK_SECRET` in Vercel

Docs: [vapi.md](./vapi.md), [Vapi Server authentication](https://docs.vapi.ai/server-url/server-authentication)

---

## 12. Call lifecycle (end-to-end)

```
1. User fills form on dashboard → POST /api/calls
2. CreateCallService → Vapi createOutboundCall()
3. Supabase insert: calls row with call_id = Vapi ID
4. Vapi dials customer, AI conversation runs
5. Webhooks arrive at POST /api/vapi/webhook:
   - status-update → update calls.status
   - transcript → upsert transcripts.transcript (JSONB)
   - end-of-call-report → upsert summaries + structured_output
6. UI polls GET /api/calls and GET /api/calls/[id]
7. User views transcript, summary, downloads TXT/PDF
```

---

## 13. Key design decisions

Summarized from [decisions.md](./decisions.md):

1. **Vapi-first** — App does not run STT/TTS/LLM; Vapi owns the call runtime
2. **Supabase server-side only** — Browser never uses service role key
3. **Webhook 200 on failure** — Avoid Vapi retry storms; monitor logs instead
4. **Result pattern** — Services return `Result<T, ServiceFailure>` for consistent errors
5. **Normalized webhook kinds** — Decouple persistence from raw Vapi payload shapes
6. **React Query polling** — No Supabase Realtime; 5s dashboard / 3s live refresh
7. **call_dashboard view** — Single joined query for list and detail reads
8. **Server-side PDF** — pdf-lib in API route, not client bundle

---

## 14. Project structure (reference)

```
app/
  api/
    calls/              List + create calls
    calls/[id]/         Call detail
    dashboard/          KPI metrics
    download/[id]/      TXT/PDF export
    health/             Health probe
    vapi/webhook/       Vapi webhook handler
  calls/                Call pages (list, detail, live, transcript)
  settings/             Settings page
  page.tsx              Dashboard home

components/
  calls/                Call UI (table, form, transcript, summary)
  dashboard/            Dashboard shell
  data-table/           Reusable table primitives
  layout/               Nav, shell, headers
  shared/               Badges, skeletons, empty/retry states
  ui/                   shadcn primitives

services/
  vapi/                 Vapi client, calls, webhook parsing, transcript normalize
  webhook/              Webhook auth, normalize, persist, orchestrate
  supabase/             DB access (calls, transcripts, summaries)
  download/             TXT/PDF generation
  calls/                Create-call use case
  calls-api.ts          Client-side API fetch helpers

hooks/                  React Query hooks
types/                  Domain models, DTOs, database types
validators/             Zod schemas
constants/              Status enums, API paths
lib/                    Env, logging, API response, service errors
supabase/migrations/    Postgres schema
scripts/                db:verify, db:seed
docs/                   Documentation
```

---

## 15. Testing checklist

### Local

- [ ] `npm run db:verify` — schema OK
- [ ] `npm run build` — zero errors
- [ ] Dashboard loads with demo calls
- [ ] Transcript page renders chat UI
- [ ] Download TXT/PDF works

### Production

- [ ] `/calls` shows data (not skeleton forever)
- [ ] `GET /api/calls` returns 200 JSON
- [ ] Start Call initiates Vapi outbound call
- [ ] Vapi Logs → Webhooks shows POST with 200
- [ ] Call status updates on dashboard
- [ ] Transcript and summary appear after call ends

---

## 16. Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Dashboard empty / skeleton | Supabase env vars missing on Vercel | Add vars, redeploy |
| Vercel URL shows login page | Deployment Protection enabled | Disable Vercel Authentication on Production |
| Webhook 401 | Secret mismatch | Align Vapi credential token with `VAPI_WEBHOOK_SECRET` |
| Webhook 200 but no data | Call row not created yet | Ensure `POST /api/calls` ran before webhook |
| Outbound call fails | Wrong Vapi keys | Use private API key, correct assistant + phone IDs |
| Logs → API only | Wrong Vapi logs tab | Use **Logs → Webhooks** for delivery status |

---

## 17. Related documentation

- [architecture.md](./architecture.md) — Layering and data flow
- [api-contracts.md](./api-contracts.md) — HTTP API reference
- [database.md](./database.md) — Schema and migrations
- [vapi.md](./vapi.md) — Vapi integration details
- [webhook-events.md](./webhook-events.md) — Webhook event handling
- [decisions.md](./decisions.md) — Architecture Decision Records

---

## 18. Summary

We built a **full-stack AI outbound calling demo** that:

- Uses **Vapi** for voice AI and telephony
- Uses **Supabase** for persistent call, transcript, and summary data
- Uses **Next.js** as a secure API boundary between UI and external services
- Deploys to **Vercel** with environment-based configuration
- Receives **Vapi webhooks** to keep the dashboard in sync with live calls

The codebase follows a consistent **service-layer architecture**, typed errors, React Query for server state, and production-ready error handling — suitable as a demo, MVP foundation, or reference implementation for Pro-Vigil sales automation.
