-- =============================================================================
-- Pro-Vigil AI Sales Agent Demo — SEED DATA (run AFTER run-schema.sql)
-- =============================================================================

insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_001', 'John Smith', '+15555555555', 'completed', 135, now() - interval '2 hours', now() - interval '1 hour 57 minutes', 'Sarah')
on conflict (call_id) do nothing;

insert into public.transcripts (call_id, transcript, raw_transcript)
select c.id,
  '[{"speaker":"assistant","message":"Hello John, this is Sarah from Pro-Vigil. Do you currently have CCTV on site?"},{"speaker":"customer","message":"Yes, we have about 20 cameras across our construction yard."},{"speaker":"assistant","message":"Great. Are they actively monitored or recording only?"},{"speaker":"customer","message":"Recording only right now. We had a theft last month."},{"speaker":"assistant","message":"I understand. Would you be open to a consultation on remote video monitoring?"},{"speaker":"customer","message":"Yes, please schedule something for tomorrow at 10 AM."}]'::jsonb,
  'Sarah: Hello John... Customer: Yes, 20 cameras...'
from public.calls c where c.call_id = 'call_demo_001'
on conflict (call_id) do nothing;

insert into public.summaries (call_id, lead_qualified, consultation_requested, company_name, callback_date, callback_time, summary, structured_output)
select c.id, true, true, 'ABC Construction', 'Tomorrow', '10:00 AM',
  'Customer has 20 cameras, recording only. Security incident last month. Requested consultation.',
  '{"industry":"Construction","cameraInstalled":true,"monitoring":"Recording Only","securityIncident":"Yes","interestLevel":"High","nextAction":"Schedule Demo"}'::jsonb
from public.calls c where c.call_id = 'call_demo_001'
on conflict (call_id) do nothing;

insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, assistant_name)
values ('call_demo_002', 'Mike Johnson', '+15555551234', 'in-progress', 48, now() - interval '48 seconds', 'Sarah')
on conflict (call_id) do nothing;

insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_003', 'Jane Smith', '+15555559876', 'completed', 62, now() - interval '5 hours', now() - interval '4 hours 59 minutes', 'Sarah')
on conflict (call_id) do nothing;

insert into public.summaries (call_id, lead_qualified, consultation_requested, summary, structured_output)
select c.id, false, false, 'Customer declined interest.', '{"interestLevel":"None","nextAction":"Do Not Contact"}'::jsonb
from public.calls c where c.call_id = 'call_demo_003'
on conflict (call_id) do nothing;

insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_004', 'Bob Johnson', '+15555554321', 'failed', 0, now() - interval '3 hours', now() - interval '3 hours', 'Sarah')
on conflict (call_id) do nothing;

insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, assistant_name)
values ('call_demo_005', 'David Lee', '+15555556789', 'ringing', 0, now() - interval '15 seconds', 'Sarah')
on conflict (call_id) do nothing;
