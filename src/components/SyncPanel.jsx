import { useState } from 'react';

/* The "Sync across devices" card in Settings. Renders nothing unless this
   build has Supabase keys. Sign-in is a magic link — one email field, no
   password. */

export default function SyncPanel({ auth }) {
  const { syncAvailable, user, status, error, signIn, signOut } = auth;
  const [email, setEmail] = useState('');

  if (!syncAvailable) return null;

  return (
    <section className="card">
      <h2>Sync across devices</h2>

      {status === 'in' ? (
        <>
          <p className="sub">
            Signed in as <b>{user?.email}</b>. Your days and settings sync to
            every device you sign in on.
          </p>
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
      ) : status === 'sent' ? (
        <>
          <p className="sub">
            Check your inbox — a sign-in link is on its way to <b>{email}</b>.
            Open it on any device to sync there.
          </p>
          <button
            type="button"
            className="link-btn"
            onClick={() => setEmail('')}
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
              disabled={!email.trim() || status === 'loading'}
            >
              Send link
            </button>
          </form>
        </>
      )}

      {error && (
        <p className="settings-msg is-err" role="status">
          {error}
        </p>
      )}
    </section>
  );
}
