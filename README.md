# Training Log

A training habit-tracker built for real-life inconsistency — three honest daily
states, no streaks, no guilt dashboards.

**Live demo:** <https://training-log-roan.vercel.app> · **Roadmap:** [`docs/roadmap.md`](docs/roadmap.md)

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
`dist/`.

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
