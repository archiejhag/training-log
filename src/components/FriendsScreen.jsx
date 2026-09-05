import FriendsPanel from './FriendsPanel';

/* The Friends tab: its own screen, reachable directly from the home icon
   instead of only being buried a level down in Settings. FriendsPanel does
   all the actual work (add by email, requests, the friends list); this is
   just the screen shell plus a sign-in nudge for when there's no account
   to attach friends to yet. */

export default function FriendsScreen({ auth, friends, onViewFriend, friendViewError, onBack }) {
  const { syncAvailable, status: authStatus } = auth;
  const signedIn = syncAvailable && authStatus === 'in';

  return (
    <div className="settings-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        &larr; Back
      </button>

      <p className="eyebrow">Training Log</p>
      <h1>Friends</h1>

      {signedIn ? (
        <FriendsPanel
          auth={auth}
          friends={friends}
          onViewFriend={onViewFriend}
          viewError={friendViewError}
        />
      ) : (
        <p className="sub">Sign in under Settings to add friends and look through what they've been training.</p>
      )}
    </div>
  );
}
