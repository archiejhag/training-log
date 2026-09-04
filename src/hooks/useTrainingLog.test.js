import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainingLog, blankDay } from './useTrainingLog';

const STORAGE_KEY = 'training-log/v1';
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

beforeEach(() => localStorage.clear());

describe('load / initial state', () => {
  test('a fresh install has empty days and prefs', () => {
    const { result } = renderHook(() => useTrainingLog());
    expect(result.current.getDay('2026-09-03')).toEqual(blankDay());
    expect(result.current.prefs).toEqual({});
  });

  test('data saved before `prefs` existed still loads', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ days: { '2026-09-01': { tier: 'trained', reason: null, exercises: [] } } }),
    );
    const { result } = renderHook(() => useTrainingLog());
    expect(result.current.getDay('2026-09-01').tier).toBe('trained');
    expect(result.current.prefs).toEqual({});
  });

  test('invalid JSON falls back to empty', () => {
    localStorage.setItem(STORAGE_KEY, 'not json {{');
    const { result } = renderHook(() => useTrainingLog());
    expect(result.current.getDay('x')).toEqual(blankDay());
  });

  test('a value of the wrong shape falls back to empty', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: 1 }));
    const { result } = renderHook(() => useTrainingLog());
    expect(result.current.getDay('x')).toEqual(blankDay());
  });
});

describe('setTier', () => {
  test('marks a day, and tapping the same tier again clears it', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'trained'));
    expect(result.current.getDay('d').tier).toBe('trained');
    act(() => result.current.setTier('d', 'trained'));
    expect(result.current.getDay('d').tier).toBe(null);
  });

  test('setTier(key, null) clears — the eraser path', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'rest'));
    act(() => result.current.setTier('d', null));
    expect(result.current.getDay('d').tier).toBe(null);
  });

  test('leaving "skipped" drops the reason', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'skipped'));
    act(() => result.current.setReason('d', 'busy'));
    expect(result.current.getDay('d').reason).toBe('busy');
    act(() => result.current.setTier('d', 'trained'));
    expect(result.current.getDay('d').reason).toBe(null);
  });

  test('exercises survive a tier change', () => {
    const { result } = renderHook(() => useTrainingLog());
    const ex = [{ id: '1', name: 'Squat', sets: '5', reps: '5', weight: '80' }];
    act(() => result.current.setTier('d', 'trained'));
    act(() => result.current.setExercises('d', ex));
    act(() => result.current.setTier('d', 'skipped'));
    expect(result.current.getDay('d').exercises).toEqual(ex);
  });

  test('the free-text reason is dropped when a day stops being skipped', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'skipped'));
    act(() => result.current.setReason('d', 'other'));
    act(() => result.current.setReasonText('d', 'shoulder flared up'));
    expect(result.current.getDay('d').reasonText).toBe('shoulder flared up');
    act(() => result.current.setTier('d', 'rest'));
    expect(result.current.getDay('d').reasonText).toBe('');
  });

  test('every patch stamps updatedAt, for cloud sync to compare against', () => {
    const { result } = renderHook(() => useTrainingLog());
    expect(result.current.getDay('d').updatedAt).toBeUndefined();
    act(() => result.current.setTier('d', 'trained'));
    expect(typeof result.current.getDay('d').updatedAt).toBe('string');
  });

  test('the session type is dropped when a day stops being trained', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'trained'));
    act(() => result.current.setType('d', 'push'));
    expect(result.current.getDay('d').type).toBe('push');
    act(() => result.current.setTier('d', 'rest'));
    expect(result.current.getDay('d').type).toBe(null);
  });

  test('marking one day leaves another alone', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('a', 'trained'));
    act(() => result.current.setTier('b', 'skipped'));
    expect(result.current.getDay('a').tier).toBe('trained');
    expect(result.current.getDay('b').tier).toBe('skipped');
  });
});

describe('setType', () => {
  test('sets and toggles the session type', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'trained'));
    act(() => result.current.setType('d', 'pull'));
    expect(result.current.getDay('d').type).toBe('pull');
    act(() => result.current.setType('d', null));
    expect(result.current.getDay('d').type).toBe(null);
  });
});

describe('setReason / setReasonText', () => {
  test('picking a preset reason clears any free text', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'skipped'));
    act(() => result.current.setReason('d', 'other'));
    act(() => result.current.setReasonText('d', 'car broke down'));
    act(() => result.current.setReason('d', 'busy'));
    expect(result.current.getDay('d').reason).toBe('busy');
    expect(result.current.getDay('d').reasonText).toBe('');
  });

  test('free text stays while "other" stays the pick', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('d', 'skipped'));
    act(() => result.current.setReason('d', 'other'));
    act(() => result.current.setReasonText('d', 'moving house'));
    act(() => result.current.setReason('d', 'other'));
    expect(result.current.getDay('d').reasonText).toBe('moving house');
  });
});

describe('setNote', () => {
  test('sets a note and it survives a tier change', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setNote('d', 'tweaked knee'));
    expect(result.current.getDay('d').note).toBe('tweaked knee');
    act(() => result.current.setTier('d', 'rest'));
    expect(result.current.getDay('d').note).toBe('tweaked knee');
    act(() => result.current.setTier('d', 'trained'));
    expect(result.current.getDay('d').note).toBe('tweaked knee');
  });
});

describe('setFreeform', () => {
  test('sets the freeform block and it survives a tier change', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setFreeform('d', '8k run, felt good'));
    expect(result.current.getDay('d').freeform).toBe('8k run, felt good');
    act(() => result.current.setTier('d', 'trained'));
    expect(result.current.getDay('d').freeform).toBe('8k run, felt good');
    act(() => result.current.setTier('d', null));
    expect(result.current.getDay('d').freeform).toBe('8k run, felt good');
  });
});

describe('setPref', () => {
  test('merges rather than replacing', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setPref('theme', 'light'));
    act(() => result.current.setPref('catchUpDismissedFor', '2026-09-02'));
    expect(result.current.prefs).toMatchObject({
      theme: 'light',
      catchUpDismissedFor: '2026-09-02',
    });
  });

  test('stamps updatedAt for cloud sync to compare against', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setPref('theme', 'light'));
    expect(typeof result.current.prefs.updatedAt).toBe('string');
  });
});

describe('replaceAll (import)', () => {
  test('swaps the whole store', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('old', 'trained'));
    act(() =>
      result.current.replaceAll({
        days: { new: { tier: 'rest', reason: null, exercises: [] } },
        prefs: { theme: 'light' },
      }),
    );
    expect(result.current.getDay('old').tier).toBe(null);
    expect(result.current.getDay('new').tier).toBe('rest');
    expect(result.current.prefs).toEqual({ theme: 'light' });
  });

  test('normalises a missing prefs to {}', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.replaceAll({ days: {} }));
    expect(result.current.prefs).toEqual({});
  });

  test('a null / junk payload becomes an empty store, not a crash', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('a', 'trained'));
    act(() => result.current.replaceAll(null));
    expect(result.current.getDay('a')).toEqual(blankDay());
    expect(result.current.prefs).toEqual({});
  });
});

describe('persistence', () => {
  test('writes through to localStorage on every change', () => {
    const { result } = renderHook(() => useTrainingLog());
    act(() => result.current.setTier('2026-09-03', 'trained'));
    expect(stored().days['2026-09-03'].tier).toBe('trained');
    act(() => result.current.setPref('theme', 'light'));
    expect(stored().prefs.theme).toBe('light');
  });
});
