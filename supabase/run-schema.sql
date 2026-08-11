-- =============================================================================
-- Pro-Vigil AI Sales Agent Demo — FULL SCHEMA (run in Supabase SQL Editor)
-- =============================================================================
-- Run this file if you prefer a single paste instead of individual migrations.
-- For fresh installs only. If tables already exist, run migrations individually.
-- =============================================================================

-- 1. calls
create table if not exists public.calls (
  id            uuid        primary key default gen_random_uuid(),
  call_id       text        not null,
  customer_name text,
  phone_number  text        not null,
  status        text        not null,
  duration_seconds integer  not null default 0,
  started_at    timestamptz,
  ended_at      timestamptz,
  assistant_name text       not null default 'Sarah',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint calls_call_id_unique unique (call_id),
  constraint calls_status_check check (
    status in ('initiated','ringing','in-progress','completed','failed','busy','no-answer','voicemail')
  ),
  constraint calls_duration_non_negative check (duration_seconds >= 0)
);

-- 2. transcripts
create table if not exists public.transcripts (
  id             uuid        primary key default gen_random_uuid(),
  call_id        uuid        not null,
  transcript     jsonb,
  raw_transcript text,
  created_at     timestamptz not null default now(),
  constraint transcripts_call_id_fkey foreign key (call_id) references public.calls(id) on delete cascade,
  constraint transcripts_call_id_unique unique (call_id)
);

-- 3. summaries
create table if not exists public.summaries (
  id                      uuid        primary key default gen_random_uuid(),
  call_id                 uuid        not null,
  lead_qualified          boolean,
  consultation_requested  boolean,
  company_name            text,
  callback_date           text,
  callback_time           text,
  summary                 text,
  structured_output       jsonb,
  created_at              timestamptz not null default now(),
  constraint summaries_call_id_fkey foreign key (call_id) references public.calls(id) on delete cascade,
  constraint summaries_call_id_unique unique (call_id)
);

-- 4. indexes
create index if not exists idx_calls_status on public.calls(status);
create index if not exists idx_calls_created_at_desc on public.calls(created_at desc);
create index if not exists idx_calls_phone_number on public.calls(phone_number);
create index if not exists idx_calls_customer_name on public.calls(customer_name);
create index if not exists idx_transcripts_call_id on public.transcripts(call_id);
create index if not exists idx_transcripts_created_at_desc on public.transcripts(created_at desc);
create index if not exists idx_summaries_call_id on public.summaries(call_id);
create index if not exists idx_summaries_lead_qualified on public.summaries(lead_qualified) where lead_qualified = true;
create index if not exists idx_summaries_created_at_desc on public.summaries(created_at desc);

-- 5. dashboard view
create or replace view public.call_dashboard as
select
  c.id, c.call_id, c.customer_name, c.phone_number, c.status,
  c.duration_seconds, c.started_at, c.ended_at, c.assistant_name,
  c.created_at, c.updated_at,
  s.summary, s.lead_qualified, s.consultation_requested,
  s.company_name, s.callback_date, s.callback_time, s.structured_output,
  t.raw_transcript, t.transcript
from public.calls c
left join public.summaries s on c.id = s.call_id
left join public.transcripts t on c.id = t.call_id;

-- 6. security (MVP demo)
alter table public.calls disable row level security;
alter table public.transcripts disable row level security;
alter table public.summaries disable row level security;
