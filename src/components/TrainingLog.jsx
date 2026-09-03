import { useState } from 'react';
import ExerciseRow from './ExerciseRow';
import { newId } from '../lib/id';

/* The optional detail screen. It only exists for a day marked "Trained",
   and it never blocks you: no required fields, no save button that can
   fail, and blank rows are quietly dropped when you leave.

   An empty log offers quick fills: the same weekday's last session, the
   most recent session, and any saved presets. A non-empty log can be
   saved as a preset for next time. */

function newExercise() {
  return { id: newId(), name: '', sets: '', reps: '', weight: '' };
}

// copy a template list into fresh, editable rows (keep the numbers to adjust)
function cloneExercises(list) {
  return list.map((x) => ({
    id: newId(),
    name: x.name ?? '',
    sets: x.sets ?? '',
    reps: x.reps ?? '',
    weight: x.weight ?? '',
  }));
}

function isBlank(x) {
  return !x.name.trim() && !x.sets.trim() && !x.reps.trim() && !x.weight.trim();
}

// preset templates carry no ids and no blank rows
function toTemplate(list) {
  return list
    .filter((x) => !isBlank(x))
    .map(({ name, sets, reps, weight }) => ({ name, sets, reps, weight }));
}

export default function TrainingLog({
  dateLabel,
  exercises,
  suggestions = [],
  fillOptions = [],
  presets = [],
  onSavePreset,
  onDeletePreset,
  onChange,
  onBack,
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [naming, setNaming] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saved, setSaved] = useState(null);

  const hasContent = exercises.some((x) => !isBlank(x));

  const update = (id, next) =>
    onChange(exercises.map((x) => (x.id === id ? next : x)));
  const remove = (id) => onChange(exercises.filter((x) => x.id !== id));
  const add = () => onChange([...exercises, newExercise()]);

  const finish = () => {
    onChange(exercises.filter((x) => !isBlank(x)));
    onBack();
  };

  const cancelNaming = () => {
    setNaming(false);
    setPresetName('');
  };

  const commitPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    onSavePreset(name, toTemplate(exercises));
    cancelNaming();
    setSaved(name);
    window.setTimeout(() => setSaved(null), 2500);
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
            {showPresets ? (
              <>
                {presets.map((p) => (
                  <div key={p.id} className="preset-row">
                    <button
                      type="button"
                      className="preset-load"
                      onClick={() => {
                        setShowPresets(false);
                        onChange(cloneExercises(p.exercises));
                      }}
                    >
                      <span className="repeat-title">{p.name}</span>
                      <span className="repeat-sub">
                        {p.exercises.length} exercise
                        {p.exercises.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="preset-del"
                      aria-label={`Delete preset ${p.name}`}
                      onClick={() => onDeletePreset(p.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowPresets(false)}
                >
                  &larr; Back
                </button>
              </>
            ) : (
              <>
                {fillOptions.map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    className="repeat-btn"
                    onClick={() => onChange(cloneExercises(opt.exercises))}
                  >
                    <span className="repeat-title">{opt.title}</span>
                    <span className="repeat-sub">{opt.detail}</span>
                  </button>
                ))}
                {presets.length > 0 && (
                  <button
                    type="button"
                    className="repeat-btn"
                    onClick={() => setShowPresets(true)}
                  >
                    <span className="repeat-title">From a preset</span>
                    <span className="repeat-sub">
                      {presets.length} saved
                    </span>
                  </button>
                )}
                <button type="button" className="empty-add" onClick={add}>
                  <span className="plus">+</span>
                  {fillOptions.length || presets.length
                    ? 'Start a fresh list'
                    : 'Add your first exercise'}
                </button>
              </>
            )}
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

            {hasContent && !naming && !saved && (
              <button
                type="button"
                className="link-btn"
                onClick={() => setNaming(true)}
              >
                Save these as a preset
              </button>
            )}

            {naming && (
              <div className="preset-name-row">
                <input
                  className="preset-name-input"
                  autoFocus
                  placeholder="Name this preset (e.g. Push day)"
                  aria-label="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitPreset();
                    else if (e.key === 'Escape') cancelNaming();
                  }}
                />
                <button
                  type="button"
                  className="preset-name-save"
                  onClick={commitPreset}
                  disabled={!presetName.trim()}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="preset-name-cancel"
                  aria-label="Cancel"
                  onClick={cancelNaming}
                >
                  &times;
                </button>
              </div>
            )}

            {saved && (
              <p className="saved-msg" role="status">
                Saved as “{saved}”
              </p>
            )}
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
