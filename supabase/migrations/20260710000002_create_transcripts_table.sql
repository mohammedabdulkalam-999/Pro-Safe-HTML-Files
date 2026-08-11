-- Migration: 20260710000002_create_transcripts_table
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: Conversation transcripts (JSON + raw text)

begin;

create table if not exists public.transcripts (
  id             uuid        primary key default gen_random_uuid(),
  call_id        uuid        not null,
  transcript     jsonb,
  raw_transcript text,
  created_at     timestamptz not null default now(),

  constraint transcripts_call_id_fkey
    foreign key (call_id)
    references public.calls (id)
    on delete cascade,

  constraint transcripts_call_id_unique unique (call_id)
);

comment on table public.transcripts is 'Full conversation transcripts per call';
comment on column public.transcripts.transcript is 'JSON array of {speaker, message} pairs for chat UI';
comment on column public.transcripts.raw_transcript is 'Plain-text transcript for download/search';

commit;
