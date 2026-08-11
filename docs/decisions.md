# Architecture Decision Records

Lightweight log of key technical decisions for the Pro-Vigil AI Sales Agent Demo.

---

## ADR-001: Vapi-first call orchestration

**Status:** Accepted

**Context:** The app needs outbound AI phone calls with real-time transcripts and structured lead qualification.

**Decision:** Use Vapi as the telephony + conversational AI platform. The Next.js app does not manage audio, STT, TTS, or LLM inference directly.

**Consequences:**
- All call state changes flow from Vapi webhooks.
- `call_id` in Supabase maps to Vapi's call ID.
- Vapi env vars are required for production (`VAPI_API_KEY`, assistant, phone number, webhook secret).

---

## ADR-002: Supabase as durable store, not client-facing

**Status:** Accepted

**Context:** Dashboard needs persistent calls, transcripts, and summaries.

**Decision:** Supabase (Postgres) stores all call data. The browser never connects to Supabase directly — only through `/api/*` routes using the service role key server-side.

**Consequences:**
- RLS is configured but server bypasses it with service role.
- React components must use hooks → `calls-api.ts` → API routes.
- No Supabase Realtime; polling via React Query instead.

---

## ADR-003: Webhook returns 200 on processing failures

**Status:** Accepted

**Context:** Vapi retries webhooks on non-2xx responses. Transient DB errors or race conditions (webhook before call record) should not cause retry storms.

**Decision:** Return HTTP 200 for all webhook requests except authentication failures (401). Log errors server-side; include `processed: false` in response body.

**Consequences:**
- Must monitor logs for silent failures.
- Call-not-found is a normal skipped state during race windows.

---

## ADR-004: Service layer with Result pattern

**Status:** Accepted

**Context:** API routes and use cases need consistent error handling across Vapi and Supabase.

**Decision:**
- Integration code in `services/vapi/` and `services/supabase/` throws typed errors.
- Use cases (e.g. `CreateCallService`) return `Result<T, ServiceFailure>`.
- API routes map failures to HTTP via `fromResult()` / `handleApiError()`.

**Consequences:**
- Unified error mapping in `lib/service-errors.ts`.
- UI can display structured error messages from API responses.

---

## ADR-005: Normalized webhook event kinds

**Status:** Accepted

**Context:** Vapi sends many message types; the app only cares about a subset for persistence.

**Decision:** `resolveWebhookEventKinds()` maps raw Vapi `message.type` + payload content to internal kinds: `call.started`, `call.ended`, `transcript`, `structured-output`.

**Consequences:**
- Webhook orchestration (`services/webhook/`) is decoupled from Vapi payload shapes.
- Adding new event types requires updating resolver + persistence switch.

---

## ADR-006: React Query for server state

**Status:** Accepted

**Context:** Dashboard and live call pages need auto-refresh without WebSockets.

**Decision:** TanStack Query v5 with `refetchInterval` (5s dashboard, 3s active calls). `keepPreviousData` on paginated lists.

**Consequences:**
- Simple mental model; no Supabase Realtime subscription complexity.
- Slight delay between webhook persistence and UI update (≤ poll interval).

---

## ADR-007: call_dashboard view for reads

**Status:** Accepted

**Context:** List and detail pages need call + transcript + summary data together.

**Decision:** Postgres view `call_dashboard` joins `calls`, `transcripts`, `summaries`. All list/detail reads go through the view; writes go to base tables.

**Consequences:**
- Single query for dashboard rows.
- View must be updated if schema changes.

---

## ADR-008: pdf-lib for transcript downloads

**Status:** Accepted

**Context:** Users need TXT and PDF exports of call reports.

**Decision:** Generate files server-side in `services/download/` using `pdf-lib`. No client-side PDF generation.

**Consequences:**
- PDF generation stays off the client bundle.
- Professional layout controlled in `build-pdf.ts`.

---

## ADR-009: No direct Vapi/Supabase from React components

**Status:** Accepted

**Context:** Prevent secret leakage and keep a single API boundary.

**Decision:** Enforced by convention — components → hooks → `calls-api.ts` → `/api/*` → services.

**Consequences:**
- All new features must follow the same layering.
- Easier to audit security (no keys in client bundle).

---

## ADR-010: Legacy HTML wireframes excluded from deploy

**Status:** Accepted

**Context:** Repo root contains old static HTML prototypes unrelated to the Next.js app.

**Decision:** `.vercelignore` excludes root `*.html` files from Vercel deployments.

**Consequences:**
- Wireframes remain in repo for reference but do not ship to production.

---

## Template for new decisions

```markdown
## ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated

**Context:** What problem are we solving?

**Decision:** What did we choose?

**Consequences:** What are the trade-offs?
```
