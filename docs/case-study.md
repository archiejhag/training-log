# Case study: Training Log

**Live app:** <https://training-log-roan.vercel.app>
**Source:** <https://github.com/archiejhag/training-log>

I built Training Log by myself — it's a habit-tracking app for the gym. I
designed it, built it, deployed it, and kept improving it over 46 commits.
This page is about how I built it, not what it does — the tools I used and
why I picked them.

## What I actually used

- **JavaScript / React** — the app is a React app, built with a tool called
  Vite (it's what turns my code into an actual website). I didn't use any
  UI library or template — every button, form, and animation on the page is
  something I built myself, styled with plain CSS.
- **localStorage** — this is a way for a website to save data directly in
  your browser, no server needed. It's how the app worked at first, and
  it's still the main way it works — everything you type gets saved
  straight to your device, so the app works even with no internet
  connection at all.
- **Supabase** — I added this later, once the local version was working
  properly. It gave the app a real database (Postgres) and a way to log
  in, so your data can follow you between your phone and your laptop
  instead of being stuck on one device. Logging in is just a code sent to
  your email — no password to remember. It also updates instantly across
  devices, so if you mark today as done on your phone, it shows up on your
  laptop within about a second.
- **Vercel** — this is what actually puts the app online. It's connected
  straight to my GitHub repo, so every time I push new code, the live site
  updates itself automatically — I never have to manually upload anything.
- **GitHub** — this is where all my code lives and where I track every
  change I make, going back to my very first commit. It also runs my
  automated checks (tests, code-quality checks, and a performance check)
  every time I push, so I find out straight away if something's broken
  instead of finding out later.

## A few things I'm proud of

**I built it to work offline first, then added the cloud stuff on top.**
The app was fully working just using the browser's own storage before
Supabase was ever part of it. When I added the online sync, I didn't have
to rewrite anything — I just added a new layer underneath that pushes and
pulls data in the background, and everything else kept working exactly the
same, whether you're online or not.

**I wrote real tests for the trickiest part: what happens when two devices
disagree.** If you edit the app on your phone and your laptop at roughly
the same time, something has to decide which change wins. I wrote that
logic as its own small, separate function and covered it with unit tests,
so I can prove it works correctly without needing an internet connection
or an actual second device to test it.

**I checked real numbers before setting my performance rules, instead of
guessing.** Before I set up automatic checks for page speed, I actually
ran the tests myself first to see what normal numbers looked like. Then I
set my limits a bit above that, so the checks only fail if something
genuinely gets slower — not just because of normal small variations.
