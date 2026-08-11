-- Migration: 20260710000003_create_summaries_table
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: AI-generated lead qualification summaries

begin;

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

  constraint summaries_call_id_fkey
    foreign key (call_id)
    references public.calls (id)
    on delete cascade,

  constraint summaries_call_id_unique unique (call_id)
);

comment on table public.summaries is 'AI qualification output per call';
comment on column public.summaries.structured_output is 'Structured Vapi output (industry, cameras, monitoring, etc.)';

commit;
