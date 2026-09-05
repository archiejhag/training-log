# Training Log — where it goes next

A phased plan for evolving the app. This is a **sequence**, not a backlog: it
hardens the core loop before widening the surface, and it puts the feature that
actually makes the app different (the adaptive layer) after there's real data to
make it honest.

> A styled version of this roadmap lives here:
> <https://claude.ai/code/artifact/94b7d7fe-5a1e-41e1-bc69-27ce73f9325a>

Where the app is today: Phases 0 through 5 below are all shipped — the core
loop, the chalk visual identity, structured logging, the adaptive layer
(bar, busy-stretch detection, gaps-are-normal view), optional cloud sync via
Supabase with CI and a performance budget behind it, and Friends (add by
username, in-app notifications, visibility controls over what a friend can
see). **Phase 6** is what's left — mostly finishing the visual craft in
corners the faster-moving earlier phases didn't get to, not new product
surface.

---

## The line we don't cross

This is the design thesis. Every idea below is subordinate to it. If a feature
needs one of these to work, the feature is wrong.

- **No streaks.** No "7 days in a row". No consecutive-day count anywhere, ever.
- **No guilt notifications.** One opt-in, gentle daily reminder is the ceiling.
- **No effort grading.** "Only 20 minutes" is never judged or downweighted.
- **No comparison to other people.** No leaderboards, no percentiles.
- **The exercise log stays optional.** A drop in logging is information, not failure.

## How to judge a new idea

Run any feature — including the ones below — through these four:

1. Does it keep a **busy week** and a **failed week** visibly different?
2. Does it add **any friction** to the two-second daily mark?
3. Would it still make sense for someone who opens the app **once a week**?
4. Does it help you **restart**, or does it only measure?

Keep it if it passes 1, 3, 4 and fails 2. Anything that adds friction to the
daily mark goes elsewhere in the flow, or gets cut.

---

**Effort key:** `S` = an evening · `M` = a weekend · `L` = a few weekends.
Tags below are `[impact · effort]`.

## Phase 0 — Make the core loop unbreakable ✅ shipped

Everything after this assumes the daily mark and the weekly strip already work
without thinking, on the device you actually carry. Nothing new until this is true.

- **Edit past days from the strip** `[High · M]` — tap any day to set or change
  its mark. Today-only marking quietly contradicts "a missed day isn't game over".
- **"Catch up yesterday" prompt** `[High · S]` — on open, if yesterday is blank,
  one dismissible line with the three tier buttons inline. Offered once, then gone.
- **Real-device layout** `[High · S]` — drop the 420px phone frame on phones, go
  full-bleed, honour safe-area insets, bump tap targets.
- **Installable & offline (PWA)** `[Med · M]` — manifest, icon, service worker
  caching the shell. Add to home screen; works with no signal.
- **Accessibility pass** `[Med · S]` — tiers as a keyboard radiogroup,
  `aria-checked`, visible focus rings, `prefers-reduced-motion`.
- **Unit tests for the pure logic** `[Med · S]` — `weekKeys`, `dayLetter`, and the
  `useTrainingLog` reducer are pure functions. Vitest, one afternoon.
- **Deploy + live link** `[High · S]` — Netlify or Vercel; static host of the
  build output. A demo link beats a repo alone in an interview.
- **Export / import JSON** `[Low · S]` — own your data, and get the first Settings
  surface for free.

## Phase 1 — A visual identity people remember ✅ shipped

The weekly strip is the signature object. Make it unmistakably yours, and carry
that voice into every corner of the app.

- **Actual chalk strokes** `[High · M]` — SVG turbulence + displacement filter to
  roughen stroke edges, slight per-stroke rotation jitter, dust at the ends.
- **Draw-on & erase motion** `[Med · M]` — stroke grows from the baseline when you
  mark a day; eraser-swipe when you clear. Gated behind `prefers-reduced-motion`.
- **Board furniture** `[Med · M]` — a wooden tray with a chalk nub and an eraser;
  the eraser *is* the clear / undo control.
- **Colour that isn't hue-only** `[Med · S]` — give the three tiers a texture too
  (solid / dashed / dotted) so state survives colour-blindness and a dim screen.
- **A voice pass** `[High · S]` — write every empty state, first-launch screen, and
  long-gap message in the app's warm, non-judgmental register.
- **Monthly board view** `[Med · M]` — a term's worth of tiny strokes in a grid.
  Still no streak highlighting.
- **Optional "whiteboard" light theme** `[Low · S]` — the token structure already
  exists; invert it, expose a toggle in Settings.

## Phase 2 — Depth in the log, without weight ✅ shipped

Only once the daily mark is a genuine habit. Every item here is opt-in and
reversible — the log must never start to feel mandatory.

- **Recent-exercise autocomplete** `[High · S]` — suggest names you've typed
  before. Kills most of the keyboard time, which is most of the friction.
- **"Repeat last session"** `[High · S]` — one tap clones the previous Trained
  day's exercise list, ready to adjust.
- **Session-type tag** `[Med · S]` — one optional tap: Push / Pull / Legs / Cardio
  / Mobility. Cheap now, and the raw material Phase 3 needs.
- **Per-day note line** `[Med · S]` — one freeform line on any day, any tier
  ("tweaked knee", "travelling"). Works for Rest and Skipped too.
- **Progressive per-set detail** `[Low · M]` — default stays the single
  sets×reps×weight line; a "+ per-set" expands only on the days you care.
- **Freeform "what I did"** `[Med · S]` — a plain textarea as an alternative to
  structured rows. Some days you just type "8k run, felt good".

## Phase 3 — The adaptive layer ✅ shipped

This is what makes the app different from every streak tracker. It needs a few
weeks of real marks and skip-reasons to say anything true — which is why it comes
this late.

- **Set your bar** `[High · M]` — a weekly intention ("three sessions feels
  right"). The weekly view measures against *your* number, not 7.
- **Busy-stretch detection → lower the bar** `[High · M]` — when skips cluster, the
  app offers to drop the bar to 2 *before* you give up, not after. Always an offer.
- **Skip-reason patterns, surfaced gently** `[High · M]` — "Three 'Busy' skips in
  the last ten days. Weeks like this, two sessions is a win." Dismissible, never
  prescriptive. This is why the reason chips exist.
- **Re-entry acknowledgement** `[Med · S]` — after a gap, the next mark gets a
  quiet "Back in — that's the hard part."
- **"Gaps are normal" view** `[Med · M]` — a 30–90 day view framed as evidence
  that things dip and recover. Not a scoreboard.
- **Richer reason taxonomy** `[Low · S]` — add "Injured / unwell", "Unplanned
  rest", a custom option. Still one tap.

## Phase 4 — Platform & portfolio weight ✅ shipped

Last, because it's infrastructure, not product. Do it when this is an app you
actually open every day.

- **Supabase sync + auth, offline-first** `[Med · L]` — `localStorage` stays the
  cache; Supabase is the source of truth across devices. Good interview surface:
  row-level security, migrations, conflict handling.
- **Settings screen** `[Med · S]` — week-start day, weekly bar, theme, export,
  clear-all.
- **CI + a performance budget** `[Low · S]` — tests and lint on every push; a
  Lighthouse / PWA check that fails the build if the shell gets heavy.
- **Write the case study** `[High · S]` — the one-paragraph pitch, two screenshots,
  and the "no streaks, no ranked tiers" decision written up.

## Phase 5 — Friends, done properly ✅ shipped

Friends shipped as a first version outside this roadmap (added by email,
view-only, a friend currently sees every marked day's tier — Trained,
Skipped, or Rest — plus session type and exercises; never a reason or a
note). This phase hardened that: better ways to find people, control over
what they see, and less reliance on Settings as the only place anything
friend-related happens.

- **In-app notifications** `[Med · M]` ✅ shipped — friend requests,
  acceptances, and other prompts show up inside the app itself: inline
  cards on the home screen the moment they happen (via a Supabase
  Realtime subscription, no reload needed), plus dedicated Friends and
  Notifications tabs of their own — reachable by icon at all times, with
  an explicit "nothing yet" rather than staying hidden until there's
  something to show. A small unread count sits on the bell.
- **Friend visibility controls** `[High · S]` ✅ shipped — a toggle on the
  Friends screen for how much of your board a friend can see. Defaults to
  Trained and Rest days only; Skipped days are excluded from
  `get_friend_days` itself (not just hidden in the UI) unless you turn on
  "Include skipped". Reasons and notes stay excluded the same way,
  regardless.
- **Usernames, and add-by-username** `[Med · M]` ✅ shipped — signing in
  now gates the app on choosing a username (a `profiles` table, one row
  per account) before anything else, and a friend is added by that
  instead of their email. `request_friend_by_username` replaces the old
  email-based `request_friend` outright; requests, the friends list, and
  notifications all show a username now, not an email.

## Phase 6 — Aesthetic polish

Mostly finishing, not adding. Phases 2–4 moved fast and shipped real
functionality; a few corners have plainer styling than the weekly strip's
original chalk treatment got, or were only ever checked in one theme. Run
these through the same four questions as anything else — a visual change
that adds friction to the daily mark is still wrong.

- **Draw-on motion for the Month view** `[Med · M]` — the weekly strip's
  marks grow in and erase with real motion; Month view's marks currently
  just appear and disappear on tap. Same animation, same
  `prefers-reduced-motion` gate, extended to the grid.
- **Whiteboard-theme audit** `[Med · S]` — everything built after the light
  theme shipped (per-set detail, freeform mode, the sync panel, the newer
  Settings cards, the busy-stretch and skip-reason nudges, the term view)
  has mostly only been checked in the dark chalkboard theme. Go through
  each in whiteboard mode and fix whatever quietly assumed dark.
- **Fix the install splash flash for whiteboard users** `[Low · S]` — the
  PWA manifest's `background_color` / `theme_color` are hardcoded to the
  dark slate. Anyone whose saved preference is the light theme sees a
  flash of dark slate on launch before the page itself paints light.
  Decide on a real fix (or a deliberate, accepted trade-off) rather than
  leaving it as an oversight.
- **A view-transition beat** `[Low · S]` — Home, the log screen, and
  Settings currently cut instantly. A short, tasteful transition (still
  behind `prefers-reduced-motion`) would match the motion-craft already
  spent on the strip.
- **"Share your week" as a chalk-styled image** `[Med · M]` — render a
  week or month strip to a downloadable image, in the app's own visual
  language. Doubles as a nice feature and as ready-made portfolio /
  screenshot material.

### Also worth considering — functional, not aesthetic

Flagged because they're genuinely open, not because they belong in this
phase's theme:

- **Lazy-load the Supabase client** `[Med · M]` — noted back when cloud
  sync shipped and again when the CI performance budget was measured:
  `@supabase/supabase-js` alone accounts for most of the JS weight a
  purely local-only visit pays for. Splitting it into its own chunk,
  loaded only once sync is actually configured, is the real fix.
- **An opt-in daily reminder** `[Med · M]` — "the line we don't cross"
  above explicitly allows exactly one: a single, gentle, opt-in nudge.
  Never built. Needs a service-worker push subscription and a Settings
  toggle; still has to fail question 2 (no added friction to the mark
  itself) to be worth doing.

---

*Living document — reorder freely within a phase. The only fixed part is "the
line we don't cross".*
