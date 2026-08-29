import { useState, useEffect, useRef } from 'react';
import { dayLetter, weekdayName, weekRangeLabel } from '../lib/date';

/* The "This week" card. Seven equal chalk strokes — colour tells you the
   state, height never does. The count is "X / 7 marked", never a streak.
   A tiny amber dot above a stroke means that Trained day also has exercise
   detail logged.

   Each day is a real <button>: tapping it makes that day the one the
   check-in card edits. The strip is a toolbar with roving tabindex — Tab
   lands on it once, then arrow keys move between days. Arrows on the header
   page back through previous weeks; you can't go past the current one. */

function weekLabel(weekOffset, week) {
  if (weekOffset === 0) return 'This week';
  if (weekOffset === -1) return 'Last week';
  return weekRangeLabel(week[0], week[6]);
}

export default function WeeklyView({
  week,
  weekOffset,
  onWeekChange,
  getDay,
  today,
  selectedDate,
  onSelectDate,
}) {
  const marked = week.filter((key) => getDay(key).tier).length;
  const stripRef = useRef(null);

  // Which column is Tab-reachable / arrow-key focused. Defaults to the
  // selected day when it's on screen, else Monday.
  const [focusIndex, setFocusIndex] = useState(() => {
    const i = week.indexOf(selectedDate);
    return i >= 0 ? i : 0;
  });

  // Realign when the week is paged or the selection changes from elsewhere.
  // `week` is a fresh array each render, so key off the stable signals.
  useEffect(() => {
    const i = week.indexOf(selectedDate);
    setFocusIndex(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, weekOffset]);

  const onKeyDown = (e) => {
    let next = focusIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(6, focusIndex + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, focusIndex - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 6;
    else return;
    e.preventDefault();
    setFocusIndex(next);
    stripRef.current?.children[next]?.focus();
  };

  return (
    <section className="card">
      <div className="week-header">
        <div className="week-nav">
          <button
            type="button"
            className="week-arrow"
            onClick={() => onWeekChange(-1)}
            aria-label="Previous week"
          >
            &lsaquo;
          </button>
          <h2>{weekLabel(weekOffset, week)}</h2>
          <button
            type="button"
            className="week-arrow"
            onClick={() => onWeekChange(1)}
            disabled={weekOffset === 0}
            aria-label="Next week"
          >
            &rsaquo;
          </button>
        </div>
        <span className="week-stat" aria-live="polite">
          <b>{marked}</b> / 7 marked
        </span>
      </div>

      <div
        className="strip"
        role="toolbar"
        aria-label="Days this week"
        ref={stripRef}
        onKeyDown={onKeyDown}
      >
        {week.map((key, i) => {
          const day = getDay(key);
          const hasDetail = day.tier === 'trained' && day.exercises.length > 0;
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const state = day.tier ?? 'not marked';
          return (
            <button
              key={key}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
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
