import { describe, it, expect } from 'vitest';
import { flattenSession, regroupExercises, type FlatSet } from './useSessions';
import type { Session } from './types';

/**
 * The useSessions hook itself depends on React + localStorage, so it
 * lives behind a renderer. The interesting logic — flatten/regroup —
 * is pure and is what these tests cover. updateSet/deleteSet are thin
 * wrappers over `applyFlatMutation(flatten → mutate → regroup)`, so a
 * round-trip on the pure helpers exercises the same code path.
 */

const flat = (name: string, family: FlatSet['family'], reps: number, weight: number): FlatSet => ({
  name,
  family,
  reps,
  weight,
});

const session = (date: string, ...flats: FlatSet[]): Session => ({
  date,
  exercises: regroupExercises(flats),
});

describe('flattenSession', () => {
  it('preserves row order across exercises and sets', () => {
    const s = session(
      '2026-05-15',
      flat('bench', 'pushH', 6, 85),
      flat('bench', 'pushH', 5, 90),
      flat('squat', 'squat', 5, 135),
    );
    expect(flattenSession(s)).toEqual([
      { name: 'bench', family: 'pushH', reps: 6, weight: 85 },
      { name: 'bench', family: 'pushH', reps: 5, weight: 90 },
      { name: 'squat', family: 'squat', reps: 5, weight: 135 },
    ]);
  });
});

describe('regroupExercises', () => {
  it('merges consecutive same-name same-family rows into one ExerciseEntry', () => {
    const grouped = regroupExercises([
      flat('bench', 'pushH', 6, 85),
      flat('bench', 'pushH', 5, 90),
      flat('squat', 'squat', 5, 135),
    ]);
    expect(grouped).toEqual([
      { name: 'bench', family: 'pushH', sets: [{ reps: 6, weight: 85 }, { reps: 5, weight: 90 }] },
      { name: 'squat', family: 'squat', sets: [{ reps: 5, weight: 135 }] },
    ]);
  });

  it('splits on family change even when name matches', () => {
    const grouped = regroupExercises([
      flat('press', 'pushH', 5, 95),
      flat('press', 'pushV', 5, 65),
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].family).toBe('pushH');
    expect(grouped[1].family).toBe('pushV');
  });

  it('treats casing and whitespace as the same name', () => {
    const grouped = regroupExercises([
      flat('Bench', 'pushH', 6, 85),
      flat(' bench ', 'pushH', 5, 90),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].sets).toHaveLength(2);
  });

  it('round-trips through flatten without changing shape', () => {
    const original = session(
      '2026-05-15',
      flat('bench', 'pushH', 6, 85),
      flat('squat', 'squat', 5, 135),
      flat('bench', 'pushH', 5, 90),
    );
    const round = { date: '2026-05-15', exercises: regroupExercises(flattenSession(original)) };
    expect(round).toEqual(original);
  });
});

/**
 * The behavior tests below imitate `updateSet`/`deleteSet` by composing
 * flatten → mutate → regroup. Keeping them at this level avoids spinning
 * up React just to assert the regrouping rules — the hook adds nothing
 * to those rules beyond persistence.
 */
describe('flat-mutation round-trips (updateSet/deleteSet semantics)', () => {
  function patchAt(s: Session, i: number, p: Partial<FlatSet>): Session {
    const next = flattenSession(s);
    next[i] = { ...next[i], ...p };
    return { date: s.date, exercises: regroupExercises(next) };
  }

  function removeAt(s: Session, i: number): Session {
    const next = flattenSession(s);
    next.splice(i, 1);
    return { date: s.date, exercises: regroupExercises(next) };
  }

  const day = session(
    '2026-05-15',
    flat('bench', 'pushH', 6, 85),
    flat('bench', 'pushH', 5, 90),
    flat('bench', 'pushH', 4, 95),
    flat('squat', 'squat', 5, 135),
  );

  it('patches reps in place without restructuring groups', () => {
    const after = patchAt(day, 1, { reps: 7 });
    expect(after.exercises[0].sets).toEqual([
      { reps: 6, weight: 85 },
      { reps: 7, weight: 90 },
      { reps: 4, weight: 95 },
    ]);
    expect(after.exercises).toHaveLength(2);
  });

  it('renaming a middle row to a new name splits the group in three', () => {
    const after = patchAt(day, 1, { name: 'incline bench' });
    expect(after.exercises.map((e) => e.name)).toEqual([
      'bench',
      'incline bench',
      'bench',
      'squat',
    ]);
    expect(after.exercises[0].sets).toHaveLength(1);
    expect(after.exercises[2].sets).toHaveLength(1);
  });

  it('renaming a row to match its neighbor merges them', () => {
    // Pre-state: pullups, pullups, chinups → rename trailing chinups to "pullups"
    const variantDay = session(
      '2026-05-15',
      flat('pullups', 'pullV', 8, 0),
      flat('pullups', 'pullV', 7, 0),
      flat('chinups', 'pullV', 6, 0),
    );
    const after = patchAt(variantDay, 2, { name: 'pullups' });
    expect(after.exercises).toHaveLength(1);
    expect(after.exercises[0].sets).toHaveLength(3);
  });

  it('deleting the only set of an exercise group drops the group', () => {
    const after = removeAt(day, 3); // the squat row
    expect(after.exercises.map((e) => e.name)).toEqual(['bench']);
    expect(after.exercises[0].sets).toHaveLength(3);
  });

  it('deleting a middle set leaves remaining sets grouped', () => {
    const after = removeAt(day, 1);
    expect(after.exercises[0].sets).toEqual([
      { reps: 6, weight: 85 },
      { reps: 4, weight: 95 },
    ]);
  });

  it('delete + restoreSet round-trips a middle set back to its original spot', () => {
    // Mirror what the undo-toast flow does: capture the row, delete, restore.
    const original = flattenSession(day);
    const captured = original[2]; // bench 4 × 95
    const after = removeAt(day, 2);
    expect(flattenSession(after)).toHaveLength(3);
    // Splice-insert at the original flatIndex (the restoreSet semantics).
    const restoredFlat = flattenSession(after);
    restoredFlat.splice(2, 0, captured);
    const restored: Session = { date: day.date, exercises: regroupExercises(restoredFlat) };
    expect(restored).toEqual(day);
  });
});
