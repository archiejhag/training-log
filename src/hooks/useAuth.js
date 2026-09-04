import { useState, useEffect, useCallback } from 'react';
import { supabase, syncAvailable } from '../lib/supabase';

/* Thin wrapper over Supabase auth. When there's no client (no env keys),
   every field is inert and `syncAvailable` is false — callers render the
   local-only app and never show the sync UI.

   Sign-in sends one email with two ways to use it: a magic link, and a
   6-digit code (verifyCode). No passwords anywhere.

   The code matters more than it looks. A home-screen PWA on iOS has its
   own storage, walled off from Safari — and the email link always opens
   in Safari (or whatever the default browser is), never inside the
   installed icon. So tapping the link signs you in over there, while the
   icon you actually use never sees it. Typing the code instead never
   leaves the app, so there's no hand-off to lose the session in. */

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

  const verifyCode = useCallback(async (email, token) => {
    if (!supabase) return;
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    // On success, onAuthStateChange fires with the new session and updates
    // status/user itself — nothing else to do here.
    if (err) setError(err.message);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setStatus('out');
    setUser(null);
  }, []);

  return { syncAvailable, user, status, error, signIn, verifyCode, signOut };
}
