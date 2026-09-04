/* Read-only readings of the history. Pure functions: given the stored days
   and a bit of context, return what (if anything) the app should gently
   offer. No writes, no dates from `Date.now()` beyond an optional default —
   the caller passes `today` so this stays testable.

   busyStretch: the "lower the bar" offer. It fires DURING a rough patch —
   several Skipped days in the last fortnight while a bar of 3+ is running
   at half rate or worse — so the offer lands before you'd give up, not
   after. Always just an offer; the caller shows it as a dismissible card.

   reasonPattern: a gentle observation, no action attached. When one skip
   reason keeps coming up ("Busy", "Not feeling it"), name it once and
   reframe it. The caller suppresses it while busyStretch is showing so
   the two don't talk over each other. */

import { parseKey } from './date';

// Tuning knobs, all in one place.
const WINDOW_DAYS = 14; // how far back "lately" reaches
const MIN_SKIPS = 3; // Skipped days in the window that count as a cluster
const TARGET_BAR = 2; // the smaller bar we offer to switch to
const SNOOZE_DAYS = 14; // silence after the user dismisses or accepts

const REASON_MIN = 3; // same reason this many times ⇒ worth naming
// Only reasons we have something kind and specific to say about. A tie is
// broken by this order.
const PATTERN_REASONS = ['busy', 'notfeelingit'];

/** Whole days from bKey to aKey (aKey later ⇒ positive). Rounded so a DST
    change inside the span can't shift the count by a day. */
function daysBetween(aKey, bKey) {
  return Math.round((parseKey(aKey) - parseKey(bKey)) / 864e5);
}

/**
 * @param {Record<string, {tier?: string|null}>} days  the stored `days` map
 * @param {object} ctx
 * @param {number|null} ctx.bar          the current weekly bar (null = none)
 * @param {string} ctx.today             "YYYY-MM-DD" for "now"
 * @param {string} [ctx.dismissedAt]     "YYYY-MM-DD" the offer was last cleared
 * @returns {{offer: boolean, skips: number, trained: number, suggestedBar: number}}
 */
export function busyStretch(days, { bar, today, dismissedAt } = {}) {
  let skips = 0;
  let trained = 0;
  for (const [key, day] of Object.entries(days ?? {})) {
    const ago = daysBetween(today, key);
    if (ago < 0 || ago >= WINDOW_DAYS) continue;
    if (day.tier === 'skipped') skips += 1;
    else if (day.tier === 'trained') trained += 1;
  }

  const result = { offer: false, skips, trained, suggestedBar: TARGET_BAR };

  if (bar == null || bar <= TARGET_BAR) return result;
  if (skips < MIN_SKIPS) return result;
  // Trained days across the whole window are at or below one week's bar —
  // i.e. you're sustaining half your target rate or less.
  if (trained > bar) return result;
  if (dismissedAt && daysBetween(today, dismissedAt) < SNOOZE_DAYS) return result;

  result.offer = true;
  return result;
}

/**
 * Is one skip reason recurring enough to name?
 * @param {Record<string, {tier?: string|null, reason?: string|null}>} days
 * @param {object} ctx
 * @param {string} ctx.today          "YYYY-MM-DD" for "now"
 * @param {string} [ctx.dismissedAt]  "YYYY-MM-DD" this card was last cleared
 * @returns {{show: boolean, reason: string|null, count: number, windowDays: number}}
 */
export function reasonPattern(days, { today, dismissedAt } = {}) {
  const tally = Object.create(null);
  for (const [key, day] of Object.entries(days ?? {})) {
    if (day.tier !== 'skipped' || !PATTERN_REASONS.includes(day.reason)) continue;
    const ago = daysBetween(today, key);
    if (ago < 0 || ago >= WINDOW_DAYS) continue;
    tally[day.reason] = (tally[day.reason] ?? 0) + 1;
  }

  // Highest count, ties broken by PATTERN_REASONS order.
  let reason = null;
  let count = 0;
  for (const r of PATTERN_REASONS) {
    if ((tally[r] ?? 0) > count) {
      reason = r;
      count = tally[r];
    }
  }

  const result = { show: false, reason, count, windowDays: WINDOW_DAYS };
  if (count < REASON_MIN) return result;
  if (dismissedAt && daysBetween(today, dismissedAt) < SNOOZE_DAYS) return result;

  result.show = true;
  return result;
}
