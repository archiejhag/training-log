/* Small date helpers. Everything is done in the browser's LOCAL time zone so
   "today" means the user's today, not UTC. Dates are stored as plain
   "YYYY-MM-DD" strings — sortable, comparable with ===, and human-readable
   when you peek at localStorage. */

/** A Date -> "YYYY-MM-DD" in local time. */
export function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-08-28" -> a local Date at midnight. `new Date("2026-08-28")` would
   parse as UTC and can land on the wrong day in western time zones, so we
   split the parts out by hand. */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today's key. */
export function todayKey() {
  return toKey(new Date());
}

/** Yesterday's key. setDate() handles month/year rollover for us. */
export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toKey(d);
}

/** The 7 keys Mon..Sun for the week that contains `ref` (default: now). */
export function weekKeys(ref = new Date()) {
  const start = new Date(ref);
  // JS getDay(): 0 = Sunday. Shift so 0 = Monday.
  const offsetToMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offsetToMonday);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toKey(d);
  });
}

/** The Mon..Sun keys for a week `n` weeks from this one (n < 0 = past). */
export function weekKeysForOffset(n) {
  const ref = new Date();
  ref.setDate(ref.getDate() + n * 7);
  return weekKeys(ref);
}

/** 0 = Monday .. 6 = Sunday, for lining a date up with a column in the strip. */
export function weekdayIndex(key) {
  return (parseKey(key).getDay() + 6) % 7;
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** "2026-08-28" -> "F" (single-letter weekday for the strip). */
export function dayLetter(key) {
  return LETTERS[parseKey(key).getDay()];
}

/** "2026-08-28" -> "Thursday" (used as the screen title). */
export function weekdayName(key) {
  return parseKey(key).toLocaleDateString('en-US', { weekday: 'long' });
}

/** Every day-key in the calendar month `n` months from this one (n < 0 = past). */
export function monthKeys(n) {
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + n);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => toKey(new Date(y, m, i + 1)));
}

/** "September" — or "September 2025" when it isn't the current year. */
export function monthLabel(n) {
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + n);
  const sameYear = ref.getFullYear() === new Date().getFullYear();
  return ref.toLocaleDateString(
    'en-US',
    sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' },
  );
}

/** ("2026-08-18", "2026-08-24") -> "18–24 Aug"  (or "28 Jul – 3 Aug"). */
export function weekRangeLabel(startKey, endKey) {
  const start = parseKey(startKey);
  const end = parseKey(endKey);
  const mon = (d) => d.toLocaleDateString('en-US', { month: 'short' });
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.getDate()} ${mon(end)}`
    : `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)}`;
}
