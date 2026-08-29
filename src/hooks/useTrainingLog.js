import { useState, useEffect, useCallback } from 'react';

/* One custom hook owns the entire data layer: the in-memory state, the shape
   of the stored object, and reading/writing localStorage. Components never
   touch localStorage directly — they call these functions. If you later swap
   localStorage for Supabase, this file is the only one that changes.

   Stored shape:
     {
       days:  { "YYYY-MM-DD": { tier, reason, exercises } },
       prefs: { catchUpDismissedFor?, ... }   // app-wide settings, grows over time
     }
*/

const STORAGE_KEY = 'training-log/v1';

const EMPTY = { days: {}, prefs: {} };

/** The default record for a day nobody has marked yet. */
export function blankDay() {
  return { tier: null, reason: null, exercises: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    // Be defensive: a hand-edited or corrupted value shouldn't crash the app,
    // and data saved before `prefs` existed is still valid.
    if (parsed && typeof parsed === 'object' && parsed.days) {
      return { days: parsed.days, prefs: parsed.prefs ?? {} };
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

export function useTrainingLog() {
  // Passing the function (not load()) makes React call it once, on first render.
  const [data, setData] = useState(load);

  // Persist on every change. JSON.stringify of a tiny object is cheap.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full / disabled (private mode) — app keeps working in memory
    }
  }, [data]);

  const getDay = useCallback(
    (key) => data.days[key] ?? blankDay(),
    [data],
  );

  /* Every updater follows the same immutable pattern: build a brand-new
     object rather than mutating the old one, so React sees the change. */
  const patchDay = useCallback((key, patch) => {
    setData((prev) => {
      const current = prev.days[key] ?? blankDay();
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...current, ...patch } },
      };
    });
  }, []);

  const setTier = useCallback(
    (key, tier) => {
      // Toggle off if you tap the tier that's already selected.
      const current = data.days[key] ?? blankDay();
      const next = current.tier === tier ? null : tier;
      patchDay(key, {
        tier: next,
        // A reason only belongs to a "skipped" day.
        reason: next === 'skipped' ? current.reason : null,
      });
    },
    [data, patchDay],
  );

  const setReason = useCallback(
    (key, reason) => patchDay(key, { reason }),
    [patchDay],
  );

  const setExercises = useCallback(
    (key, exercises) => patchDay(key, { exercises }),
    [patchDay],
  );

  const setPref = useCallback((key, value) => {
    setData((prev) => ({
      ...prev,
      prefs: { ...prev.prefs, [key]: value },
    }));
  }, []);

  // Wholesale replace, for importing a backup. Normalises defensively —
  // the caller (Settings) has already shape-checked, this is a backstop.
  const replaceAll = useCallback((next) => {
    setData({
      days: (next && typeof next.days === 'object' && next.days) || {},
      prefs: (next && typeof next.prefs === 'object' && next.prefs) || {},
    });
  }, []);

  return {
    getDay,
    setTier,
    setReason,
    setExercises,
    prefs: data.prefs,
    setPref,
    allData: data,
    replaceAll,
  };
}
