import { describe, test, expect } from 'vitest';
import { summariseExercise } from './format';

const ex = (o) => ({ name: '', sets: '', reps: '', weight: '', ...o });

describe('summariseExercise — simple fields', () => {
  test('all three', () => {
    expect(summariseExercise(ex({ sets: '5', reps: '5', weight: '80' }))).toBe(
      '5×5 · 80',
    );
  });

  test('no weight', () => {
    expect(summariseExercise(ex({ sets: '5', reps: '8' }))).toBe('5×8');
  });

  test('only the weight field used (e.g. "10 min")', () => {
    expect(summariseExercise(ex({ weight: '10 min' }))).toBe('10 min');
  });

  test('nothing → empty string', () => {
    expect(summariseExercise(ex({}))).toBe('');
  });
});

describe('summariseExercise — per-set list', () => {
  test('uniform sets', () => {
    expect(
      summariseExercise(
        ex({
          setList: [
            { reps: '5', weight: '80' },
            { reps: '5', weight: '80' },
          ],
        }),
      ),
    ).toBe('2× 5,5 · 80');
  });

  test('varied reps and weight → range', () => {
    expect(
      summariseExercise(
        ex({
          setList: [
            { reps: '5', weight: '80' },
            { reps: '5', weight: '82.5' },
            { reps: '3', weight: '85' },
          ],
        }),
      ),
    ).toBe('3× 5,5,3 · 80–85');
  });

  test('blank set entries are dropped', () => {
    expect(
      summariseExercise(
        ex({
          setList: [
            { reps: '', weight: '' },
            { reps: '5', weight: '80' },
          ],
        }),
      ),
    ).toBe('1× 5 · 80');
  });

  test('a non-empty setList wins over the simple fields', () => {
    expect(
      summariseExercise(
        ex({
          sets: '3',
          reps: '5',
          weight: '80',
          setList: [{ reps: '8', weight: '100' }],
        }),
      ),
    ).toBe('1× 8 · 100');
  });

  test('missing rep shows as a dot', () => {
    expect(
      summariseExercise(ex({ setList: [{ reps: '', weight: '80' }] })),
    ).toBe('1× · · 80');
  });
});
