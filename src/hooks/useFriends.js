import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as friendsApi from '../lib/friends';

/* Friend requests and the accepted-friends list. Inert (empty list, no
   requests possible) when sync isn't configured or nobody's signed in —
   friends inherently need an account. */

export function useFriends(user) {
  const [friendships, setFriendships] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setFriendships([]);
      return;
    }
    setStatus('loading');
    try {
      const rows = await friendsApi.listFriendships();
      setFriendships(rows);
      setStatus('idle');
      setError(null);
    } catch (e) {
      setStatus('error');
      setError(e.message ?? 'Could not load friends');
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFriend = useCallback(
    async (email) => {
      setError(null);
      try {
        await friendsApi.requestFriend(email);
        await refresh();
      } catch (e) {
        setError(e.message ?? 'Could not send that request');
        throw e;
      }
    },
    [refresh],
  );

  const respond = useCallback(
    async (friendshipId, accept) => {
      try {
        await friendsApi.respondToRequest(friendshipId, accept);
        await refresh();
      } catch (e) {
        setError(e.message ?? 'Could not update that request');
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (friendshipId) => {
      try {
        await friendsApi.removeFriendship(friendshipId);
        await refresh();
      } catch (e) {
        setError(e.message ?? 'Could not remove that friend');
      }
    },
    [refresh],
  );

  return { friendships, status, error, addFriend, respond, remove, refresh };
}
