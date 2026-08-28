# Training Log App — Build Plan

## The problem
You don't lack discipline, you lack a low-friction way back in after life gets busy. Nutrition slips first, training follows, and once you've missed a day it feels pointless to restart for "just one day." Existing trackers assume idealized daily consistency and punish gaps (streaks, guilt dashboards). This app is built for the opposite: real-life inconsistency.

## The core mechanic
**Three honest daily states, no ranking between them:**
- **Trained** — session done
- **Skipped** — didn't happen (optional reason tag: Busy / Not feeling it / Other)
- **Rest** — planned day off

No effort-grading, no streaks. The weekly view shows **"X / 7 marked"** instead of consecutive-day counts, so one bad week doesn't erase months of progress and one skipped day doesn't feel like game over.

**Why this works for you specifically:** it decouples "life got busy" from "I've failed," and the optional skip-reason data eventually lets the app notice patterns (e.g. a busy stretch) and proactively suggest lowering the bar rather than waiting for you to give up first.

## What's already done
- Mockup built and iterated: `training-log-mockup.html`
- Validated the three-tier system visually, fixed the "ranking" bug where Trained looked like the "good" option and Skipped/Rest looked lesser
- Weekly strip concept: equal-weight chalk-stroke marks, color-coded by state, no height hierarchy

## Explicit MVP scope (v1)
**In:**
- Daily check-in (Trained / Skipped / Rest + optional skip reason)
- Simple training log (exercise, sets, reps, weight) — only when Trained is selected
- Weekly view ("X / 7 marked", not streaks)
- Local persistence (survives refresh)

**Out (v2+):**
- Nutrition, supplements, hydration tracking
- Wearable/Garmin/Apple Watch sync
- Busy-week detection / adaptive plan suggestions
- Plan builder / editor UI

Cutting this hard is the point. A fully finished single-domain app beats five half-built ones on a CV.

## Tech stack
- **Frontend:** React (portfolio-relevant, matches your mockup's interaction model)
- **Data:** Local storage or Supabase/Firebase — don't build custom auth/infra for a portfolio piece
- **Deployment:** Vercel or Netlify — a live demo link matters more in interviews than a repo alone

## Build order
1. **Static UI** — port the mockup's check-in + weekly view into React components, no logic yet
2. **Wire up local state** — tapping a tier updates today's mark and the weekly count live
3. **Add persistence** — data survives a page refresh (localStorage first, real backend later if needed)
4. **Add the training log detail screen** — only surfaces when "Trained" is logged
5. **Polish last** — skip-reason chips, empty states, mobile responsiveness, micro-interactions

Resist adding busy-week detection or nutrition modules until this loop is solid and you're actually using it daily.

## CV/interview framing
Lead with the problem, not the feature list:
> "I kept writing training plans I never followed. I built this because most trackers assume perfect daily consistency, and I don't have that. The core mechanic treats a busy week and a failed week as different things."

Pair the live demo link + GitHub repo with that one-paragraph pitch. Specific personal problem + a deliberate design decision (no streaks, no ranked tiers) reads stronger than "I made a fitness app."

## Immediate next step
Scaffold the React project structure and port the mockup into working components with local state. Best done in Claude Code (desktop, terminal, or VS Code), not Cowork, since this is direct code authoring and iteration.
