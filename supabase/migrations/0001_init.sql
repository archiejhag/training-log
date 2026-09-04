-- Training Log — initial schema
-- Run in the Supabase SQL editor (or `supabase db push` with the CLI).
--
-- Design: one row per user per calendar day, the day's record kept as a
-- jsonb blob (the client shape evolves; a blob avoids a migration per
-- field). Prefs are a single jsonb row per user. Conflicts are resolved
-- client-side, last-write-wins by `updated_at`.

-- ─── days ──────────────────────────────────────────────────────────────
create table if not exists public.days (
  user_id    uuid        not null references auth.users on delete cascade,
  date       date        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.days enable row level security;

drop policy if exists "days are private to their owner" on public.days;
create policy "days are private to their owner"
  on public.days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── prefs ─────────────────────────────────────────────────────────────
create table if not exists public.prefs (
  user_id    uuid        primary key references auth.users on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prefs enable row level security;

drop policy if exists "prefs are private to their owner" on public.prefs;
create policy "prefs are private to their owner"
  on public.prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
