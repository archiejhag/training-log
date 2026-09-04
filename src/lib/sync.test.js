import { describe, test, expect } from 'vitest';
import { mergeDays, mergePrefs } from './sync';

const day = (updatedAt, extra = {}) => ({ tier: 'trained', updatedAt, ...extra });

describe('mergeDays', () => {
  test('a day that only exists locally is pushed, not overwritten', () => {
    const { merged, toPush } = mergeDays({ a: day('2026-09-01T10:00:00.000Z') }, {});
    expect(merged.a.updatedAt).toBe('2026-09-01T10:00:00.000Z');
    expect(toPush).toEqual(['a']);
  });

  test('a day that only exists remotely is pulled in', () => {
    const { merged, toPush } = mergeDays({}, { a: day('2026-09-01T10:00:00.000Z') });
    expect(merged.a.updatedAt).toBe('2026-09-01T10:00:00.000Z');
    expect(toPush).toEqual([]);
  });

  test('newer local wins and is queued to push', () => {
    const local = { a: day('2026-09-02T10:00:00.000Z', { note: 'new' }) };
    const remote = { a: day('2026-09-01T10:00:00.000Z', { note: 'old' }) };
    const { merged, toPush } = mergeDays(local, remote);
    expect(merged.a.note).toBe('new');
    expect(toPush).toEqual(['a']);
  });

  test('newer remote wins and is not re-pushed', () => {
    const local = { a: day('2026-09-01T10:00:00.000Z', { note: 'old' }) };
    const remote = { a: day('2026-09-02T10:00:00.000Z', { note: 'new' }) };
    const { merged, toPush } = mergeDays(local, remote);
    expect(merged.a.note).toBe('new');
    expect(toPush).toEqual([]);
  });

  test('identical timestamps are left alone (no push, no overwrite)', () => {
    const same = '2026-09-01T10:00:00.000Z';
    const local = { a: day(same, { note: 'local copy' }) };
    const remote = { a: day(same, { note: 'remote copy' }) };
    const { merged, toPush } = mergeDays(local, remote);
    expect(merged.a.note).toBe('local copy');
    expect(toPush).toEqual([]);
  });

  test('a local day with no updatedAt (pre-sync data) loses to any dated remote', () => {
    const local = { a: { tier: 'trained' } };
    const remote = { a: day('2026-09-01T10:00:00.000Z') };
    const { merged, toPush } = mergeDays(local, remote);
    expect(merged.a.updatedAt).toBe('2026-09-01T10:00:00.000Z');
    expect(toPush).toEqual([]);
  });

  test('multiple days are handled independently', () => {
    const local = {
      a: day('2026-09-03T00:00:00.000Z'), // newer, push
      b: day('2026-09-01T00:00:00.000Z'), // older, pull
    };
    const remote = {
      a: day('2026-09-02T00:00:00.000Z'),
      b: day('2026-09-04T00:00:00.000Z'),
      c: day('2026-09-05T00:00:00.000Z'), // only remote
    };
    const { merged, toPush } = mergeDays(local, remote);
    expect(toPush).toEqual(['a']);
    expect(merged.a.updatedAt).toBe('2026-09-03T00:00:00.000Z');
    expect(merged.b.updatedAt).toBe('2026-09-04T00:00:00.000Z');
    expect(merged.c.updatedAt).toBe('2026-09-05T00:00:00.000Z');
  });

  test('empty on both sides', () => {
    expect(mergeDays({}, {})).toEqual({ merged: {}, toPush: [] });
  });
});

describe('mergePrefs', () => {
  test('no remote prefs → keep local, push it', () => {
    const local = { theme: 'light', updatedAt: '2026-09-01T00:00:00.000Z' };
    expect(mergePrefs(local, null)).toEqual({ merged: local, push: true });
  });

  test('no local prefs → take remote, no push', () => {
    const remote = { theme: 'dark', updatedAt: '2026-09-01T00:00:00.000Z' };
    expect(mergePrefs(null, remote)).toEqual({ merged: remote, push: false });
  });

  test('newer local wins and is pushed', () => {
    const local = { theme: 'light', updatedAt: '2026-09-02T00:00:00.000Z' };
    const remote = { theme: 'dark', updatedAt: '2026-09-01T00:00:00.000Z' };
    expect(mergePrefs(local, remote)).toEqual({ merged: local, push: true });
  });

  test('newer remote wins, no push', () => {
    const local = { theme: 'light', updatedAt: '2026-09-01T00:00:00.000Z' };
    const remote = { theme: 'dark', updatedAt: '2026-09-02T00:00:00.000Z' };
    expect(mergePrefs(local, remote)).toEqual({ merged: remote, push: false });
  });

  test('identical timestamps: keep local, no push', () => {
    const same = '2026-09-01T00:00:00.000Z';
    const local = { theme: 'light', updatedAt: same };
    const remote = { theme: 'dark', updatedAt: same };
    expect(mergePrefs(local, remote)).toEqual({ merged: local, push: false });
  });
});
