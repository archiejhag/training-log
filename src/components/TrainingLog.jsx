import ExerciseRow from './ExerciseRow';

/* The optional detail screen. It only exists for a day marked "Trained",
   and it never blocks you: no required fields, no save button that can
   fail, and blank rows are quietly dropped when you leave. */

const newId = () =>
  crypto.randomUUID?.() ?? String(Date.now() + Math.random());

function newExercise() {
  return { id: newId(), name: '', sets: '', reps: '', weight: '' };
}

// clone last session's rows with fresh ids, keeping the numbers to adjust from
function cloneExercises(list) {
  return list.map((x) => ({
    id: newId(),
    name: x.name,
    sets: x.sets,
    reps: x.reps,
    weight: x.weight,
  }));
}

function isBlank(x) {
  return !x.name.trim() && !x.sets.trim() && !x.reps.trim() && !x.weight.trim();
}

export default function TrainingLog({
  dateLabel,
  exercises,
  suggestions = [],
  lastSession = null,
  onChange,
  onBack,
}) {
  const update = (id, next) =>
    onChange(exercises.map((x) => (x.id === id ? next : x)));

  const remove = (id) => onChange(exercises.filter((x) => x.id !== id));

  const add = () => onChange([...exercises, newExercise()]);

  // Leaving the screen tidies up: anything still completely empty is discarded,
  // so the weekly "logged" dot only lights when there's real content.
  const finish = () => {
    onChange(exercises.filter((x) => !isBlank(x)));
    onBack();
  };

  return (
    <div className="log-screen">
      <button type="button" className="back-btn" onClick={finish}>
        &larr; Back
      </button>

      <p className="eyebrow">Training Log</p>
      <h1>{dateLabel}</h1>

      <section className="card">
        <h2>What did you do?</h2>
        <p className="sub">Rough notes are fine. Leave anything blank.</p>

        {exercises.length === 0 ? (
          <div className="empty-actions">
            {lastSession && (
              <button
                type="button"
                className="repeat-btn"
                onClick={() => onChange(cloneExercises(lastSession.exercises))}
              >
                <span className="repeat-title">Repeat last session</span>
                <span className="repeat-sub">
                  {lastSession.label} · {lastSession.exercises.length} exercise
                  {lastSession.exercises.length === 1 ? '' : 's'}
                </span>
              </button>
            )}
            <button type="button" className="empty-add" onClick={add}>
              <span className="plus">+</span>
              {lastSession ? 'Start a fresh list' : 'Add your first exercise'}
            </button>
          </div>
        ) : (
          <>
            <div className="exercise-list">
              {exercises.map((x) => (
                <ExerciseRow
                  key={x.id}
                  exercise={x}
                  suggestions={suggestions}
                  onChange={(next) => update(x.id, next)}
                  onRemove={() => remove(x.id)}
                />
              ))}
            </div>
            <button type="button" className="add-exercise" onClick={add}>
              + Add exercise
            </button>
          </>
        )}
      </section>

      <p className="footnote">
        Nothing here is required — the day already counts as <b>Trained</b>.
      </p>

      <button type="button" className="done-btn" onClick={finish}>
        Done
      </button>
    </div>
  );
}
