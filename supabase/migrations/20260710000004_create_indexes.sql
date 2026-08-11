-- Migration: 20260710000004_create_indexes.sql
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: Performance indexes for dashboard queries

begin;

-- calls
create index if not exists idx_calls_status
  on public.calls (status);

create index if not exists idx_calls_created_at_desc
  on public.calls (created_at desc);

create index if not exists idx_calls_phone_number
  on public.calls (phone_number);

create index if not exists idx_calls_customer_name
  on public.calls (customer_name);

-- transcripts
create index if not exists idx_transcripts_call_id
  on public.transcripts (call_id);

create index if not exists idx_transcripts_created_at_desc
  on public.transcripts (created_at desc);

-- summaries
create index if not exists idx_summaries_call_id
  on public.summaries (call_id);

create index if not exists idx_summaries_lead_qualified
  on public.summaries (lead_qualified)
  where lead_qualified = true;

create index if not exists idx_summaries_created_at_desc
  on public.summaries (created_at desc);

commit;
