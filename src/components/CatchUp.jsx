/* Shown above the check-in card when yesterday was never marked. One line,
   three compact buttons, and an × to dismiss. Marking a tier or dismissing
   both make it vanish — and it won't return for the same day (App persists
   the dismissal in prefs.catchUpDismissedFor). No skip-reason chips here:
   this is meant to stay a single line. */

const TIERS = [
  { id: 'trained', label: 'Trained' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'rest', label: 'Rest' },
];

export default function CatchUp({ dateLabel, onMark, onDismiss }) {
  return (
    <section className="catch-up">
      <button
        type="button"
        className="catch-up-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        &times;
      </button>

      <p className="catch-up-text">Yesterday ({dateLabel}) never got marked.</p>

      <div className="catch-up-tiers">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="catch-up-tier"
            data-tier={t.id}
            onClick={() => onMark(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}
