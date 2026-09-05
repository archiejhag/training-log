import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isValidUsername } from '../lib/friends';

/* Your own username — chosen once, right after signing in, so a friend can
   add you by that instead of needing your email (see UsernameSetup.jsx,
   which gates the app on `status === 'needed'`). Inert when sync isn't
   configured or nobody's signed in. */

export function useProfile(user) {
  const [username, setUsernameState] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | needed | ready | error
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setUsernameState(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (err) throw err;
      setUsernameState(data?.username ?? null);
      setStatus(data?.username ? 'ready' : 'needed');
      setError(null);
    } catch (e) {
      setStatus('error');
      setError(e.message ?? 'Could not load your profile');
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const claim = useCallback(
    async (name) => {
      const normalized = name.trim().toLowerCase();
      if (!isValidUsername(normalized)) {
        const msg = '3-20 characters: lowercase letters, numbers, underscore only.';
        setError(msg);
        throw new Error(msg);
      }
      setError(null);
      try {
        const { error: err } = await supabase
          .from('profiles')
          .upsert({ user_id: user.id, username: normalized }, { onConflict: 'user_id' });
        if (err) throw new Error(err.code === '23505' ? 'That username is taken.' : err.message);
        setUsernameState(normalized);
        setStatus('ready');
      } catch (e) {
        setError(e.message ?? 'Could not save that username');
        throw e;
      }
    },
    [user],
  );

  return { username, status, error, claim, refresh };
}
