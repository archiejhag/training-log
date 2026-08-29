/* The "Mark today" card. Three equal-weight tiers, an optional reason when
   you skip, and — only when you've marked Trained — a gentle nudge toward
   the training-log screen that you're free to ignore. */

const TIERS = [
  { id: 'trained', label: 'Trained', desc: 'Session done' },
  { id: 'skipped', label: 'Skipped', desc: "Didn't happen" },
  { id: 'rest', label: 'Rest', desc: 'Planned day off' },
];

const REASONS = [
  { id: 'busy', label: 'Busy' },
  { id: 'notfeelingit', label: 'Not feeling it' },
  { id: 'other', label: 'Other' },
];

export default function CheckIn({ day, isToday, dateLabel, onTier, onReason, onOpenLog }) {
  const count = day.exercises.length;

  return (
    <section className="card">
      <h2>{isToday ? 'Mark today' : `Mark ${dateLabel}`}</h2>
      <p className="sub">Pick whatever's true. No wrong answer.</p>

      <div
        className="tiers"
        role="group"
        aria-label={isToday ? 'Mark today' : `Mark ${dateLabel}`}
      >
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'tier-btn' + (day.tier === t.id ? ' selected' : '')}
            data-tier={t.id}
            aria-pressed={day.tier === t.id}
            onClick={() => onTier(t.id)}
          >
            <span className="mark" />
            <span className="label">{t.label}</span>
            <span className="desc">{t.desc}</span>
          </button>
        ))}
      </div>

      {day.tier === 'skipped' && (
        <div className="reason-block">
          <p className="prompt">No pressure to answer, but what got in the way?</p>
          <div className="reason-chips" role="group" aria-label="What got in the way?">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={
                  'reason-chip' + (day.reason === r.id ? ' selected' : '')
                }
                aria-pressed={day.reason === r.id}
                onClick={() => onReason(day.reason === r.id ? null : r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {day.tier === 'trained' && (
        <div className="log-prompt">
          <div>
            <p className="log-prompt-title">Nice. Want to note what you did?</p>
            <p className="log-prompt-sub">
              {count > 0
                ? `${count} exercise${count > 1 ? 's' : ''} logged`
                : 'Totally optional — skip it if you like.'}
            </p>
          </div>
          <button type="button" className="ghost-btn" onClick={onOpenLog}>
            {count > 0 ? 'Edit' : 'Add details'}
          </button>
        </div>
      )}
    </section>
  );
}
