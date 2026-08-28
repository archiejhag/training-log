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

/** Today's key. */
export function todayKey() {
  return toKey(new Date());
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

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** "2026-08-28" -> "F" (single-letter weekday for the strip). */
export function dayLetter(key) {
  const [y, m, d] = key.split('-').map(Number);
  return LETTERS[new Date(y, m - 1, d).getDay()];
}

/** "2026-08-28" -> "Thursday" (used as the screen title). */
export function weekdayName(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
}
