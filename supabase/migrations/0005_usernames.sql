-- Usernames: add-by-username instead of add-by-email. Chosen once, right
-- after signing in (see src/components/UsernameSetup.jsx) — a friend's
-- identity shown throughout the app (requests, the friends list,
-- notifications) is now their username, a smaller thing to hand out than
-- an email address and the only thing you need to type to add them.
--
-- Replaces request_friend(email) outright rather than keeping it alongside
-- the new one — no existing accounts to preserve compatibility for yet.
--
-- Run once in the SQL Editor, after 0004_friend_visibility.sql.

-- ─── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

-- Only your own row is readable directly — someone else's username is only
-- ever resolved server-side, via request_friend_by_username or
-- list_friendships below, same pattern as auth.users being off-limits to
-- the client.
drop policy if exists "see your own profile" on public.profiles;
create policy "see your own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "set your own username" on public.profiles;
create policy "set your own username"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "change your own username" on public.profiles;
create policy "change your own username"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── request_friend_by_username(username) ──────────────────────────────
drop function if exists public.request_friend(text);

create or replace function public.request_friend_by_username(target_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select user_id into target_id
  from public.profiles
  where username = lower(trim(target_username));

  if target_id is null then
    raise exception 'No account found for that username';
  end if;
  if target_id = auth.uid() then
    raise exception 'You can not add yourself';
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), target_id)
  on conflict (requester_id, addressee_id) do nothing;
end;
$$;

revoke all on function public.request_friend_by_username(text) from public;
grant execute on function public.request_friend_by_username(text) to authenticated;

-- ─── list_friendships(): username instead of email ─────────────────────
-- Also fixes a bug from when in-app notifications were added: responded_at
-- was never in this function's return table, so the "friend accepted"
-- notification's date check silently always failed.
create or replace function public.list_friendships()
returns table (
  friendship_id uuid,
  friend_id uuid,
  friend_username text,
  status text,
  i_am_requester boolean,
  responded_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    f.id,
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
    p.username,
    f.status,
    f.requester_id = auth.uid(),
    f.responded_at,
    f.created_at
  from public.friendships f
  join public.profiles p
    on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.requester_id = auth.uid() or f.addressee_id = auth.uid();
$$;

revoke all on function public.list_friendships() from public;
grant execute on function public.list_friendships() to authenticated;
