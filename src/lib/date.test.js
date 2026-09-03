import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  toKey,
  parseKey,
  todayKey,
  yesterdayKey,
  weekKeys,
  weekKeysForOffset,
  weekdayIndex,
  dayLetter,
  weekdayName,
  weekRangeLabel,
  monthKeys,
  monthLabel,
} from './date';

// 2026-09-03 is a Thursday; the Mon–Sun week it sits in starts 2026-08-31.
const THURSDAY = '2026-09-03';

describe('toKey / parseKey', () => {
  test('toKey zero-pads month and day', () => {
    expect(toKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  test('parseKey returns a local-midnight Date', () => {
    const d = parseKey('2026-03-07');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(7);
    expect(d.getHours()).toBe(0);
  });

  test('parseKey then toKey round-trips', () => {
    expect(toKey(parseKey(THURSDAY))).toBe(THURSDAY);
  });
});

describe('todayKey / yesterdayKey (clock-relative)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('todayKey / yesterdayKey for a plain day', () => {
    vi.setSystemTime(new Date(2026, 8, 3, 12));
    expect(todayKey()).toBe('2026-09-03');
    expect(yesterdayKey()).toBe('2026-09-02');
  });

  test('yesterdayKey rolls back over a month boundary', () => {
    vi.setSystemTime(new Date(2026, 2, 1, 9)); // 1 Mar 2026, not a leap year
    expect(yesterdayKey()).toBe('2026-02-28');
  });

  test('yesterdayKey handles a leap day', () => {
    vi.setSystemTime(new Date(2024, 2, 1, 9)); // 1 Mar 2024, leap year
    expect(yesterdayKey()).toBe('2024-02-29');
  });

  test('yesterdayKey rolls back over a year boundary', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 9));
    expect(yesterdayKey()).toBe('2025-12-31');
  });
});

describe('weekKeys', () => {
  test('a Thursday lands in a Mon–Sun week', () => {
    expect(weekKeys(parseKey(THURSDAY))).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
  });

  test('Sunday belongs to the week that started six days earlier', () => {
    expect(weekKeys(parseKey('2026-09-06'))[0]).toBe('2026-08-31');
    expect(weekKeys(parseKey('2026-09-06'))[6]).toBe('2026-09-06');
  });

  test('Monday is index 0', () => {
    expect(weekKeys(parseKey('2026-08-31'))[0]).toBe('2026-08-31');
  });

  test('always returns 7 keys', () => {
    expect(weekKeys(parseKey(THURSDAY))).toHaveLength(7);
  });
});

describe('weekKeysForOffset (clock-relative)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('offset 0 is this week, -1 is the week before', () => {
    vi.setSystemTime(new Date(2026, 8, 3, 12));
    expect(weekKeysForOffset(0)[0]).toBe('2026-08-31');
    expect(weekKeysForOffset(-1)[0]).toBe('2026-08-24');
    expect(weekKeysForOffset(-1)[6]).toBe('2026-08-30');
  });
});

describe('weekdayIndex / dayLetter / weekdayName', () => {
  test('weekdayIndex: Monday 0 … Sunday 6', () => {
    expect(weekdayIndex('2026-08-31')).toBe(0); // Mon
    expect(weekdayIndex('2026-09-03')).toBe(3); // Thu
    expect(weekdayIndex('2026-09-06')).toBe(6); // Sun
  });

  test('dayLetter', () => {
    expect(dayLetter('2026-08-31')).toBe('M');
    expect(dayLetter('2026-09-03')).toBe('T'); // Thursday
    expect(dayLetter('2026-09-04')).toBe('F');
    expect(dayLetter('2026-09-06')).toBe('S');
  });

  test('weekdayName', () => {
    expect(weekdayName('2026-09-03')).toBe('Thursday');
    expect(weekdayName('2026-08-31')).toBe('Monday');
  });
});

describe('weekRangeLabel', () => {
  test('same month', () => {
    expect(weekRangeLabel('2026-09-01', '2026-09-07')).toBe('1–7 Sep');
  });

  test('spanning two months', () => {
    expect(weekRangeLabel('2026-08-31', '2026-09-06')).toBe('31 Aug – 6 Sep');
  });
});

describe('monthKeys / monthLabel (clock-relative)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('monthKeys returns every day of the target month', () => {
    vi.setSystemTime(new Date(2026, 8, 3, 12)); // September
    const sep = monthKeys(0);
    expect(sep).toHaveLength(30);
    expect(sep[0]).toBe('2026-09-01');
    expect(sep[29]).toBe('2026-09-30');
  });

  test('monthKeys(-1) crosses into the previous month', () => {
    vi.setSystemTime(new Date(2026, 8, 3, 12));
    const aug = monthKeys(-1);
    expect(aug).toHaveLength(31);
    expect(aug[0]).toBe('2026-08-01');
  });

  test('monthKeys handles February length (leap vs not)', () => {
    vi.setSystemTime(new Date(2024, 1, 15, 12));
    expect(monthKeys(0)).toHaveLength(29);
    vi.setSystemTime(new Date(2026, 1, 15, 12));
    expect(monthKeys(0)).toHaveLength(28);
  });

  test("monthKeys isn't thrown off by starting on the 31st", () => {
    vi.setSystemTime(new Date(2026, 9, 31, 12)); // 31 Oct
    expect(monthKeys(0)[0]).toBe('2026-10-01');
    expect(monthKeys(-1)[0]).toBe('2026-09-01'); // September, not a rollover mess
  });

  test('monthLabel: name only in the current year, name + year otherwise', () => {
    vi.setSystemTime(new Date(2026, 8, 3, 12));
    expect(monthLabel(0)).toBe('September');
    expect(monthLabel(-1)).toBe('August');
    expect(monthLabel(-9)).toBe('December 2025');
  });
});
