import { weekKeysForOffset, weekDowLabels } from '../lib/date';
import { seasonSummary, SEASON_WEEKS } from '../lib/insights';
import HistoryToggle from './HistoryToggle';

/* The board pulled all the way back: 12 weeks of days, one row per week,
   oldest at the top and this week at the bottom. No count, no score — the
   only job is to show that quiet stretches happen and then end.

   Non-interactive on purpose. Week and Month are where you tap to edit a
   day; this view is for reading the shape and the line under it. */

function caption({ count, recovered, ongoing, weeks }) {
  if (count === 0) {
    return `A steady enough ${weeks} weeks. Quiet stretches are normal when they come — and they pass.`;
  }
  if (ongoing && recovered === 0) {
    return "A quieter stretch right now — the first long one here. It'll pass like the small ones do.";
  }
  if (ongoing) {
    return `A quieter stretch right now. The ${recovered} before ${
      recovered === 1 ? 'it' : 'them'
    } all ended with you back at it.`;
  }
  return `${count} quiet stretch${count === 1 ? '' : 'es'} in ${weeks} weeks — ${
    count === 1 ? 'and it was' : 'each one'
  } followed by a return.`;
}

export default function SeasonView({
  getDay,
  today,
  weekStart = 'monday',
  historyMode,
  onHistoryMode,
  showToggle = true,
}) {
  const DOW = weekDowLabels(weekStart);
  // Oldest week first, the current week last.
  const weeks = Array.from({ length: SEASON_WEEKS }, (_, i) =>
    weekKeysForOffset(-(SEASON_WEEKS - 1 - i), weekStart),
  );
  const flat = weeks.flat();
  const todayIndex = flat.indexOf(today);
  const tiers = flat.map((k) => getDay(k).tier ?? null);

  const upToToday = todayIndex < 0 ? tiers : tiers.slice(0, todayIndex + 1);
  const marks = upToToday.filter(Boolean).length;
  const summary = seasonSummary(tiers, {
    todayIndex: todayIndex < 0 ? undefined : todayIndex,
  });
  const line = marks < 3 ? 'No streaks here. There never will be.' : caption(summary);

  return (
    <section className="card">
      {showToggle && (
        <div className="hist-top">
          <HistoryToggle mode={historyMode} onMode={onHistoryMode} />
        </div>
      )}

      <h2 className="season-title">The last {SEASON_WEEKS} weeks</h2>

      {marks < 3 ? (
        <p className="season-empty">
          Not much here yet — this view fills in as the weeks go by.
        </p>
      ) : (
        <>
          <div className="season-dow-row" aria-hidden="true">
            {DOW.map((d, i) => (
              <span key={i} className="season-dow">
                {d}
              </span>
            ))}
          </div>

          <div className="season-grid" role="img" aria-label={caption(summary)}>
            {weeks.map((wk, r) => (
              <div className="season-week" key={r}>
                {wk.map((key, c) => {
                  const idx = r * 7 + c;
                  const future = todayIndex >= 0 && idx > todayIndex;
                  return (
                    <span
                      key={key}
                      className={
                        'season-cell' +
                        (key === today ? ' is-today' : '') +
                        (future ? ' is-future' : '')
                      }
                      data-tier={getDay(key).tier ?? 'none'}
                    >
                      <span className="season-mark" />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="footnote">{line}</p>
    </section>
  );
}
