import { supabase } from './supabase';

/* Thin wrappers over the friends-related Supabase RPCs (see
   supabase/migrations/0003_friends.sql). The actual access control and
   column filtering happen in Postgres, not here — this file just calls
   through and shapes the response into what the UI wants. */

export async function requestFriend(email) {
  const { error } = await supabase.rpc('request_friend', { friend_email: email });
  if (error) throw error;
}

export async function listFriendships() {
  const { data, error } = await supabase.rpc('list_friendships');
  if (error) throw error;
  return data ?? [];
}

export async function respondToRequest(friendshipId, accept) {
  if (accept) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) throw error;
  } else {
    await removeFriendship(friendshipId);
  }
}

export async function removeFriendship(friendshipId) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

/** Turn get_friend_days' rows into the same `{ "YYYY-MM-DD": day }` map
    shape the rest of the app already reads with getDay(). Pure — no
    network — so it's unit-tested on its own. */
export function shapeFriendDays(rows) {
  const days = {};
  for (const row of rows ?? []) {
    days[row.date] = {
      tier: row.tier ?? null,
      type: row.type ?? null,
      exercises: row.exercises ?? [],
      freeform: row.freeform ?? '',
      updatedAt: row.updated_at ?? null,
    };
  }
  return days;
}

export async function getFriendDays(friendId) {
  const { data, error } = await supabase.rpc('get_friend_days', { friend_id: friendId });
  if (error) throw error;
  return shapeFriendDays(data);
}

/** Split a friendships list into what's worth flagging: requests still
    waiting on you, and acceptances you haven't seen yet. Pure, so both the
    home-screen nudge and the full Notifications screen (and the icon's
    unread dot) read the same definition of "unread". */
export function friendNotifications(friendships, friendAcceptedSeenAt) {
  const incoming = friendships.filter(
    (f) => f.status === 'pending' && !f.i_am_requester,
  );
  const newlyAccepted = friendships.filter(
    (f) =>
      f.status === 'accepted' &&
      f.i_am_requester &&
      f.responded_at &&
      (!friendAcceptedSeenAt || f.responded_at > friendAcceptedSeenAt),
  );
  return { incoming, newlyAccepted };
}
