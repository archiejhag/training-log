# Supabase setup

Cloud sync is optional. With no keys set, Training Log runs entirely on
`localStorage` — no account, no network. These steps turn on cross-device
sync.

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**.
2. Name it `training-log`, pick a region near you, set a database password
   (you won't need it day-to-day — save it somewhere anyway).
3. Wait for it to finish provisioning (~2 min).

## 2. Create the schema

**SQL Editor** → paste the contents of
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
→ **Run**. It creates the `days` and `prefs` tables with row-level
security so each user only ever sees their own rows.

## 3. Enable email sign-in

**Authentication → Providers → Email**: make sure it's enabled. Leave
"Confirm email" on. No password — sign-in is a magic link *and* a numeric
code, sent in the same email.

**Authentication → URL Configuration**:

- **Site URL**: `https://training-log-roan.vercel.app`
- **Redirect URLs**: add both
  - `https://training-log-roan.vercel.app`
  - `http://localhost:5173`

**Authentication → Email Templates → Magic Link**: add `{{ .Token }}`
somewhere in the body (e.g. "Or enter this code: `{{ .Token }}`"). Without
this the email only contains the link, and the code field in Settings has
nothing to verify. The code matters more than it looks — see the note in
`useAuth.js`, but in short: a home-screen PWA on iOS has separate storage
from Safari, and the link always opens in Safari, so tapping it signs in
the *browser*, not the installed icon. Typing the code never leaves the
app, so it doesn't hit that problem.

## 4. Enable realtime (optional but recommended)

**SQL Editor** → paste the contents of
[`supabase/migrations/0002_enable_realtime.sql`](../supabase/migrations/0002_enable_realtime.sql)
→ **Run**. Without this, a second open device still syncs — it just waits
for its next refocus instead of updating within a second or two.

## 5. Friends (optional)

**SQL Editor** → paste the contents of
[`supabase/migrations/0003_friends.sql`](../supabase/migrations/0003_friends.sql)
→ **Run**, then do the same with
[`0004_friend_visibility.sql`](../supabase/migrations/0004_friend_visibility.sql)
and [`0005_usernames.sql`](../supabase/migrations/0005_usernames.sql), in
that order. Adds a `friendships` table, a `profiles` table (one row per
user: a unique username, chosen the first time you sign in), and the
functions that let a friend view your tier, session type, and exercises
read-only once you've both accepted — never your skip reasons, notes, or
prefs, and never a comparison or count. By default a friend only sees
Trained and Rest days; 0004 makes Skipped days private unless you turn on
"Include skipped" in the Friends screen. Friends are added by username
(0005), not email. Every friend request needs both people to already have
an account (steps 3–5 below, done once each). Skip all three migrations
entirely if you don't want the feature — the rest of the app doesn't
reference it.

## 6. Wire up the keys

**Project Settings → API Keys**. On newer projects this is the "Publishable
and secret" key system — copy:

- **Project URL** (Project Settings → General, or the API Keys page) →
  `VITE_SUPABASE_URL`
- **Publishable key** (`sb_publishable_...`) → `VITE_SUPABASE_ANON_KEY`

(Older projects instead show a plain **anon public** JWT under "Legacy anon,
service_role API keys" — that works the same way.) Never use the **Secret**
/ `service_role` key here; that one bypasses RLS and belongs server-side
only, which this app doesn't have.

Local: `cp .env.example .env.local` and paste them in. Restart `npm run dev`.

Vercel: **Project → Settings → Environment Variables**, add the same two
(all environments), then redeploy.

Both keys are safe in a client bundle — the publishable/anon key can only do
what RLS allows, which is "read and write your own rows once you're signed
in".

## 7. Your own email sender (recommended)

Supabase's built-in mailer is rate-limited to a handful of emails per hour —
fine for the first test, not for actually using the app. **Authentication →
SMTP Settings** → enable custom SMTP. [Resend](https://resend.com)'s free
tier works without verifying a domain, as long as you sign up for Resend
with the *same* email you'll sign into the app with (their sandbox only
delivers to the account owner's address until a domain is verified):

| Field | Value |
|---|---|
| Sender email | `onboarding@resend.dev` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *(a Resend API key)* |

## Conflict model

`localStorage` is the working copy: every read and write is local and
instant, online or off. When you're signed in, each change also upserts to
Supabase, and on load the two are merged **last-write-wins per day** using
a client `updatedAt` stamp. Prefs merge the same way on the whole object. A
realtime subscription (step 4) speeds up when a second device notices — the
merge logic itself doesn't depend on it.
