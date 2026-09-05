import { useState } from 'react';

/* The "Friends" card. Renders nothing unless sync is configured and you're
   signed in — friends are meaningless without an account. Add someone by
   username; once they accept, "View log" opens their board read-only. No
   counts, no ranking, anywhere in this card. */

export default function FriendsPanel({
  auth,
  friends,
  onViewFriend,
  viewError,
  showSkipped,
  onShowSkippedChange,
}) {
  const { syncAvailable, status: authStatus } = auth;
  const { friendships, error, addFriend, respond, remove } = friends;
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);

  if (!syncAvailable || authStatus !== 'in') return null;

  const incoming = friendships.filter((f) => f.status === 'pending' && !f.i_am_requester);
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.i_am_requester);
  const accepted = friendships.filter((f) => f.status === 'accepted');

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await addFriend(trimmed);
      setUsername('');
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
        Add a friend by username to look through what they've been training.
      </p>

      <p className="friend-group-label">What friends can see</p>
      <div className="hist-toggle" role="group" aria-label="Skipped days visibility">
        <button
          type="button"
          className={!showSkipped ? 'is-on' : undefined}
          aria-pressed={!showSkipped}
          onClick={() => onShowSkippedChange(false)}
        >
          Trained &amp; rest only
        </button>
        <button
          type="button"
          className={showSkipped ? 'is-on' : undefined}
          aria-pressed={showSkipped}
          onClick={() => onShowSkippedChange(true)}
        >
          Include skipped
        </button>
      </div>
      <p className="sub sub-secondary">
        Trained and rest days always show. Reasons and notes stay private
        either way.
      </p>

      <form className="sync-form" onSubmit={handleAdd}>
        <input
          className="sync-email"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          placeholder="their username"
          aria-label="Friend's username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit" className="ghost-btn" disabled={!username.trim() || sending}>
          Add
        </button>
      </form>

      {incoming.length > 0 && (
        <div className="friend-group">
          <p className="friend-group-label">Requests</p>
          {incoming.map((f) => (
            <div className="friend-row" key={f.friendship_id}>
              <span className="friend-username">{f.friend_username}</span>
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
              <span className="friend-username">{f.friend_username}</span>
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
              <span className="friend-username">{f.friend_username}</span>
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
