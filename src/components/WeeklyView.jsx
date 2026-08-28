import { dayLetter } from '../lib/date';

/* The "This week" card. Seven equal chalk strokes — colour tells you the
   state, height never does. The count is "X / 7 marked", never a streak.
   A tiny amber dot above a stroke means that Trained day also has exercise
   detail logged. */

export default function WeeklyView({ week, getDay, today }) {
  const marked = week.filter((key) => getDay(key).tier).length;

  return (
    <section className="card">
      <div className="week-header">
        <h2 style={{ margin: 0 }}>This week</h2>
        <span className="week-stat">
          <b>{marked}</b> / 7 marked
        </span>
      </div>

      <div className="strip">
        {week.map((key) => {
          const day = getDay(key);
          const hasDetail = day.tier === 'trained' && day.exercises.length > 0;
          return (
            <div
              key={key}
              className={'day-col' + (key === today ? ' is-today' : '')}
              data-tier={day.tier ?? 'none'}
            >
              <span className={'logged-dot' + (hasDetail ? ' on' : '')} />
              <div className="stroke" />
              <span className="day-label">{dayLetter(key)}</span>
            </div>
          );
        })}
      </div>

      <div className="hairline-rule" />
      <p className="footnote">No streaks to break. Every mark stands on its own.</p>
    </section>
  );
}
