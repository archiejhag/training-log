import { describe, test, expect } from 'vitest';
import { busyStretch, reasonPattern, isReEntry } from './insights';

const TODAY = '2026-09-15';

const keyForAgo = (ago) => {
  const d = new Date(2026, 8, 15); // local 2026-09-15
  d.setDate(d.getDate() - ago);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Build a `days` map: pass offsets-back-from-today and the tier for each.
function days(entries) {
  const out = {};
  for (const [ago, tier] of entries) out[keyForAgo(ago)] = { tier };
  return out;
}

// Build a `days` map of Skipped days with reasons: [ago, reason] pairs.
function reasonDays(entries) {
  const out = {};
  for (const [ago, reason] of entries) {
    out[keyForAgo(ago)] = { tier: 'skipped', reason };
  }
  return out;
}

const skipDays = (n, startAgo = 1) =>
  Array.from({ length: n }, (_, i) => [startAgo + i, 'skipped']);

const reasonRun = (n, reason, startAgo = 1) =>
  Array.from({ length: n }, (_, i) => [startAgo + i, reason]);

describe('busyStretch', () => {
  test('no bar set → never offers', () => {
    const r = busyStretch(days(skipDays(5)), { bar: null, today: TODAY });
    expect(r.offer).toBe(false);
    expect(r.skips).toBe(5);
  });

  test('bar already at or below the target → never offers', () => {
    expect(busyStretch(days(skipDays(5)), { bar: 2, today: TODAY }).offer).toBe(
      false,
    );
    expect(busyStretch(days(skipDays(5)), { bar: 1, today: TODAY }).offer).toBe(
      false,
    );
  });

  test('fewer than three skips in the window → no offer', () => {
    const r = busyStretch(days(skipDays(2)), { bar: 3, today: TODAY });
    expect(r).toMatchObject({ offer: false, skips: 2 });
  });

  test('three skips and trained running at/below the bar → offers bar of 2', () => {
    const r = busyStretch(
      days([...skipDays(3), [5, 'trained'], [9, 'trained']]),
      { bar: 3, today: TODAY },
    );
    expect(r).toMatchObject({ offer: true, skips: 3, trained: 2, suggestedBar: 2 });
  });

  test('enough skips but trained above the bar → no offer', () => {
    const r = busyStretch(
      days([...skipDays(3), ...Array.from({ length: 4 }, (_, i) => [i + 5, 'trained'])]),
      { bar: 3, today: TODAY },
    );
    expect(r).toMatchObject({ offer: false, trained: 4 });
  });

  test('skips older than the 14-day window are not counted', () => {
    // three skips, but 14/15/16 days ago — all outside
    const r = busyStretch(days(skipDays(3, 14)), { bar: 3, today: TODAY });
    expect(r).toMatchObject({ offer: false, skips: 0 });
  });

  test('a skip exactly 13 days ago still counts (inclusive edge)', () => {
    const r = busyStretch(days(skipDays(3, 11)), { bar: 3, today: TODAY });
    expect(r.skips).toBe(3);
    expect(r.offer).toBe(true);
  });

  test('dismissed within the snooze period → silent', () => {
    const base = days(skipDays(4));
    expect(
      busyStretch(base, { bar: 3, today: TODAY, dismissedAt: '2026-09-08' }).offer,
    ).toBe(false); // 7 days ago
  });

  test('dismissed longer ago than the snooze period → offers again', () => {
    const base = days(skipDays(4));
    expect(
      busyStretch(base, { bar: 3, today: TODAY, dismissedAt: '2026-08-30' }).offer,
    ).toBe(true); // 16 days ago
  });

  test('Rest days never count toward the cluster', () => {
    const r = busyStretch(
      days([[1, 'rest'], [2, 'rest'], [3, 'rest'], [4, 'skipped']]),
      { bar: 3, today: TODAY },
    );
    expect(r).toMatchObject({ offer: false, skips: 1 });
  });
});

describe('reasonPattern', () => {
  test('fewer than three of a reason → nothing to say', () => {
    const r = reasonPattern(reasonDays(reasonRun(2, 'busy')), { today: TODAY });
    expect(r).toMatchObject({ show: false, count: 2, reason: 'busy' });
  });

  test('three "Busy" skips in the window → surfaces it', () => {
    const r = reasonPattern(reasonDays(reasonRun(3, 'busy')), { today: TODAY });
    expect(r).toMatchObject({ show: true, reason: 'busy', count: 3 });
  });

  test('three "Not feeling it" skips → surfaces that reason', () => {
    const r = reasonPattern(reasonDays(reasonRun(4, 'notfeelingit')), {
      today: TODAY,
    });
    expect(r).toMatchObject({ show: true, reason: 'notfeelingit', count: 4 });
  });

  test('the more frequent reason wins', () => {
    const r = reasonPattern(
      reasonDays([...reasonRun(4, 'busy', 1), ...reasonRun(3, 'notfeelingit', 6)]),
      { today: TODAY },
    );
    expect(r).toMatchObject({ show: true, reason: 'busy', count: 4 });
  });

  test('a tie breaks toward "busy"', () => {
    const r = reasonPattern(
      reasonDays([...reasonRun(3, 'notfeelingit', 1), ...reasonRun(3, 'busy', 5)]),
      { today: TODAY },
    );
    expect(r).toMatchObject({ show: true, reason: 'busy', count: 3 });
  });

  test('"Other" and unspecified reasons are not patterns', () => {
    expect(
      reasonPattern(reasonDays(reasonRun(5, 'other')), { today: TODAY }),
    ).toMatchObject({ show: false, reason: null, count: 0 });
    expect(
      reasonPattern(reasonDays(reasonRun(5, null)), { today: TODAY }),
    ).toMatchObject({ show: false });
  });

  test('reasons older than the window are ignored', () => {
    const r = reasonPattern(reasonDays(reasonRun(3, 'busy', 14)), {
      today: TODAY,
    });
    expect(r).toMatchObject({ show: false, count: 0 });
  });

  test('a reason on a non-skipped day does not count', () => {
    const mixed = {
      ...reasonDays(reasonRun(2, 'busy')),
      [keyForAgo(4)]: { tier: 'trained', reason: 'busy' },
    };
    expect(reasonPattern(mixed, { today: TODAY }).count).toBe(2);
  });

  test('dismissed within the snooze period → silent', () => {
    const r = reasonPattern(reasonDays(reasonRun(4, 'busy')), {
      today: TODAY,
      dismissedAt: '2026-09-09', // 6 days ago
    });
    expect(r.show).toBe(false);
  });

  test('dismissed longer ago than the snooze period → surfaces again', () => {
    const r = reasonPattern(reasonDays(reasonRun(4, 'busy')), {
      today: TODAY,
      dismissedAt: '2026-08-30', // 16 days ago
    });
    expect(r.show).toBe(true);
  });
});

describe('isReEntry', () => {
  const at = (entries) => isReEntry(days(entries), { today: TODAY });

  test('today not marked → false', () => {
    expect(at([[8, 'trained']])).toBe(false);
  });

  test('first mark ever (nothing before today) → false', () => {
    expect(at([[0, 'trained']])).toBe(false);
  });

  test('last mark 8 days ago → true (inclusive edge)', () => {
    expect(at([[0, 'trained'], [8, 'trained']])).toBe(true);
  });

  test('last mark 7 days ago → false', () => {
    expect(at([[0, 'trained'], [7, 'trained']])).toBe(false);
  });

  test('last mark weeks ago → true', () => {
    expect(at([[0, 'skipped'], [23, 'trained']])).toBe(true);
  });

  test('marked yesterday → false', () => {
    expect(at([[0, 'trained'], [1, 'trained']])).toBe(false);
  });

  test('any tier counts as the prior mark, not just Trained', () => {
    expect(at([[0, 'trained'], [10, 'rest']])).toBe(true);
    expect(at([[0, 'trained'], [10, 'skipped']])).toBe(true);
  });

  test('blank days before today do not count as a prior mark', () => {
    expect(at([[0, 'trained'], [3, null], [5, null]])).toBe(false);
  });

  test('a recent mark inside the gap keeps it from being re-entry', () => {
    // back today, but also marked 4 days ago → not really "away"
    expect(at([[0, 'trained'], [4, 'trained'], [20, 'trained']])).toBe(false);
  });
});
