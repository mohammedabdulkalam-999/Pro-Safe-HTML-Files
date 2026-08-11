-- Migration: 20260710000001_create_calls_table
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: Core call metadata table

begin;

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
    status in (
      'initiated',
      'ringing',
      'in-progress',
      'completed',
      'failed',
      'busy',
      'no-answer',
      'voicemail'
    )
  ),
  constraint calls_duration_non_negative check (duration_seconds >= 0)
);

comment on table public.calls is 'Outbound AI sales call records';
comment on column public.calls.call_id is 'External Vapi call identifier';

commit;
