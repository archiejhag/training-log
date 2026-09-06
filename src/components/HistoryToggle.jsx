/* Month / Term switch on the History tab. `modes` lets a caller narrow the
   set — History only offers month + season, since Week lives on the Today
   tab now. */

const LABELS = { week: 'Week', month: 'Month', season: 'Term' };

export default function HistoryToggle({ mode, onMode, modes = ['week', 'month', 'season'] }) {
  return (
    <div className="hist-toggle" role="group" aria-label="History range">
      {modes.map((m) => (
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
