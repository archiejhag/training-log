import { dayLetter, weekdayName } from '../lib/date';

/* The "This week" card. Seven equal chalk strokes — colour tells you the
   state, height never does. The count is "X / 7 marked", never a streak.
   A tiny amber dot above a stroke means that Trained day also has exercise
   detail logged.

   Each day is a real <button>: tapping it makes that day the one the
   check-in card edits. */

export default function WeeklyView({ week, getDay, today, selectedDate, onSelectDate }) {
  const marked = week.filter((key) => getDay(key).tier).length;

  return (
    <section className="card">
      <div className="week-header">
        <h2 style={{ margin: 0 }}>This week</h2>
        <span className="week-stat">
          <b>{marked}</b> / 7 marked
        </span>
      </div>

      <div className="strip" role="group" aria-label="Days this week — tap a day to fill it in">
        {week.map((key) => {
          const day = getDay(key);
          const hasDetail = day.tier === 'trained' && day.exercises.length > 0;
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const state = day.tier ?? 'not marked';
          return (
            <button
              key={key}
              type="button"
              className={
                'day-col' +
                (isToday ? ' is-today' : '') +
                (isSelected ? ' is-selected' : '')
              }
              data-tier={day.tier ?? 'none'}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${weekdayName(key)}${isToday ? ', today' : ''} — ${state}`}
              onClick={() => onSelectDate(key)}
            >
              <span className={'logged-dot' + (hasDetail ? ' on' : '')} />
              <span className="stroke" />
              <span className="day-label">{dayLetter(key)}</span>
            </button>
          );
        })}
      </div>

      <div className="hairline-rule" />
      <p className="footnote">Tap any day to fill it in. Every mark stands on its own.</p>
    </section>
  );
}
