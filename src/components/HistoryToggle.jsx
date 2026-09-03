/* Week / Month switch on the history card. Shared by WeeklyView and
   MonthView so it looks identical in both. */

export default function HistoryToggle({ mode, onMode }) {
  return (
    <div className="hist-toggle" role="group" aria-label="History range">
      {['week', 'month'].map((m) => (
        <button
          key={m}
          type="button"
          className={mode === m ? 'is-on' : undefined}
          aria-pressed={mode === m}
          onClick={() => onMode(m)}
        >
          {m === 'week' ? 'Week' : 'Month'}
        </button>
      ))}
    </div>
  );
}
