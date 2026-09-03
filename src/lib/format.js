/** Compact one-line summary of an exercise's numbers, for the read-only
    session view. Handles the simple sets/reps/weight fields and an
    expanded per-set list, and skips whatever is blank.

    "5×5 · 80"          simple
    "5×8"               simple, no weight
    "3× 5,5,3 · 80–85"  per-set, varied
    "2× 5,5 · 80"       per-set, uniform  */
export function summariseExercise(ex) {
  const sets = (ex.setList ?? []).filter(
    (s) => (s.reps ?? '').trim() || (s.weight ?? '').trim(),
  );

  if (sets.length) {
    const reps = sets.map((s) => (s.reps ?? '').trim() || '·').join(',');
    const nums = sets
      .map((s) => Number.parseFloat(s.weight))
      .filter((n) => !Number.isNaN(n));
    let weight = '';
    if (nums.length) {
      const lo = Math.min(...nums);
      const hi = Math.max(...nums);
      weight = lo === hi ? ` · ${lo}` : ` · ${lo}–${hi}`;
    }
    return `${sets.length}× ${reps}${weight}`;
  }

  const setsReps = [ex.sets, ex.reps].filter((v) => (v ?? '').trim()).join('×');
  const weight = (ex.weight ?? '').trim();
  if (setsReps && weight) return `${setsReps} · ${weight}`;
  return setsReps || weight || '';
}
