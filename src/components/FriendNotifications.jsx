/* Friend activity, on the home screen — so none of it only lives inside
   Settings. Two kinds:

   - An incoming request: shown until you act on it (Accept/Decline), the
     same way CatchUp stays up until you mark yesterday. No separate
     dismiss — deciding *is* the resolution.
   - "They accepted": a one-time ping. Dismissing (or just going to look
     at their log) clears it via `friendAcceptedSeenAt`, so it doesn't
     linger once you've seen it.

   Reuses the same card language as CatchUp / BusyNudge. */

export default function FriendNotifications({
  friendships,
  friendAcceptedSeenAt,
  onRespond,
  onViewFriend,
  onDismissAccepted,
}) {
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

  if (incoming.length === 0 && newlyAccepted.length === 0) return null;

  return (
    <>
      {incoming.map((f) => (
        <section className="nudge" key={f.friendship_id} aria-label="Friend request">
          <p className="nudge-text">
            <b>{f.friend_email}</b> wants to be friends.
          </p>
          <div className="nudge-actions">
            <button
              type="button"
              className="nudge-accept"
              onClick={() => onRespond(f.friendship_id, true)}
            >
              Accept
            </button>
            <button
              type="button"
              className="nudge-later"
              onClick={() => onRespond(f.friendship_id, false)}
            >
              Decline
            </button>
          </div>
        </section>
      ))}

      {newlyAccepted.map((f) => (
        <section
          className="nudge"
          key={f.friendship_id}
          aria-label="Friend request accepted"
        >
          <button
            type="button"
            className="catch-up-dismiss"
            onClick={onDismissAccepted}
            aria-label="Dismiss"
          >
            &times;
          </button>
          <p className="nudge-text">
            <b>{f.friend_email}</b> accepted your friend request.
          </p>
          <div className="nudge-actions">
            <button
              type="button"
              className="nudge-accept"
              onClick={() => onViewFriend(f)}
            >
              View log
            </button>
          </div>
        </section>
      ))}
    </>
  );
}
