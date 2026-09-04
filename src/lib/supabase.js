import { createClient } from '@supabase/supabase-js';

/* The Supabase client, or `null` when the env vars aren't set.

   Sync is strictly optional: no keys → `supabase` is null, and the whole
   app runs on localStorage exactly as it did before any of this existed.
   Every caller must handle the null case. */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // pick up the magic-link token on return
        },
      })
    : null;

/** Is cloud sync even possible in this build? */
export const syncAvailable = supabase != null;
