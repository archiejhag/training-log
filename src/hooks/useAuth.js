import { useState, useEffect, useCallback } from 'react';
import { supabase, syncAvailable } from '../lib/supabase';

/* Thin wrapper over Supabase auth. When there's no client (no env keys),
   every field is inert and `syncAvailable` is false — callers render the
   local-only app and never show the sync UI.

   Sign-in is a magic link: enter an email, get a one-time link, land back
   here signed in. No passwords anywhere. */

export function useAuth() {
  const [user, setUser] = useState(null);
  // 'loading' until we know; then 'in' | 'out'; 'sent' after a link goes out
  const [status, setStatus] = useState(syncAvailable ? 'loading' : 'out');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setStatus(data.session ? 'in' : 'out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'in' : 'out');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email) => {
    if (!supabase) return;
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (err) setError(err.message);
    else setStatus('sent');
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setStatus('out');
    setUser(null);
  }, []);

  return { syncAvailable, user, status, error, signIn, signOut };
}
