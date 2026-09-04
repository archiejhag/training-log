import { useState } from 'react';

/* The "Sync across devices" card in Settings. Renders nothing unless this
   build has Supabase keys. Sign-in sends one email with two ways in: a
   magic link, and a numeric code — the code matters on a home-screen PWA,
   where the link opens in a different storage context (Safari) than the
   installed icon, so tapping it doesn't actually sign the icon in. Once
   signed in, this also shows the sync engine's own status (useSync) —
   synced / syncing / an error worth knowing about. */

const SYNC_LABEL = {
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
};

export default function SyncPanel({ auth, sync }) {
  const {
    syncAvailable,
    user,
    status: authStatus,
    error: authError,
    signIn,
    verifyCode,
    signOut,
  } = auth;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  if (!syncAvailable) return null;

  return (
    <section className="card">
      <h2>Sync across devices</h2>

      {authStatus === 'in' ? (
        <>
          <p className="sub">
            Signed in as <b>{user?.email}</b>. Your days and settings sync to
            every device you sign in on.
          </p>
          {sync && SYNC_LABEL[sync.status] && (
            <p
              className={'sync-status' + (sync.status === 'error' ? ' is-err' : '')}
              role="status"
            >
              {SYNC_LABEL[sync.status]}
              {sync.status === 'error' && sync.error ? ` — ${sync.error}` : ''}
            </p>
          )}
          <div className="settings-actions">
            <button type="button" className="ghost-btn" onClick={signOut}>
              Sign out
            </button>
          </div>
          <p className="footnote" style={{ textAlign: 'left', margin: '10px 0 0' }}>
            Signing out leaves this device's copy untouched — it just stops
            syncing.
          </p>
        </>
      ) : authStatus === 'sent' ? (
        <>
          <p className="sub">
            Check your inbox for a message to <b>{email}</b> — tap the link,
            or type the code from the same email below. On a
            home-screen icon, the code is the reliable one: the link opens in
            your browser, which isn't the same signed-in app as the icon.
          </p>
          <form
            className="sync-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) verifyCode(email, code);
            }}
          >
            <input
              className="sync-email"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="code from email"
              aria-label="Code from the email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit" className="ghost-btn" disabled={!code.trim()}>
              Verify
            </button>
          </form>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setEmail('');
              setCode('');
            }}
          >
            Use a different email
          </button>
        </>
      ) : (
        <>
          <p className="sub">
            Optional. Keep your log on localStorage only, or sign in with an
            email link to sync it across devices. No password.
          </p>
          <form
            className="sync-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) signIn(email);
            }}
          >
            <input
              className="sync-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-label="Email for the sign-in link"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="ghost-btn"
              disabled={!email.trim() || authStatus === 'loading'}
            >
              Send link
            </button>
          </form>
        </>
      )}

      {authError && (
        <p className="settings-msg is-err" role="status">
          {authError}
        </p>
      )}
    </section>
  );
}
