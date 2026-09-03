import { useId, useState } from 'react';

/* One exercise. A name plus three tiny freeform fields.
   Freeform on purpose: "bodyweight", "8-10", "till failure" are all valid,
   and nothing here is required.

   The name field is a small combobox: type, and names used before are
   suggested (newest first). An empty focused field shows the recent ones. */

const MAX_SUGGESTIONS = 6;

export default function ExerciseRow({
  exercise,
  suggestions = [],
  onChange,
  onRemove,
}) {
  const set = (field) => (e) => onChange({ ...exercise, [field]: e.target.value });

  const listId = useId();
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1); // highlighted suggestion, -1 = none

  const q = exercise.name.trim().toLowerCase();
  const matches = suggestions
    .filter((s) => {
      const sl = s.toLowerCase();
      return sl !== q && (q === '' || sl.includes(q));
    })
    .slice(0, MAX_SUGGESTIONS);
  const showList = open && matches.length > 0;

  const choose = (name) => {
    onChange({ ...exercise, name });
    setOpen(false);
    setHi(-1);
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && hi >= 0) {
      e.preventDefault();
      choose(matches[hi]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHi(-1);
    }
  };

  return (
    <div className="exercise-row">
      <div className="exercise-row-top">
        <div className="ac">
          <input
            className="exercise-name"
            placeholder="Exercise"
            aria-label="Exercise name"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={hi >= 0 ? `${listId}-opt-${hi}` : undefined}
            value={exercise.name}
            onChange={(e) => {
              set('name')(e);
              setOpen(true);
              setHi(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          {showList && (
            <ul className="ac-list" id={listId} role="listbox">
              {matches.map((name, i) => (
                <li
                  key={name}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={i === hi}
                  className={'ac-item' + (i === hi ? ' is-hi' : '')}
                  onMouseDown={(e) => {
                    // keep focus on the input; select on this event
                    e.preventDefault();
                    choose(name);
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
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
