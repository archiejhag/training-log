import { describe, test, expect } from 'vitest';
import { shapeFriendDays, friendNotifications } from './friends';

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

describe('friendNotifications', () => {
  test('an incoming request is theirs, not yours', () => {
    const friendships = [
      { friendship_id: '1', status: 'pending', i_am_requester: false },
      { friendship_id: '2', status: 'pending', i_am_requester: true },
    ];
    const { incoming, newlyAccepted } = friendNotifications(friendships, null);
    expect(incoming.map((f) => f.friendship_id)).toEqual(['1']);
    expect(newlyAccepted).toEqual([]);
  });

  test('an acceptance only counts if you were the requester and it happened after the seen-at mark', () => {
    const friendships = [
      {
        friendship_id: '1',
        status: 'accepted',
        i_am_requester: true,
        responded_at: '2026-09-05T00:00:00.000Z',
      },
      {
        friendship_id: '2',
        status: 'accepted',
        i_am_requester: false,
        responded_at: '2026-09-05T00:00:00.000Z',
      },
      {
        friendship_id: '3',
        status: 'accepted',
        i_am_requester: true,
        responded_at: '2026-09-01T00:00:00.000Z',
      },
    ];
    const { incoming, newlyAccepted } = friendNotifications(
      friendships,
      '2026-09-02T00:00:00.000Z',
    );
    expect(incoming).toEqual([]);
    expect(newlyAccepted.map((f) => f.friendship_id)).toEqual(['1']);
  });

  test('no seen-at mark counts every past acceptance as unseen', () => {
    const friendships = [
      {
        friendship_id: '1',
        status: 'accepted',
        i_am_requester: true,
        responded_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    const { newlyAccepted } = friendNotifications(friendships, null);
    expect(newlyAccepted.map((f) => f.friendship_id)).toEqual(['1']);
  });
});
