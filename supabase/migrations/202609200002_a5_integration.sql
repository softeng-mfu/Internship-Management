-- Standalone A5 integration schema. Does not require or modify the internship domain schema.
create table public.a5_status_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (length(idempotency_key) between 1 and 128),
  request_data jsonb not null,
  event jsonb not null,
  delivery jsonb not null default '{"state":"sending"}',
  created_at timestamptz not null default now()
);
create table public.a5_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  secret_verified boolean not null default true,
  received_at timestamptz not null default now(),
  unique(source, event_id)
);
create table public.a5_integration_logs (
  id bigint generated always as identity primary key,
  action text not null,
  details jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.a5_status_events enable row level security;
alter table public.a5_webhook_receipts enable row level security;
alter table public.a5_integration_logs enable row level security;
revoke all on public.a5_status_events, public.a5_webhook_receipts, public.a5_integration_logs from anon, authenticated;
grant select, insert, update on public.a5_status_events to service_role;
grant select, insert on public.a5_webhook_receipts, public.a5_integration_logs to service_role;
grant usage, select on sequence public.a5_integration_logs_id_seq to service_role;

create function public.a5_claim_event(p_key text, p_data jsonb, p_source text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  item public.a5_status_events%rowtype;
  new_event jsonb;
begin
  new_event := jsonb_build_object(
    'event_id', gen_random_uuid()::text,
    'event_type', 'internship.status_changed',
    'occurred_at', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'source', p_source,
    'data', p_data || '{"demo":true}'::jsonb
  );
  insert into public.a5_status_events(idempotency_key, request_data, event)
    values (p_key, p_data, new_event)
    on conflict (idempotency_key) do nothing
    returning * into item;
  if found then
    return jsonb_build_object('created', true, 'event', item.event, 'delivery', item.delivery);
  end if;
  -- The unique constraint serializes simultaneous claims; only the inserter sends.
  select * into strict item from public.a5_status_events where idempotency_key = p_key;
  if item.request_data <> p_data then
    return jsonb_build_object('created', false, 'conflict', true);
  end if;
  return jsonb_build_object('created', false, 'event', item.event, 'delivery', item.delivery);
end;
$$;

create function public.a5_finish_event(p_key text, p_delivery jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_delivery->>'state' not in ('delivered', 'failed', 'unknown') then
    raise exception 'Invalid delivery state';
  end if;
  update public.a5_status_events set delivery = p_delivery
    where idempotency_key = p_key and delivery->>'state' = 'sending';
  if not found then raise exception 'Missing or already finalized event'; end if;
end;
$$;

create function public.a5_receive_webhook(p_event jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item public.a5_webhook_receipts%rowtype;
begin
  insert into public.a5_webhook_receipts(source, event_id, event_type, payload)
  values (p_event->>'source', p_event->>'event_id', p_event->>'event_type', p_event)
  on conflict (source,event_id) do nothing returning * into item;
  if found then return '{"duplicate":false}'::jsonb; end if;
  select * into strict item from public.a5_webhook_receipts
    where source = p_event->>'source' and event_id = p_event->>'event_id';
  return jsonb_build_object('duplicate', true, 'conflict', item.payload <> p_event);
end;
$$;
revoke all on function public.a5_claim_event(text,jsonb,text), public.a5_finish_event(text,jsonb),
  public.a5_receive_webhook(jsonb) from public, anon, authenticated;
grant execute on function public.a5_claim_event(text,jsonb,text), public.a5_finish_event(text,jsonb),
  public.a5_receive_webhook(jsonb) to service_role;

