import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mergeDays, mergePrefs } from '../lib/sync';

/* The sync engine. localStorage (via useTrainingLog) is always the working
   copy — every read and write happens there first, online or off. This hook
   layers Supabase on top, only while signed in:

   1. On sign-in (and each time the tab regains focus), pull the remote
      `days` + `prefs`, merge with whatever's local (lib/sync.js,
      last-write-wins by `updatedAt`), write the merged result back locally,
      then push anything that came out newer-locally.
   2. After that first merge, every local change is pushed to Supabase,
      debounced so a burst of edits (typing in a textarea) becomes one
      request, not one per keystroke.
   3. A Realtime subscription on `days`/`prefs` means a change from another
      device arrives within about half a second, not at the next refocus —
      any event on either table just triggers the same pull-and-merge.
   4. If a push fails (offline), nothing is lost — the unsynced day just
      keeps a newer `updatedAt` than what's in Supabase, so the very next
      successful pull-and-merge (reconnect, reopen, refocus, a realtime
      event) finds it and pushes it then. There's no separate queue to
      lose track of.

   Returns `{ status, error }` purely for a status line in Settings. */

const DEBOUNCE_MS = 800;
const REALTIME_DEBOUNCE_MS = 500;
const REFOCUS_THROTTLE_MS = 30_000;

async function fetchRemote(userId) {
  const [daysRes, prefsRes] = await Promise.all([
    supabase.from('days').select('date, data').eq('user_id', userId),
    supabase.from('prefs').select('data').eq('user_id', userId).maybeSingle(),
  ]);
  if (daysRes.error) throw daysRes.error;
  if (prefsRes.error) throw prefsRes.error;
  return {
    remoteDays: Object.fromEntries((daysRes.data ?? []).map((r) => [r.date, r.data])),
    remotePrefs: prefsRes.data?.data ?? null,
  };
}

async function upsertDays(userId, days, dates) {
  if (!dates.length) return;
  const rows = dates.map((date) => ({
    user_id: userId,
    date,
    data: days[date],
    updated_at: days[date].updatedAt ?? new Date().toISOString(),
  }));
  const { error } = await supabase.from('days').upsert(rows, { onConflict: 'user_id,date' });
  if (error) throw error;
}

async function upsertPrefs(userId, prefs) {
  const { error } = await supabase
    .from('prefs')
    .upsert(
      { user_id: userId, data: prefs, updated_at: prefs.updatedAt ?? new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

export function useSync({ user, allData, replaceAll }) {
  const [status, setStatus] = useState(supabase ? 'idle' : 'off');
  const [error, setError] = useState(null);

  // Which signed-in user's initial merge has completed — the debounced push
  // effect stays quiet until this matches, so it can never race the merge.
  const readyForRef = useRef(null);
  // date -> updatedAt already known to match Supabase, so pushes only ever
  // carry what's actually changed.
  const pushedDaysRef = useRef({});
  const pushedPrefsAtRef = useRef(null);
  // Kept current via an effect (not written during render) so callbacks
  // fired later — a debounce timeout, a Supabase response — always see the
  // latest local data without needing it in their dependency arrays.
  const dataRef = useRef(allData);
  useEffect(() => {
    dataRef.current = allData;
  }, [allData]);
  const debounceRef = useRef(null);
  const pullingRef = useRef(false);
  const lastPulledAtRef = useRef(0);
  const realtimeDebounceRef = useRef(null);

  const pushDiff = useCallback(async (uid) => {
    const { days, prefs } = dataRef.current;
    const dueDates = Object.keys(days).filter(
      (k) => days[k].updatedAt && days[k].updatedAt !== pushedDaysRef.current[k],
    );
    try {
      await upsertDays(uid, days, dueDates);
      dueDates.forEach((k) => {
        pushedDaysRef.current[k] = days[k].updatedAt;
      });
      if (prefs?.updatedAt && prefs.updatedAt !== pushedPrefsAtRef.current) {
        await upsertPrefs(uid, prefs);
        pushedPrefsAtRef.current = prefs.updatedAt;
      }
      setStatus('synced');
      setError(null);
    } catch (e) {
      setStatus('error');
      setError(e.message ?? 'Sync failed');
    }
  }, []);

  const pullAndMerge = useCallback(
    async (uid) => {
      if (pullingRef.current) return;
      pullingRef.current = true;
      setStatus('syncing');
      try {
        const { remoteDays, remotePrefs } = await fetchRemote(uid);
        const { merged: mergedDays, toPush: dayPush } = mergeDays(
          dataRef.current.days,
          remoteDays,
        );
        const { merged: mergedPrefs, push: prefsPush } = mergePrefs(
          dataRef.current.prefs,
          remotePrefs,
        );

        replaceAll({ days: mergedDays, prefs: mergedPrefs });

        // Everything not flagged to push already matches what's remote.
        pushedDaysRef.current = {};
        for (const [date, d] of Object.entries(mergedDays)) {
          if (!dayPush.includes(date)) pushedDaysRef.current[date] = d.updatedAt;
        }
        pushedPrefsAtRef.current = prefsPush ? null : mergedPrefs?.updatedAt ?? null;

        // Push straight from the merge result, not the (not-yet-committed)
        // React state — replaceAll's update hasn't landed yet at this point.
        await upsertDays(uid, mergedDays, dayPush);
        if (prefsPush) await upsertPrefs(uid, mergedPrefs);

        lastPulledAtRef.current = Date.now();
        setStatus('synced');
        setError(null);
      } catch (e) {
        setStatus('error');
        setError(e.message ?? 'Sync failed');
      } finally {
        pullingRef.current = false;
      }
    },
    [replaceAll],
  );

  // The initial merge for this sign-in. This is a genuine "synchronize with
  // an external system" effect (Supabase) — the state updates inside
  // pullAndMerge are the point, not a smell.
  useEffect(() => {
    if (!supabase || !user) {
      readyForRef.current = null;
      return;
    }
    pullAndMerge(user.id).then(() => {
      readyForRef.current = user.id;
    });
  }, [user, pullAndMerge]);

  // Debounced push on every local change, once this user's initial merge
  // is in.
  useEffect(() => {
    if (!supabase || !user || readyForRef.current !== user.id) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushDiff(user.id), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [allData, user, pushDiff]);

  // Catch up on reconnect, and on refocus in case another device changed
  // something meanwhile — throttled so tab-switching isn't a request storm.
  useEffect(() => {
    if (!supabase || !user) return;
    const onOnline = () => pushDiff(user.id);
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastPulledAtRef.current > REFOCUS_THROTTLE_MS
      ) {
        pullAndMerge(user.id);
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, pushDiff, pullAndMerge]);

  // Live updates: any change to this user's rows — from any device,
  // including the realtime echo of this device's own push — triggers a
  // pull-and-merge. Debounced so a burst of remote writes (someone pushing
  // several days at once) becomes one merge, not one per row. RLS applies
  // to the subscription itself, so this can only ever see the signed-in
  // user's own rows.
  useEffect(() => {
    if (!supabase || !user) return;
    const onChange = () => {
      clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(
        () => pullAndMerge(user.id),
        REALTIME_DEBOUNCE_MS,
      );
    };
    const channel = supabase
      .channel(`sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'days', filter: `user_id=eq.${user.id}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prefs', filter: `user_id=eq.${user.id}` },
        onChange,
      )
      .subscribe();

    return () => {
      clearTimeout(realtimeDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, pullAndMerge]);

  return { status, error };
}
