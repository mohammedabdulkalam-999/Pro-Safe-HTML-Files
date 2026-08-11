# Pro-Vigil AI Sales Agent — End-to-End Guide

**From idea → build → Supabase → Vercel → Vapi → production**

This is the complete story of how the project was built and shipped. Use it for onboarding, demos, audits, or rebuilding the same pipeline.

Related docs: [architecture.md](./architecture.md) · [api-contracts.md](./api-contracts.md) · [database.md](./database.md) · [vapi.md](./vapi.md) · [webhook-events.md](./webhook-events.md) · [decisions.md](./decisions.md) · [project-development.md](./project-development.md)

---

## Table of contents

1. [What we set out to build](#1-what-we-set-out-to-build)
2. [Architecture choice](#2-architecture-choice)
3. [Tech stack and why](#3-tech-stack-and-why)
4. [How we built it (phases)](#4-how-we-built-it-phases)
5. [Database setup (Supabase)](#5-database-setup-supabase)
6. [Vapi assistant setup](#6-vapi-assistant-setup)
7. [Local development](#7-local-development)
8. [Deploy to production (Vercel)](#8-deploy-to-production-vercel)
9. [Connect Vapi webhooks to production](#9-connect-vapi-webhooks-to-production)
10. [End-to-end call flow](#10-end-to-end-call-flow)
11. [Production smoke test](#11-production-smoke-test)
12. [Troubleshooting](#12-troubleshooting)
13. [Checklist — start to prod](#13-checklist--start-to-prod)
14. [File map](#14-file-map)

---

## 1. What we set out to build

**Goal:** A working demo where Pro-Vigil can:

1. Start an **outbound AI sales call** from a web dashboard
2. Watch **live status** (ringing → in-progress → completed)
3. Read a **chat-style transcript**
4. See an **AI lead-qualification summary** (CCTV, monitoring, company, etc.)
5. **Download** the report as TXT or PDF

**Non-goals (intentionally out of scope):**

- Building our own telephony / STT / TTS / LLM runtime
- Microservices
- Auth / multi-tenant SaaS login (demo focuses on the calling pipeline)
- Realtime WebSockets (we use React Query polling instead)

---

## 2. Architecture choice

### Pattern: modular monolith (not microservices)

We built **one Next.js app** that contains both UI and API. That app talks to two external managed services:

| Piece | Role |
|-------|------|
| **Next.js on Vercel** | UI + API + webhook receiver + PDF generation |
| **Supabase** | PostgreSQL — durable store for calls, transcripts, summaries |
| **Vapi** | Telephony + AI voice agent (LLM: OpenAI `gpt-4o-mini`) |

```
┌──────────────────────────────────────────────────────────┐
│              ONE APP (modular monolith)                  │
│                                                          │
│   Browser (React)  →  /api/*  →  services/*              │
│   Deployed once on Vercel                                │
└────────────┬───────────────────────────┬─────────────────┘
             │                           │
      ┌──────▼──────┐             ┌──────▼──────┐
      │  Supabase   │             │    Vapi     │
      │  Postgres   │             │ Voice + LLM │
      └─────────────┘             └─────────────┘
```

### Layering rule (enforced by convention)

```
React components  →  /api/* only
API routes        →  services/*
services          →  Supabase client / Vapi client
```

**Never** call Supabase or Vapi from the browser. Secrets stay server-side.

### Why this architecture

| Decision | Why |
|----------|-----|
| Monolith, not microservices | One repo, one deploy, MVP speed |
| Next.js full-stack | UI + API + webhooks in one Vercel project |
| Vapi-first | Don’t reinvent phone AI |
| Supabase server-only | Keep `service_role` key off the client |
| React Query polling | Simple live updates without WebSockets |

Full ADRs: [decisions.md](./decisions.md)

---

## 3. Tech stack and why

### Frontend

| Tech | Why |
|------|-----|
| Next.js 15 App Router | Pages + API in one framework; Vercel-native |
| React 19 + TypeScript | Typed UI shared with backend types |
| Tailwind + shadcn/ui | Fast, consistent UI without a custom design system |
| TanStack React Query | Auto-refresh dashboard (5s) and live call (3s) |
| TanStack React Table | Search, sort, pagination for calls list |
| React Hook Form + Zod | Form validation aligned with API schemas |
| Sonner | Toast feedback for actions |

### Backend (same Next.js app)

| Tech | Why |
|------|-----|
| Next.js API routes | Thin HTTP controllers |
| Service layer (`services/`) | Business logic, Result pattern, typed errors |
| Supabase JS (service role) | Server-side Postgres access |
| Custom Vapi HTTP client | Retries, timeouts, Bearer auth |
| pdf-lib | Server-side PDF reports |
| Zod | Request validation |

### External services

| Service | Why |
|---------|-----|
| **Supabase** | Managed Postgres; no DB ops |
| **Vapi** | Outbound calling + AI conversation + webhooks |
| **Vercel** | Host Next.js, env vars, HTTPS for webhooks |
| **GitHub** | Source of truth for Vercel deploys |

### LLM (configured in Vapi, not in our code)

| Setting | Value |
|---------|--------|
| Assistant | **Pro-Vigil Qualifier** |
| Provider | OpenAI |
| Model | **`gpt-4o-mini`** |
| Max tokens | 120 |

Our app only stores `VAPI_ASSISTANT_ID`. The model lives in the Vapi assistant config.

---

## 4. How we built it (phases)

### Phase 1 — Foundation

- Scaffold Next.js 15 + TypeScript + Tailwind
- Add shadcn/ui primitives
- App shell: nav, layout, page container
- Env validation (`lib/env.ts`)
- API response envelope + Result pattern
- Shared types, validators, constants

### Phase 2 — Database

SQL migrations in order:

1. `calls` — metadata, Vapi `call_id`, status, duration
2. `transcripts` — JSONB messages + raw text
3. `summaries` — lead qualification + structured output
4. Indexes
5. `call_dashboard` view — joined read model
6. Security config
7. Demo seed data

Scripts:

```bash
npm run db:verify   # check tables/views exist
npm run db:seed     # insert demo rows
```

### Phase 3 — Vapi outbound calling

- `services/vapi/client.ts` — HTTP client
- `services/vapi/calls.ts` — `createOutboundCall()`, status mapping
- `services/calls/create-call.service.ts` — Vapi create + Supabase insert
- `POST /api/calls` — UI entry point

### Phase 4 — Webhooks

- `POST /api/vapi/webhook`
- Auth → normalize → persist pipeline
- Events: `status-update`, `transcript`, `end-of-call-report`
- Policy: **401** bad secret; **200** even on processing failure (avoid Vapi retry storms)

### Phase 5 — Dashboard UI

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — start call, metrics, recent calls |
| `/calls` | Full table — search, sort, pagination |
| `/calls/[id]` | Detail + summary card |
| `/calls/[id]/live` | Live view (3s poll) |
| `/calls/[id]/transcript` | Chat transcript |
| `/settings` | Settings |

### Phase 6 — Downloads

- `GET /api/download/[id]?format=txt|pdf`
- TXT + PDF via `services/download/`

### Phase 7 — Production hardening

- `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`
- Security headers in `next.config.ts`
- Accessibility labels
- Dead code removed
- Lint + production build clean

### Phase 8 — Docs + ship

- Docs under `docs/`
- Sync to GitHub folder → push → Vercel → Vapi webhook

---

## 5. Database setup (Supabase)

### Create project

1. [supabase.com](https://supabase.com) → New project  
   Example name: **Pro-Vigil Sales AI voice agent**
2. Wait for project to be ready

### Get keys

**Settings → API Keys** (or Project Settings → API):

| Supabase field | Env variable |
|----------------|--------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable / anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Secret / service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

Example project URL:

```
https://csljldakjcmiiwxhlkij.supabase.co
```

### Apply schema

Either:

- Paste SQL from `supabase/run-all-migrations.sql` into **SQL Editor**, or
- Run migrations individually from `supabase/migrations/` in order

### Seed + verify

```bash
npm run db:seed
npm run db:verify
```

Expected:

```
✓ calls table
✓ transcripts table
✓ summaries table
✓ call_dashboard view
Supabase is connected and schema looks good.
```

### Data model (summary)

```
calls (1) ─── transcripts (1)
  │
  └─── summaries (1)

call_dashboard (view) = join of all three
```

`calls.call_id` = **Vapi call ID** (external).  
`calls.id` = internal UUID used in app URLs.

Details: [database.md](./database.md)

---

## 6. Vapi assistant setup

### Create / configure assistant

1. Vapi dashboard → Assistant: **Pro-Vigil Qualifier**
2. Model: OpenAI **`gpt-4o-mini`**
3. Add Pro-Vigil sales / qualification script
4. Configure **structured output** to match `StructuredOutput` in `types/call.ts`
5. Attach a phone number → copy **Phone Number ID**
6. Copy **Assistant ID**

### Get API key

Vapi → API Keys → use the **Private** key (not public) for `VAPI_API_KEY`.

### Env vars for the app

```env
VAPI_API_KEY=...              # Private key
VAPI_ASSISTANT_ID=...         # Pro-Vigil Qualifier ID
VAPI_PHONE_NUMBER_ID=...      # Outbound caller ID
VAPI_WEBHOOK_SECRET=...       # Shared secret for webhook auth
```

Webhook URL and credential are configured **after** Vercel deploy (Section 9).

Details: [vapi.md](./vapi.md)

---

## 7. Local development

### Folders

| Folder | Purpose |
|--------|---------|
| `prosafe-html-files` | Cursor / day-to-day development |
| `prosafe-html-files_Sales agent AI` | GitHub Desktop + Vercel source |

GitHub: `mohammedabdulkalam-999/prosafe-html-files_Sales-agent-AI`

### Setup

```bash
cd prosafe-html-files
npm install
cp .env.example .env.local
# Fill all 7 env vars from Supabase + Vapi

npm run db:verify
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run build` | Production build check |
| `npm run lint` | ESLint |
| `npm run db:verify` | Supabase connectivity + schema |
| `npm run db:seed` | Demo data |

### Local webhook testing (optional)

For real Vapi webhooks on localhost, use a tunnel (e.g. ngrok) and point Vapi Server URL to:

```
https://{tunnel}/api/vapi/webhook
```

For production, use the Vercel HTTPS URL instead.

---

## 8. Deploy to production (Vercel)

### Step A — Push code

1. Sync latest code into `prosafe-html-files_Sales agent AI`
2. GitHub Desktop → commit → **Push origin**

### Step B — Import on Vercel

1. [vercel.com](https://vercel.com) → Add New → Project  
2. Import `prosafe-html-files_Sales-agent-AI`  
3. Framework: **Next.js** (auto)

### Step C — Environment variables

Add for **Production** (and Preview if desired):

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key |
| `VAPI_API_KEY` | Vapi **private** API key |
| `VAPI_ASSISTANT_ID` | Assistant ID |
| `VAPI_PHONE_NUMBER_ID` | Phone number ID |
| `VAPI_WEBHOOK_SECRET` | Same secret you will use in Vapi credential |

Then **Deploy** (or Redeploy after changing env vars).

### Step D — Make the site public

Vapi cannot hit a login-gated URL.

1. Vercel → Project → **Settings → Deployment Protection**  
2. Turn off **Vercel Authentication** for Production  
3. Prefer the stable **Production** domain (not a preview URL with a random hash)

### Step E — Smoke-check the site

Open:

- `https://YOUR-APP.vercel.app/`
- `https://YOUR-APP.vercel.app/calls`
- `https://YOUR-APP.vercel.app/api/calls` → JSON with calls

If `/api/calls` returns demo rows, Supabase on Vercel is working.

---

## 9. Connect Vapi webhooks to production

### Server URL

In Vapi → **Pro-Vigil Qualifier** → **Advanced** → Webhook Server:

```
https://YOUR-APP.vercel.app/api/vapi/webhook
```

Timeout: ~20s is fine.

### Webhook secret (Custom Credential)

Vapi no longer uses a plain “secret” box. Create a **Bearer Token** credential:

1. From Authorization → **Add New** (or Keys / Custom Credentials)  
   **Note:** “Integrations” (OpenAI, ElevenLabs, etc.) is the **wrong** page.
2. Fill:

| Field | Value |
|-------|--------|
| Type | Bearer Token |
| Name | `Pro-Vigil Webhook` |
| Token | Exact same as `VAPI_WEBHOOK_SECRET` |
| Header Name | `Authorization` |
| Include Bearer Prefix | **ON** |

3. Back on assistant Advanced → Authorization → select **Pro-Vigil Webhook**  
4. Do **not** leave “No authentication” if the secret is set in Vercel (you’ll get 401s)

### Server Messages (events)

On Advanced, scroll to **Messaging → Server Messages**. Enable:

- `status-update`
- `transcript`
- `end-of-call-report`

### Publish

Click green **Publish** (unsaved changes banner).

### Verify delivery

Vapi → **Logs → Webhooks** (not Logs → API):

| Status | Meaning |
|--------|---------|
| **200** | App accepted the webhook |
| **401** | Secret mismatch |
| Login / HTML | Deployment protection still on |

---

## 10. End-to-end call flow

```
1. User opens dashboard
2. Enters name + phone → Start Call
3. Browser → POST /api/calls
4. CreateCallService:
     a. Vapi POST /call  (assistant + phone + customer)
     b. Supabase INSERT into calls (call_id = Vapi ID)
5. Phone rings; AI agent (gpt-4o-mini) converses
6. Vapi POSTs to /api/vapi/webhook:
     - status-update  → update calls.status / timestamps
     - transcript     → upsert transcripts
     - end-of-call-report → upsert summaries + structured output
7. UI polls GET /api/calls and GET /api/calls/[id]
8. User opens transcript, summary, downloads TXT/PDF
```

### Status mapping (Vapi → our app)

| Vapi | App |
|------|-----|
| queued | initiated |
| ringing | ringing |
| in-progress / forwarding | in-progress |
| ended | completed |
| busy | busy |
| no-answer | no-answer |
| failed / canceled | failed |

---

## 11. Production smoke test

Run after every deploy:

| # | Test | Pass criteria |
|---|------|----------------|
| 1 | Open `/` | Dashboard loads |
| 2 | Open `/calls` | Calls list (demo or real) |
| 3 | `GET /api/calls` | `success: true`, items array |
| 4 | `GET /api/health` | supabase + vapi UP |
| 5 | Start Call to your phone | Phone rings |
| 6 | Vapi Logs → Webhooks | POST → **200** |
| 7 | `/calls` during call | Status updates |
| 8 | After hangup | Transcript + summary appear |
| 9 | Download TXT/PDF | File downloads |

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Site asks for Vercel login | Deployment Protection | Disable Vercel Authentication |
| Empty / forever skeleton | Missing Supabase env on Vercel | Add 3 Supabase vars → Redeploy |
| Outbound call fails | Wrong Vapi keys | Private API key + correct assistant/phone IDs |
| Webhook 401 | Secret mismatch | Align credential token with `VAPI_WEBHOOK_SECRET` |
| Webhook 200 but no DB update | Call row missing / race | Ensure call started via our `POST /api/calls` |
| Only see Logs → API | Wrong tab | Use **Logs → Webhooks** |
| Preview URL breaks webhook | Hash URL changes | Use Production domain |
| SQL Editor error `42601` | Pasted file path instead of SQL | Paste contents of `.sql` file |

---

## 13. Checklist — start to prod

### Build

- [ ] Next.js app with layered services
- [ ] Supabase migrations applied
- [ ] Vapi assistant + phone number ready
- [ ] Local `.env.local` filled
- [ ] `npm run db:verify` passes
- [ ] `npm run build` passes

### Deploy

- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] All 7 env vars set
- [ ] Deploy succeeded
- [ ] Deployment Protection off for Production
- [ ] `/api/calls` returns data on production URL

### Vapi

- [ ] Server URL = `https://YOUR-APP.vercel.app/api/vapi/webhook`
- [ ] Bearer credential created and attached
- [ ] Server messages enabled
- [ ] Assistant **Published**
- [ ] Webhook logs show **200** after a test call

### Go-live

- [ ] Live outbound test call succeeds
- [ ] Transcript + summary visible in app
- [ ] Download works

---

## 14. File map

```
app/
  page.tsx                    Dashboard
  calls/                      Calls list, detail, live, transcript
  api/calls/                  List + create
  api/calls/[id]/             Detail
  api/vapi/webhook/           Vapi webhooks
  api/download/[id]/          TXT/PDF
  api/dashboard/              KPIs
  api/health/                 Health check

components/calls/             Tables, forms, transcript, summary
services/vapi/                Vapi client + call + webhook parse
services/webhook/             Auth → normalize → persist
services/supabase/            DB access
services/download/            TXT/PDF builders
services/calls/               Create-call use case

supabase/migrations/          Schema
scripts/                      db:verify, db:seed
docs/                         This documentation set
```

---

## Summary

| Stage | What we did |
|-------|-------------|
| **Design** | Modular monolith; UI → API → services → Supabase/Vapi |
| **Build** | Next.js dashboard + webhook pipeline + downloads |
| **Data** | Supabase schema + seed + verify |
| **AI voice** | Vapi assistant (OpenAI `gpt-4o-mini`) |
| **Ship** | GitHub → Vercel env vars → public URL |
| **Connect** | Vapi webhook URL + Bearer credential + Publish |
| **Prove** | Live call → Logs 200 → transcript + summary in app |

That is the full path **from start to production**.
