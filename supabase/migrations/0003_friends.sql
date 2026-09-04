-- Friends: mutual, accepted-only connections that let one signed-in user
-- read a filtered slice of another's `days` — never a comparison, never a
-- count, just "look through what they've been training". Run once in the
-- SQL Editor, after 0001_init.sql and 0002_enable_realtime.sql.
--
-- What a friend can see (via get_friend_days, below): tier, session type,
-- exercises, and the freeform "what I did" text. What a friend can NEVER
-- see, by design: skip reasons, the short per-day note, or prefs/settings.
-- Those stay owner-only, same as before this migration.

-- ─── friendships ───────────────────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users on delete cascade,
  addressee_id uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_friend check (requester_id <> addressee_id),
  constraint unique_pair unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Either person in the friendship can see the row (to show it as
-- "pending, waiting on them" or "pending, respond to this").
drop policy if exists "see your own friendships" on public.friendships;
create policy "see your own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Only the addressee can change status (accept). Declining/cancelling/
-- unfriending is just a delete, allowed to either side.
drop policy if exists "addressee can respond" on public.friendships;
create policy "addressee can respond"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "either party can remove" on public.friendships;
create policy "either party can remove"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- No insert policy: rows are only ever created through request_friend()
-- below, since the client has no way to know another user's id, only
-- their email — and auth.users isn't queryable directly from the client.

-- ─── request_friend(email) ─────────────────────────────────────────────
-- Resolves an email to a user id (only possible here, as security definer,
-- since auth.users isn't exposed to clients) and creates a pending request.
create or replace function public.request_friend(friend_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = friend_email;
  if target_id is null then
    raise exception 'No account found for that email';
  end if;
  if target_id = auth.uid() then
    raise exception 'You can not add yourself';
  end if;
  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), target_id)
  on conflict (requester_id, addressee_id) do nothing;
end;
$$;

revoke all on function public.request_friend(text) from public;
grant execute on function public.request_friend(text) to authenticated;

-- ─── list_friendships() ────────────────────────────────────────────────
-- Your friendships (either direction), with the OTHER person's email
-- resolved — again only possible via security definer.
create or replace function public.list_friendships()
returns table (
  friendship_id uuid,
  friend_id uuid,
  friend_email text,
  status text,
  i_am_requester boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    f.id,
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
    u.email,
    f.status,
    f.requester_id = auth.uid(),
    f.created_at
  from public.friendships f
  join auth.users u
    on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.requester_id = auth.uid() or f.addressee_id = auth.uid();
$$;

revoke all on function public.list_friendships() from public;
grant execute on function public.list_friendships() to authenticated;

-- ─── get_friend_days(friend_id) ────────────────────────────────────────
-- The read-only view into a friend's training. Runs as security definer
-- so it can bypass the base `days` table's owner-only RLS, but the
-- friendship check and the column whitelist inside this function are
-- what actually gate and shape the access — reason/reasonText/note never
-- leave this function's body.
create or replace function public.get_friend_days(friend_id uuid)
returns table (
  date date,
  tier text,
  type text,
  exercises jsonb,
  freeform text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    d.date,
    d.data->>'tier',
    d.data->>'type',
    coalesce(d.data->'exercises', '[]'::jsonb),
    d.data->>'freeform',
    d.updated_at
  from public.days d
  where d.user_id = friend_id
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = friend_id)
          or (f.addressee_id = auth.uid() and f.requester_id = friend_id)
        )
    );
$$;

revoke all on function public.get_friend_days(uuid) from public;
grant execute on function public.get_friend_days(uuid) to authenticated;
