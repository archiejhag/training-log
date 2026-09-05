import { useState } from 'react';

/* A one-time gate right after signing in: choose a username before doing
   anything else. Friends add each other by this, not by email, so it has
   to exist before Friends can be used at all — see useProfile's `needed`
   status, which App.jsx renders this in place of. */

export default function UsernameSetup({ profile, onSignOut }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profile.claim(name);
    } catch {
      // error already surfaced via profile.error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-screen">
      <p className="eyebrow">Training Log</p>
      <h1>Choose a username</h1>

      <section className="card">
        <p className="sub">
          This is how friends add you, instead of needing your email.
          Lowercase letters, numbers, and underscores only, 3-20 characters.
        </p>
        <form className="sync-form" onSubmit={handleSubmit}>
          <input
            className="sync-email"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="yourname"
            aria-label="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="ghost-btn" disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
        {profile.error && (
          <p className="settings-msg is-err" role="status">
            {profile.error}
          </p>
        )}
      </section>

      <button type="button" className="link-btn" onClick={onSignOut}>
        Sign out instead
      </button>
    </div>
  );
}
