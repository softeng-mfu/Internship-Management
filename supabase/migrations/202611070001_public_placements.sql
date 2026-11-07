-- Independent public catalogue. Does not change existing A5 tables.
begin;
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  company text not null check (length(trim(company)) between 1 and 160),
  description text not null check (length(trim(description)) between 1 and 5000),
  location text not null check (length(trim(location)) between 1 and 160),
  category text not null,
  work_mode text not null check (work_mode in ('remote', 'hybrid', 'on-site')),
  skills text[] not null default '{}',
  allowance_thb integer check (allowance_thb >= 0),
  duration_weeks integer not null default 12 check (duration_weeks between 1 and 104),
  application_deadline date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  is_demo boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint placements_published_timestamp check (publication_status <> 'published' or published_at is not null)
);
create index placements_public_deadline_idx on public.placements(application_deadline, id)
  where publication_status = 'published' and status = 'open';
alter table public.placements enable row level security;
-- Default-deny RLS; access is only through the server's allowlisted read API.
revoke all on public.placements from public;
-- Supabase roles exist remotely; PGlite does not require them for local setup.
do $$ begin
  if exists(select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.placements from anon';
  end if;
  if exists(select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.placements from authenticated';
  end if;
end $$;
commit;
