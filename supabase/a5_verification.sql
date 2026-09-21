-- Read-only evidence queries, run in Supabase SQL Editor after live tests.
select idempotency_key, count(*) as resource_count
from public.a5_status_events group by idempotency_key;
select idempotency_key, event, delivery, created_at
from public.a5_status_events order by created_at desc limit 20;
select source, event_id, secret_verified, payload, received_at
from public.a5_webhook_receipts order by received_at desc limit 20;
select action, details, created_at from public.a5_integration_logs order by created_at desc limit 50;
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename like 'a5_%';

