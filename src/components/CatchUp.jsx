import { useState } from 'react';

/* Shown above the check-in card when yesterday was never marked.

   Two steps:
   - 'ask'    text + [Trained] [Skipped] [Rest] + ×
   - 'reason' only after Skipped — "what got in the way?" chips + Done

   Yesterday isn't actually written until the flow finishes, so the prompt
   stays mounted through the reason step. Trained / Rest / Done / a chip all
   commit and close; × closes without writing anything. */

const TIERS = [
  { id: 'trained', label: 'Trained' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'rest', label: 'Rest' },
];

const REASONS = [
  { id: 'busy', label: 'Busy' },
  { id: 'notfeelingit', label: 'Not feeling it' },
  { id: 'other', label: 'Other' },
];

export default function CatchUp({ dateLabel, onMark, onSkip, onDismiss }) {
  const [phase, setPhase] = useState('ask');

  return (
    <section className="catch-up">
      {phase === 'ask' && (
        <button
          type="button"
          className="catch-up-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}

      {phase === 'ask' ? (
        <>
          <p className="catch-up-text">
            Yesterday ({dateLabel}) never got marked.
          </p>
          <div className="catch-up-tiers">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="catch-up-tier"
                data-tier={t.id}
                onClick={() =>
                  t.id === 'skipped' ? setPhase('reason') : onMark(t.id)
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="catch-up-text">
            Marking <b>{dateLabel}</b> as skipped. What got in the way?
          </p>
          <div className="catch-up-reasons">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className="catch-up-reason"
                onClick={() => onSkip(r.id)}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              className="catch-up-reason is-skip"
              onClick={() => onSkip(null)}
            >
              Rather not say
            </button>
          </div>
        </>
      )}
    </section>
  );
}
