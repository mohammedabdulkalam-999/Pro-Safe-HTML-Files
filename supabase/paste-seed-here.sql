-- PASTE THIS ENTIRE FILE into Supabase SQL Editor, then click Run
-- (Do NOT paste the file path — paste the SQL below)

-- Call 1: John Smith (completed)
insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_001', 'John Smith', '+15555555555', 'completed', 135, now() - interval '2 hours', now() - interval '1 hour 57 minutes', 'Sarah')
on conflict (call_id) do nothing;

insert into public.transcripts (call_id, transcript, raw_transcript)
select c.id,
  '[{"speaker":"assistant","message":"Hello John, this is Sarah from Pro-Vigil."},{"speaker":"customer","message":"Yes, we have 20 cameras."}]'::jsonb,
  'Sarah: Hello John... Customer: Yes, 20 cameras...'
from public.calls c
where c.call_id = 'call_demo_001'
  and not exists (select 1 from public.transcripts t where t.call_id = c.id);

insert into public.summaries (call_id, lead_qualified, consultation_requested, company_name, callback_date, callback_time, summary, structured_output)
select c.id, true, true, 'ABC Construction', 'Tomorrow', '10:00 AM',
  'Customer has 20 cameras. Requested consultation.',
  '{"industry":"Construction","cameraInstalled":true,"monitoring":"Recording Only","interestLevel":"High"}'::jsonb
from public.calls c
where c.call_id = 'call_demo_001'
  and not exists (select 1 from public.summaries s where s.call_id = c.id);

-- Call 2: Mike Johnson (in-progress)
insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, assistant_name)
values ('call_demo_002', 'Mike Johnson', '+15555551234', 'in-progress', 48, now() - interval '48 seconds', 'Sarah')
on conflict (call_id) do nothing;

-- Call 3: Jane Smith (completed, not qualified)
insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_003', 'Jane Smith', '+15555559876', 'completed', 62, now() - interval '5 hours', now() - interval '4 hours 59 minutes', 'Sarah')
on conflict (call_id) do nothing;

insert into public.summaries (call_id, lead_qualified, consultation_requested, summary, structured_output)
select c.id, false, false, 'Customer declined interest.',
  '{"interestLevel":"None","nextAction":"Do Not Contact"}'::jsonb
from public.calls c
where c.call_id = 'call_demo_003'
  and not exists (select 1 from public.summaries s where s.call_id = c.id);

-- Call 4: Bob Johnson (failed)
insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, ended_at, assistant_name)
values ('call_demo_004', 'Bob Johnson', '+15555554321', 'failed', 0, now() - interval '3 hours', now() - interval '3 hours', 'Sarah')
on conflict (call_id) do nothing;

-- Call 5: David Lee (ringing)
insert into public.calls (call_id, customer_name, phone_number, status, duration_seconds, started_at, assistant_name)
values ('call_demo_005', 'David Lee', '+15555556789', 'ringing', 0, now() - interval '15 seconds', 'Sarah')
on conflict (call_id) do nothing;
