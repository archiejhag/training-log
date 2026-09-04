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
"Confirm email" on. No password — the app uses magic links.

**Authentication → URL Configuration**:

- **Site URL**: `https://training-log-roan.vercel.app`
- **Redirect URLs**: add both
  - `https://training-log-roan.vercel.app`
  - `http://localhost:5173`

## 4. Wire up the keys

**Project Settings → API**. Copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

Local: `cp .env.example .env.local` and paste them in. Restart `npm run dev`.

Vercel: **Project → Settings → Environment Variables**, add the same two
(all environments), then redeploy.

Both keys are safe in a client bundle — the anon key can only do what RLS
allows, which is "read and write your own rows once you're signed in".

## Conflict model

`localStorage` is the working copy: every read and write is local and
instant, online or off. When you're signed in, each change also upserts to
Supabase, and on load the two are merged **last-write-wins per day** using
a client `updatedAt` stamp. Prefs merge the same way on the whole object.
