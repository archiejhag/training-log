-- Friend visibility controls: default what a friend can see to Trained and
-- Rest days only. A Skipped day now stays private unless the owner opts in
-- via the `friendShowSkipped` pref (a normal synced pref, same as theme or
-- weekStart — see src/lib/friends.js / FriendsPanel.jsx for the client side).
-- Reasons and notes were already excluded and still are.
--
-- Run once in the SQL Editor, after 0003_friends.sql.

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
    )
    and (
      d.data->>'tier' is distinct from 'skipped'
      or coalesce(
           (select (p.data->>'friendShowSkipped')::boolean
            from public.prefs p
            where p.user_id = friend_id),
           false
         )
    );
$$;

revoke all on function public.get_friend_days(uuid) from public;
grant execute on function public.get_friend_days(uuid) to authenticated;
