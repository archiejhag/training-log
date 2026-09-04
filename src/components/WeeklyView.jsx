import { useState, useEffect, useRef } from 'react';
import { dayLetter, weekdayName, weekRangeLabel } from '../lib/date';
import HistoryToggle from './HistoryToggle';

/* The "This week" card. Seven equal chalk strokes — colour tells you the
   state, height never does. By default the count is "X / 7 marked", never a
   streak. If you've set a weekly bar (Settings › Your week) it reads
   "<trained> / <bar>" — your own number — with "X / 7 marked" kept as a quiet
   second line. Falling short of the bar is never dramatised.
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
  onErase,
  bar = null,
  onEditBar,
  historyMode,
  onHistoryMode,
}) {
  const marked = week.filter((key) => getDay(key).tier).length;
  const trained = week.filter((key) => getDay(key).tier === 'trained').length;
  const stripRef = useRef(null);

  // The eraser only works on a marked day that's actually on screen.
  const canErase = week.includes(selectedDate) && getDay(selectedDate).tier != null;
  // Tint the chalk stub to whatever the selected day is marked as.
  const nubTier = getDay(selectedDate).tier ?? 'none';

  // --- draw-on / erase pulse ---------------------------------------
  // When a visible day's tier changes, tag that column 'in' (just marked)
  // or 'out' (just cleared) for one animation, then untag it. CSS keys the
  // keyframes off those classes. Paging weeks must NOT trigger it, so we
  // watch weekOffset and skip the diff on a week change.
  const tierSig = week.map((k) => getDay(k).tier ?? '-').join('|');
  const prevSigRef = useRef(tierSig);
  const prevOffsetRef = useRef(weekOffset);
  const [pulse, setPulse] = useState({});

  useEffect(() => {
    if (prevOffsetRef.current !== weekOffset) {
      prevOffsetRef.current = weekOffset;
      prevSigRef.current = tierSig;
      return;
    }
    const prev = prevSigRef.current.split('|');
    const curr = tierSig.split('|');
    prevSigRef.current = tierSig;

    const changed = {};
    week.forEach((key, i) => {
      if (prev[i] !== undefined && prev[i] !== curr[i]) {
        changed[key] = curr[i] === '-' ? 'out' : 'in';
      }
    });
    if (!Object.keys(changed).length) return;

    setPulse((p) => ({ ...p, ...changed }));
    const t = setTimeout(() => {
      setPulse((p) => {
        const n = { ...p };
        Object.keys(changed).forEach((k) => delete n[k]);
        return n;
      });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierSig, weekOffset]);

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
      <div className="hist-top">
        <HistoryToggle mode={historyMode} onMode={onHistoryMode} />
      </div>

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
        {bar != null ? (
          <button
            type="button"
            className="week-stat week-stat-btn"
            onClick={onEditBar}
            aria-live="polite"
            aria-label={`Weekly bar: trained ${trained} of ${bar}. Change your bar.`}
          >
            <span className="week-stat-main">
              <b>{trained}</b> / {bar}
            </span>
            <span className="week-substat">{marked} / 7 marked</span>
          </button>
        ) : (
          <span className="week-stat" aria-live="polite">
            <span className="week-stat-main">
              <b>{marked}</b> / 7 marked
            </span>
            <button type="button" className="set-bar-link" onClick={onEditBar}>
              Set a weekly bar
            </button>
          </span>
        )}
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
                (isSelected ? ' is-selected' : '') +
                (pulse[key] === 'in' ? ' anim-in' : '') +
                (pulse[key] === 'out' ? ' anim-out' : '')
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

      <div className="board-tray">
        <span className="chalk-nub" data-tier={nubTier} aria-hidden="true" />
        <button
          type="button"
          className="eraser"
          onClick={onErase}
          disabled={!canErase}
          title={canErase ? `Erase ${weekdayName(selectedDate)}` : 'Nothing to erase'}
          aria-label={canErase ? `Erase ${weekdayName(selectedDate)}` : 'Nothing to erase'}
        />
      </div>

      <p className="footnote">
        {bar != null && trained >= bar
          ? "That's your bar for the week. Anything more is a bonus."
          : marked === 0
            ? 'Tap any day to fill it in. A blank week is just a blank week — nothing to make up.'
            : 'Tap any day to fill it in. Every mark stands on its own.'}
      </p>
    </section>
  );
}
