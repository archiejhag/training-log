/* Shown above the check-in card during a rough patch — several Skipped
   days in the last fortnight while a weekly bar of 3+ is running at half
   rate or less (see lib/insights.js `busyStretch`).

   One gentle offer: drop the bar to a smaller number. Never a demand,
   never a "you're failing". Accept or dismiss and it stays quiet for two
   weeks. */

export default function BusyNudge({ skips, suggestedBar, onAccept, onDismiss }) {
  return (
    <section className="nudge" aria-label="A smaller bar this stretch?">
      <button
        type="button"
        className="catch-up-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        &times;
      </button>

      <p className="nudge-text">
        Looks like a busy stretch — {skips} days skipped in the last two weeks.
        Weeks like this, {suggestedBar} sessions is still a win.
      </p>

      <div className="nudge-actions">
        <button type="button" className="nudge-accept" onClick={onAccept}>
          Set my bar to {suggestedBar}
        </button>
        <button type="button" className="nudge-later" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </section>
  );
}
