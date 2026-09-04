/* A gentle observation, no buttons to press. When one skip reason keeps
   recurring, name it once and reframe it — then it's dismissible and gone
   for two weeks (see lib/insights.js `reasonPattern`).

   No "you should". The point is to make a rough patch legible, not to
   prescribe a fix. */

const COPY = {
  busy: (n) =>
    `"Busy" has come up ${n} times in the last two weeks — a lighter week still counts.`,
  notfeelingit: (n) =>
    `"Not feeling it" ${n} times in the last two weeks. Worth noticing, not forcing — the wanting-to usually comes back on its own.`,
};

export default function ReasonPatternNote({ reason, count, onDismiss }) {
  const line = COPY[reason]?.(count);
  if (!line) return null;

  return (
    <section className="nudge" aria-label="Something the log noticed">
      <button
        type="button"
        className="catch-up-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        &times;
      </button>
      <p className="nudge-text nudge-text-only">{line}</p>
    </section>
  );
}
