import { useState, useEffect, useRef } from 'react';
import { monthKeys, monthLabel, weekdayIndex, weekdayName, weekDowLabels } from '../lib/date';
import HistoryToggle from './HistoryToggle';

/* The board, zoomed out: a calendar month of small marks. Same three-tier
   language as the strip (solid / banded / dot), no streak highlighting —
   the pattern is there to be read, not scored. Tapping a day selects it,
   so you can mark it from the check-in card above without leaving. */

export default function MonthView({
  getDay,
  today,
  selectedDate,
  onSelectDate,
  weekStart = 'monday',
  historyMode,
  onHistoryMode,
}) {
  const [offset, setOffset] = useState(0); // 0 = this month, negative = past
  const gridRef = useRef(null);

  const DOW = weekDowLabels(weekStart);
  const days = monthKeys(offset);
  const marked = days.filter((k) => getDay(k).tier).length;
  const firstCol = weekdayIndex(days[0], weekStart); // 0..6, in display order

  // --- draw-on / erase pulse (mirrors WeeklyView) -------------------
  // When a visible day's tier changes, tag that cell 'in' (just marked)
  // or 'out' (just cleared) for one animation, then untag it. CSS keys
  // the keyframes off those classes. Paging months must NOT trigger it,
  // so we watch `offset` and skip the diff on a month change.
  const tierSig = days.map((k) => getDay(k).tier ?? '-').join('|');
  const prevSigRef = useRef(tierSig);
  const prevOffsetRef = useRef(offset);
  const [pulse, setPulse] = useState({});

  useEffect(() => {
    if (prevOffsetRef.current !== offset) {
      prevOffsetRef.current = offset;
      prevSigRef.current = tierSig;
      return;
    }
    const prev = prevSigRef.current.split('|');
    const curr = tierSig.split('|');
    prevSigRef.current = tierSig;

    const changed = {};
    days.forEach((key, i) => {
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
  }, [tierSig, offset]);

  // Roving tabindex: one cell in the tab order, arrows move within the grid.
  const initialFocus = () => {
    const i = days.indexOf(selectedDate);
    if (i >= 0) return i;
    const t = days.indexOf(today);
    return t >= 0 ? t : 0;
  };
  const [focusIndex, setFocusIndex] = useState(initialFocus);
  useEffect(() => {
    setFocusIndex(initialFocus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, selectedDate]);

  const changeMonth = (delta) => setOffset((o) => Math.min(0, o + delta));

  const onKeyDown = (e) => {
    const last = days.length - 1;
    let next = focusIndex;
    if (e.key === 'ArrowRight') next = Math.min(last, focusIndex + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, focusIndex - 1);
    else if (e.key === 'ArrowDown') next = Math.min(last, focusIndex + 7);
    else if (e.key === 'ArrowUp') next = Math.max(0, focusIndex - 7);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setFocusIndex(next);
    gridRef.current?.querySelectorAll('.month-cell')[next]?.focus();
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
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            &lsaquo;
          </button>
          <h2>{monthLabel(offset)}</h2>
          <button
            type="button"
            className="week-arrow"
            onClick={() => changeMonth(1)}
            disabled={offset === 0}
            aria-label="Next month"
          >
            &rsaquo;
          </button>
        </div>
        <span className="week-stat" aria-live="polite">
          <b>{marked}</b> / {days.length} marked
        </span>
      </div>

      <div className="month-dow-row" aria-hidden="true">
        {DOW.map((d, i) => (
          <span key={i} className="month-dow">
            {d}
          </span>
        ))}
      </div>

      <div
        className="month-grid"
        role="group"
        aria-label={`${monthLabel(offset)} — tap a day to fill it in`}
        ref={gridRef}
        onKeyDown={onKeyDown}
      >
        {days.map((key, i) => {
          const d = getDay(key);
          const isToday = key === today;
          const isSelected = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
              className={
                'month-cell' +
                (isToday ? ' is-today' : '') +
                (isSelected ? ' is-selected' : '') +
                (pulse[key] === 'in' ? ' anim-in' : '') +
                (pulse[key] === 'out' ? ' anim-out' : '')
              }
              data-tier={d.tier ?? 'none'}
              style={i === 0 ? { gridColumnStart: firstCol + 1 } : undefined}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${weekdayName(key)} ${Number(key.slice(-2))}${
                isToday ? ', today' : ''
              } — ${d.tier ?? 'not marked'}`}
              onClick={() => onSelectDate(key)}
            >
              <span className="month-mark" />
            </button>
          );
        })}
      </div>

      <p className="footnote">
        {marked === 0
          ? 'A quiet month is still a month.'
          : 'The shape of it — not a score.'}
      </p>
    </section>
  );
}
