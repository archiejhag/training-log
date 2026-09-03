import { useId, useState } from 'react';
import { newId } from '../lib/id';

/* One exercise. A name plus, by default, three tiny freeform fields
   (sets / reps / weight). "+ per-set" swaps those for a row-per-set list
   for the days where each set differs; "− per-set" flattens it back.

   The name field is a small combobox: type, and names used before are
   suggested (newest first). An empty focused field shows the recent ones. */

const MAX_SUGGESTIONS = 6;
const MAX_SETS = 12;

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

  // --- per-set mode -------------------------------------------------
  const perSet = exercise.setList ?? null;

  const expand = () => {
    const n = Math.min(MAX_SETS, Math.max(1, parseInt(exercise.sets, 10) || 1));
    onChange({
      ...exercise,
      sets: '',
      reps: '',
      weight: '',
      setList: Array.from({ length: n }, () => ({
        id: newId(),
        reps: exercise.reps ?? '',
        weight: exercise.weight ?? '',
      })),
    });
  };

  const collapse = () => {
    const first = exercise.setList?.[0] ?? {};
    const { setList, ...rest } = exercise;
    void setList;
    onChange({
      ...rest,
      sets: String(exercise.setList?.length ?? ''),
      reps: first.reps ?? '',
      weight: first.weight ?? '',
    });
  };

  const patchSet = (i, patch) =>
    onChange({
      ...exercise,
      setList: exercise.setList.map((s, idx) =>
        idx === i ? { ...s, ...patch } : s,
      ),
    });

  const addSet = () => {
    const last = exercise.setList[exercise.setList.length - 1] ?? {
      reps: '',
      weight: '',
    };
    onChange({
      ...exercise,
      setList: [
        ...exercise.setList,
        { id: newId(), reps: last.reps ?? '', weight: last.weight ?? '' },
      ],
    });
  };

  const removeSet = (i) => {
    if (exercise.setList.length <= 1) return collapse();
    onChange({
      ...exercise,
      setList: exercise.setList.filter((_, idx) => idx !== i),
    });
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

      {perSet ? (
        <div className="perset">
          <div className="perset-head" aria-hidden="true">
            <span />
            <span>Reps</span>
            <span>Weight</span>
            <span />
          </div>
          {perSet.map((s, i) => (
            <div className="perset-row" key={s.id ?? i}>
              <span className="perset-num">Set {i + 1}</span>
              <input
                className="perset-in"
                inputMode="numeric"
                placeholder="reps"
                aria-label={`Set ${i + 1} reps`}
                value={s.reps}
                onChange={(e) => patchSet(i, { reps: e.target.value })}
              />
              <input
                className="perset-in"
                placeholder="weight"
                aria-label={`Set ${i + 1} weight`}
                value={s.weight}
                onChange={(e) => patchSet(i, { weight: e.target.value })}
              />
              <button
                type="button"
                className="perset-del"
                aria-label={`Remove set ${i + 1}`}
                onClick={() => removeSet(i)}
              >
                &times;
              </button>
            </div>
          ))}
          <div className="perset-actions">
            <button
              type="button"
              className="perset-add"
              onClick={addSet}
              disabled={perSet.length >= MAX_SETS}
            >
              + add set
            </button>
            <button type="button" className="perset-toggle" onClick={collapse}>
              &minus; per-set
            </button>
          </div>
        </div>
      ) : (
        <>
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
          <button type="button" className="perset-toggle" onClick={expand}>
            + per-set
          </button>
        </>
      )}
    </div>
  );
}
