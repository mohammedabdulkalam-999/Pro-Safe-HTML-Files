# Supabase Migrations

PostgreSQL-only migrations for the Pro-Vigil AI Sales Agent Demo. No Prisma.

## Folder structure

```
supabase/
├── migrations/                          # Ordered migration files (Supabase CLI format)
│   ├── 20260710000001_create_calls_table.sql
│   ├── 20260710000002_create_transcripts_table.sql
│   ├── 20260710000003_create_summaries_table.sql
│   ├── 20260710000004_create_indexes.sql
│   ├── 20260710000005_create_call_dashboard_view.sql
│   ├── 20260710000006_configure_security.sql
│   └── 20260710000007_seed_demo_data.sql
├── run-schema.sql                       # All schema in one file (SQL Editor)
├── run-seed.sql                         # Seed data only (SQL Editor)
└── README.md
```

## Option A — Supabase SQL Editor (recommended for demo)

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the **contents** of `run-schema.sql` → paste → **Run without RLS**
3. Copy the **contents** of `run-seed.sql` → paste → **Run**
4. Verify in **Table Editor**: `calls`, `transcripts`, `summaries`

> Do **not** paste file paths like `supabase/migrations/...` — paste the SQL inside the files.

## Option B — Individual migrations

Run each file in `migrations/` in numeric order (000001 → 000007).

## Option C — Supabase CLI

```bash
supabase link --project-ref csljldakjcmiiwxhlkij
supabase db push
```

## Schema overview

| Object | Type | Description |
|--------|------|-------------|
| `calls` | Table | Call metadata (status, duration, customer) |
| `transcripts` | Table | JSON + raw text conversation |
| `summaries` | Table | AI qualification output |
| `call_dashboard` | View | Joined calls + summaries + transcripts |

## Relationships

```
calls (1) ──→ (1) transcripts   ON DELETE CASCADE
calls (1) ──→ (1) summaries     ON DELETE CASCADE
```

## TypeScript types

Row types live in `types/database.ts` and are used by `services/supabase/*`.

## Verify connection

```bash
node scripts/verify-supabase.mjs
```
