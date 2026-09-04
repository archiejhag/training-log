# Training Log

[![CI](https://github.com/archiejhag/training-log/actions/workflows/ci.yml/badge.svg)](https://github.com/archiejhag/training-log/actions/workflows/ci.yml)

A training habit-tracker built for real-life inconsistency — three honest daily
states, no streaks, no guilt dashboards.

**Live demo:** <https://training-log-roan.vercel.app> · **Roadmap:** [`docs/roadmap.md`](docs/roadmap.md) · **Case study:** [`docs/case-study.md`](docs/case-study.md)

## Why

Most trackers assume idealised daily consistency and punish gaps — streaks, guilt
dashboards, "you broke your run". Real life isn't like that: you get busy, you
miss a day, and restarting for "just one day" feels pointless. This app is built
for the opposite. The core mechanic treats **a busy week and a failed week as
different things.**

## The core mechanic

Three daily states, with **no ranking between them**:

| State | Meaning |
| --- | --- |
| **Trained** | Session done |
| **Skipped** | Didn't happen (optional reason: Busy / Not feeling it / Other) |
| **Rest** | Planned day off |

No effort grading, no streaks. The weekly view shows **"X / 7 marked"**, not
consecutive-day counts — so one bad week doesn't erase months, and one skipped
day isn't game over.

## Status

Working now:

- Daily check-in (Trained / Skipped / Rest) with optional skip reason
- Weekly view — seven equal chalk strokes, colour by state, "X / 7 marked"
- Optional training-log screen: log exercises (name / sets / reps / weight) only
  when Trained, nothing required, blank rows discarded on exit
- `localStorage` persistence (survives refresh)

Next up is in [`docs/roadmap.md`](docs/roadmap.md).

## Run it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` outputs static files to
`dist/`. `npm test` runs the Vitest suite (the date helpers, the
`useTrainingLog` reducer, and the `insights` readings).

### Sync (optional)

Leave it unconfigured and the app is local-only, exactly as described above.
To turn on cross-device sync via Supabase, follow
[`docs/supabase-setup.md`](docs/supabase-setup.md) — create a project, run
`supabase/migrations/0001_init.sql`, and set `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY`.

### CI & performance budget

Every push to `main` (and every PR) runs lint, the Vitest suite, a
production build, and a [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
pass against that build — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). The Lighthouse step
fails the build if the shipped JS/total weight grows past the ceilings in
[`.lighthouserc.cjs`](.lighthouserc.cjs), or if accessibility / best-practices
regress — that file explains where the numbers came from and how to
re-baseline them deliberately. Run the whole thing locally with:

```bash
npm run ci
```

## Stack

React 19 + Vite. No backend — data lives in `localStorage`. All persistence is
behind one hook (`src/hooks/useTrainingLog.js`); all date logic in
`src/lib/date.js`.

## Layout

```
src/
  App.jsx                    view switch + wiring
  hooks/useTrainingLog.js    the only file that touches localStorage
  lib/date.js                local-time date helpers
  components/
    CheckIn.jsx              "Mark today" card
    WeeklyView.jsx           the weekly strip
    TrainingLog.jsx          optional exercise-log screen
    ExerciseRow.jsx          one exercise
docs/
  build-plan.md              original build plan
  roadmap.md                 what comes next
  mockups/                   design mockups
```
