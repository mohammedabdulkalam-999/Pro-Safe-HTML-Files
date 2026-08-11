-- Migration: 20260710000005_create_call_dashboard_view.sql
-- Project: Pro-Vigil AI Sales Agent Demo
-- Description: Denormalized view for dashboard and call details

begin;

create or replace view public.call_dashboard as
select
  c.id,
  c.call_id,
  c.customer_name,
  c.phone_number,
  c.status,
  c.duration_seconds,
  c.started_at,
  c.ended_at,
  c.assistant_name,
  c.created_at,
  c.updated_at,
  s.summary,
  s.lead_qualified,
  s.consultation_requested,
  s.company_name,
  s.callback_date,
  s.callback_time,
  s.structured_output,
  t.raw_transcript,
  t.transcript
from public.calls c
left join public.summaries s
  on c.id = s.call_id
left join public.transcripts t
  on c.id = t.call_id;

comment on view public.call_dashboard is 'Joined call + summary + transcript for dashboard queries';

commit;
