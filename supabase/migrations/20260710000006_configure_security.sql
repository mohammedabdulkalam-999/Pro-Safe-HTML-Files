-- Migration: 20260710000006_configure_security.sql
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: Disable RLS for MVP demo (server uses service role key)

begin;

alter table public.calls       disable row level security;
alter table public.transcripts disable row level security;
alter table public.summaries   disable row level security;

commit;
