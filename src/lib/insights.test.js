import { describe, test, expect } from 'vitest';
import { busyStretch } from './insights';

const TODAY = '2026-09-15';

// Build a `days` map: pass offsets-back-from-today and the tier for each.
function days(entries) {
  const out = {};
  for (const [ago, tier] of entries) {
    const d = new Date(2026, 8, 15); // local 2026-09-15
    d.setDate(d.getDate() - ago);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out[key] = { tier };
  }
  return out;
}

const skipDays = (n, startAgo = 1) =>
  Array.from({ length: n }, (_, i) => [startAgo + i, 'skipped']);

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
