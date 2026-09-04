/* Week / Month / Term switch on the history card. Shared by WeeklyView,
   MonthView and SeasonView so it looks identical in all three. */

const LABELS = { week: 'Week', month: 'Month', season: 'Term' };

export default function HistoryToggle({ mode, onMode }) {
  return (
    <div className="hist-toggle" role="group" aria-label="History range">
      {['week', 'month', 'season'].map((m) => (
        <button
          key={m}
          type="button"
          className={mode === m ? 'is-on' : undefined}
          aria-pressed={mode === m}
          onClick={() => onMode(m)}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}
