import { useState } from 'react';

/* The "Friends" card in Settings. Renders nothing unless sync is
   configured and you're signed in — friends are meaningless without an
   account. Add someone by email; once they accept, "View log" opens their
   board read-only. No counts, no ranking, anywhere in this card. */

export default function FriendsPanel({ auth, friends, onViewFriend, viewError }) {
  const { syncAvailable, status: authStatus, user } = auth;
  const { friendships, error, addFriend, respond, remove } = friends;
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (!syncAvailable || authStatus !== 'in') return null;

  const incoming = friendships.filter((f) => f.status === 'pending' && !f.i_am_requester);
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.i_am_requester);
  const accepted = friendships.filter((f) => f.status === 'accepted');

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || trimmed === user?.email) return;
    setSending(true);
    try {
      await addFriend(trimmed);
      setEmail('');
    } catch {
      // error already surfaced via friends.error
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card">
      <h2>Friends</h2>
      <p className="sub">
        Add a friend by email to look through what they've been training.
        Just their board, the way you'd look at your own — no counts
        compared, no ranking.
      </p>

      <form className="sync-form" onSubmit={handleAdd}>
        <input
          className="sync-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="friend@example.com"
          aria-label="Friend's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="ghost-btn" disabled={!email.trim() || sending}>
          Add
        </button>
      </form>

      {incoming.length > 0 && (
        <div className="friend-group">
          <p className="friend-group-label">Requests</p>
          {incoming.map((f) => (
            <div className="friend-row" key={f.friendship_id}>
              <span className="friend-email">{f.friend_email}</span>
              <div className="friend-row-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => respond(f.friendship_id, true)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => respond(f.friendship_id, false)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="friend-group">
          <p className="friend-group-label">Waiting on them</p>
          {outgoing.map((f) => (
            <div className="friend-row" key={f.friendship_id}>
              <span className="friend-email">{f.friend_email}</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => remove(f.friendship_id)}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 ? (
        <div className="friend-group">
          <p className="friend-group-label">Friends</p>
          {accepted.map((f) => (
            <div className="friend-row" key={f.friendship_id}>
              <span className="friend-email">{f.friend_email}</span>
              <div className="friend-row-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => onViewFriend(f)}
                >
                  View log
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => remove(f.friendship_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        incoming.length === 0 &&
        outgoing.length === 0 && <p className="sub">No friends yet.</p>
      )}

      {(error || viewError) && (
        <p className="settings-msg is-err" role="status">
          {error || viewError}
        </p>
      )}
    </section>
  );
}
