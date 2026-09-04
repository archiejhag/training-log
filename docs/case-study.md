# Case study: Training Log

**Live app:** <https://training-log-roan.vercel.app>
**Source:** <https://github.com/archiejhag/training-log>

A habit-tracking web app, built solo end-to-end: designed, built, deployed,
and iterated across 46 commits. This write-up covers the technical stack and
the engineering decisions behind it — not the product features.

## Stack

- **JavaScript / React** — the app is a React 19 single-page app, built with
  Vite. No UI framework or component library — every screen, form, and
  animation is hand-built, styled with plain CSS using custom properties for
  theming (a dark and a light theme, switchable at runtime).
- **localStorage** — the app's original and still-primary data store. Every
  screen reads and writes through one custom hook; nothing else in the
  codebase touches storage directly. The app is fully usable offline, with
  zero backend, before any cloud service is configured.
- **Supabase** — added later as an *optional* layer on top of that
  local-first foundation: Postgres tables (with Row Level Security so each
  user only ever sees their own rows), passwordless authentication (a
  one-time email code, not magic-link-only — chosen after finding that
  magic links break when the app is installed as a home-screen PWA on iOS,
  since the link opens in a separate browser storage context to the
  installed app), and a Realtime subscription so a change on one device
  reaches another within about a second.
- **Vercel** — hosting and deployment. Connected directly to the GitHub
  repository: every push to `main` triggers an automatic production build
  and deploy, no manual release step.
- **GitHub** — version control for the whole project, with a full commit
  history documenting its evolution in phases (core loop, visual identity,
  structured logging, an adaptive "gaps are normal" layer, then cloud sync).
  Also hosts the CI pipeline (GitHub Actions): every push runs lint, a
  Vitest unit-test suite (110 tests), a production build, and a Lighthouse
  performance/accessibility budget, so a regression is caught automatically
  rather than found later in production.

## A few decisions worth calling out

**Local-first, cloud-second.** The data layer was built and fully working
on `localStorage` alone, long before Supabase entered the project. When
sync was added, no component changed — the one hook that owns storage
gained a parallel push/pull path, and everything above it kept working
exactly as before, online or off.

**Sync conflicts are resolved by a pure, unit-tested function**, not by
trusting whatever Supabase's client returns. Every record carries a
timestamp; a small module (`lib/sync.js`) compares local and remote copies
and decides which one wins, with no network calls inside it at all — so the
actual conflict-resolution logic is testable in complete isolation from
Supabase, timing, or connectivity.

**The performance budget is based on real measurements, not guesses.**
Before writing CI thresholds, the production build was profiled with
Lighthouse locally to get real numbers (script weight, total page weight,
accessibility score), and the budget was set with headroom above that
baseline — so it fails on an actual regression, not on normal
run-to-run noise.
