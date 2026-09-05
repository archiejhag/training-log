import { useMemo } from 'react';
import SeasonView from './SeasonView';
import { summariseExercise } from '../lib/format';
import { weekdayName } from '../lib/date';

/* A friend's board, read-only. Reuses the term view exactly as it renders
   for you — same marks, same "gaps are normal" framing — plus a plain
   list of their recent Trained sessions underneath, so "look through what
   they've been training" actually shows the exercises, not just a grid of
   coloured cells.

   No counts, no comparison to your own numbers anywhere on this screen —
   it's just their board, on its own. */

const MAX_SESSIONS = 10;

export default function FriendLog({ friend, today, weekStart, onBack }) {
  const { username, days } = friend;
  const getDay = (key) => days[key] ?? { tier: null };

  const recentSessions = useMemo(() => {
    return Object.keys(days)
      .filter((key) => {
        const d = days[key];
        return (
          d.tier === 'trained' &&
          ((d.exercises?.length ?? 0) > 0 || (d.freeform ?? '').trim() !== '')
        );
      })
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, MAX_SESSIONS);
  }, [days]);

  return (
    <div className="log-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        &larr; Back
      </button>

      <p className="eyebrow">Friend's log</p>
      <h1>{username}</h1>

      <SeasonView getDay={getDay} today={today} weekStart={weekStart} showToggle={false} />

      <section className="card">
        <h2>Recent sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="sub">Nothing logged yet.</p>
        ) : (
          <ul className="friend-sessions">
            {recentSessions.map((key) => {
              const day = days[key];
              const freeText = (day.freeform ?? '').trim();
              return (
                <li className="friend-session" key={key}>
                  <p className="friend-session-date">
                    {weekdayName(key)} &middot; {key}
                  </p>
                  {day.exercises?.length > 0 ? (
                    <ul className="summary-list">
                      {day.exercises.map((ex) => (
                        <li key={ex.id ?? ex.name}>
                          <span className="summary-name">{ex.name || 'Exercise'}</span>
                          <span className="summary-metric">{summariseExercise(ex)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="summary-freeform">{freeText}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
