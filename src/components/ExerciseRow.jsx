/* One exercise. A name plus three tiny freeform fields.
   Freeform on purpose: "bodyweight", "8-10", "till failure" are all valid,
   and nothing here is required. */

export default function ExerciseRow({ exercise, onChange, onRemove }) {
  // Helper: return an onChange handler that patches a single field.
  const set = (field) => (e) => onChange({ ...exercise, [field]: e.target.value });

  return (
    <div className="exercise-row">
      <div className="exercise-row-top">
        <input
          className="exercise-name"
          placeholder="Exercise"
          value={exercise.name}
          onChange={set('name')}
          autoComplete="off"
        />
        <button
          type="button"
          className="remove-btn"
          onClick={onRemove}
          aria-label="Remove exercise"
        >
          &times;
        </button>
      </div>

      <div className="exercise-fields">
        <label className="field">
          <span className="field-label">Sets</span>
          <input
            inputMode="numeric"
            placeholder="—"
            value={exercise.sets}
            onChange={set('sets')}
          />
        </label>
        <label className="field">
          <span className="field-label">Reps</span>
          <input
            inputMode="numeric"
            placeholder="—"
            value={exercise.reps}
            onChange={set('reps')}
          />
        </label>
        <label className="field">
          <span className="field-label">Weight</span>
          <input
            placeholder="—"
            value={exercise.weight}
            onChange={set('weight')}
          />
        </label>
      </div>
    </div>
  );
}
