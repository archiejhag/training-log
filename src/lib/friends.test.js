import { describe, test, expect } from 'vitest';
import { shapeFriendDays } from './friends';

describe('shapeFriendDays', () => {
  test('turns rows into a date-keyed map', () => {
    const rows = [
      { date: '2026-09-01', tier: 'trained', type: 'push', exercises: [{ name: 'Bench' }], freeform: '', updated_at: '2026-09-01T10:00:00.000Z' },
      { date: '2026-09-02', tier: 'skipped', type: null, exercises: [], freeform: '', updated_at: '2026-09-02T10:00:00.000Z' },
    ];
    const days = shapeFriendDays(rows);
    expect(Object.keys(days)).toEqual(['2026-09-01', '2026-09-02']);
    expect(days['2026-09-01']).toEqual({
      tier: 'trained',
      type: 'push',
      exercises: [{ name: 'Bench' }],
      freeform: '',
      updatedAt: '2026-09-01T10:00:00.000Z',
    });
  });

  test('missing/null fields default sensibly, never throw', () => {
    const days = shapeFriendDays([{ date: '2026-09-03' }]);
    expect(days['2026-09-03']).toEqual({
      tier: null,
      type: null,
      exercises: [],
      freeform: '',
      updatedAt: null,
    });
  });

  test('empty or missing input gives an empty map', () => {
    expect(shapeFriendDays([])).toEqual({});
    expect(shapeFriendDays(null)).toEqual({});
    expect(shapeFriendDays(undefined)).toEqual({});
  });
});
