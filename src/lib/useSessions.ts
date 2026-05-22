import { useEffect, useState } from 'react';
import type { ExerciseEntry, Family, Session, SetEntry } from './types';
import { SEED_SESSIONS } from '../data/seed';

const STORAGE_KEY = 'massed:sessions:v2';
/* Set to '1' on the cold load that fell back to SEED_SESSIONS, cleared
   on the first real user mutation. Lets the sync layer know whether the
   currently-local data is still untouched demo content — so a brand-new
   user wiring up their gist doesn't push the seed up as canonical. */
const SEED_FLAG_KEY = 'massed:seed-active:v1';

/**
 * useSessions — single read/write surface for the prototype's session log.
 *
 * On first mount, hydrates from localStorage. If nothing is stored, falls
 * back to SEED_SESSIONS so the app has something to show. Every write
 * overwrites the entire list (small data, simple semantics for v1).
 *
 * NOTE: when the user's session list grows beyond a few hundred entries,
 * this should switch to a more granular API (append-only writes, etc.)
 * and probably to IndexedDB. For the prototype, JSON-blob-in-localStorage
 * is fine.
 */
export function useSessions(): {
  sessions: Session[];
  setSessions: (s: Session[]) => void;
  addSession: (s: Session) => void;
  addSet: (date: string, exerciseName: string, family: Family, set: SetEntry) => void;
  updateSet: (date: string, flatIndex: number, patch: FlatSetPatch) => void;
  deleteSet: (date: string, flatIndex: number) => void;
  restoreSet: (date: string, flatIndex: number, row: FlatSet) => void;
  resetToSeed: () => void;
  clearAll: () => void;
  /** True while the visible log is untouched seed data. Flips false on
      the first user mutation; flips true again after `resetToSeed`. */
  seedActive: boolean;
} {
  const [sessions, setSessionsState] = useState<Session[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Session[];
      }
    } catch {
      /* fall through to seed */
    }
    return SEED_SESSIONS;
  });

  const [seedActive, setSeedActiveState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // First cold load — seed is about to populate. Flag it so a
        // reload before any edit still reads as seed-active.
        localStorage.setItem(SEED_FLAG_KEY, '1');
        return true;
      }
      return localStorage.getItem(SEED_FLAG_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Clears the seed flag on first user mutation. No-op once consumed.
  function consumeSeed() {
    if (!seedActive) return;
    try { localStorage.removeItem(SEED_FLAG_KEY); } catch { /* ignore */ }
    setSeedActiveState(false);
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      /* storage may be full or unavailable */
    }
  }, [sessions]);

  /**
   * Append a single set. Finds-or-creates the session for `date`, then
   * appends to the *last* ExerciseEntry in that session only if its name
   * matches; otherwise creates a new ExerciseEntry.
   *
   * Why last-only (not anywhere-in-session): preserves chronological
   * entry order in storage so a superset like bench/squat/bench reads
   * as three entries in that order, not [bench×2, squat×1]. Future
   * superset features can infer pairing from data without a model change.
   *
   * Family is supplied by the caller — LogScreen prompts the user when
   * `inferFamily` returns null.
   */
  function addSet(date: string, exerciseName: string, family: Family, set: SetEntry) {
    consumeSeed();
    setSessionsState((prev) => {
      const next = prev.map((s) => ({
        ...s,
        exercises: s.exercises.map((ex) => ({ ...ex, sets: [...ex.sets] })),
      }));

      let session = next.find((s) => s.date === date);
      if (!session) {
        session = { date, exercises: [] };
        next.push(session);
        next.sort((a, b) => a.date.localeCompare(b.date));
      }

      const name = exerciseName.trim();
      const last = session.exercises[session.exercises.length - 1];
      if (last && last.name.trim().toLowerCase() === name.toLowerCase()) {
        last.sets.push(set);
      } else {
        session.exercises.push({ name, family, sets: [set] });
      }

      return next;
    });
  }

  /**
   * Patch a single set in-place by its (date, flatIndex) coordinate.
   * The flat index addresses the table view's row order — sets read
   * left-to-right, exercise-group-by-exercise-group.
   *
   * The model after patch is rebuilt from the flat list via
   * `regroupExercises`, which means a rename or family change can split
   * or merge ExerciseEntries to keep the on-disk shape consistent with
   * what addSet would produce.
   */
  function updateSet(date: string, flatIndex: number, patch: FlatSetPatch) {
    consumeSeed();
    setSessionsState((prev) => applyFlatMutation(prev, date, (flat) => {
      if (flatIndex < 0 || flatIndex >= flat.length) return flat;
      const next = flat.slice();
      next[flatIndex] = { ...next[flatIndex], ...patch };
      return next;
    }));
  }

  /**
   * Remove a single set by (date, flatIndex). If the removal leaves the
   * session empty, drop the session — the table should not show a header
   * with no rows under it.
   */
  function deleteSet(date: string, flatIndex: number) {
    consumeSeed();
    setSessionsState((prev) => applyFlatMutation(prev, date, (flat) => {
      if (flatIndex < 0 || flatIndex >= flat.length) return flat;
      return flat.slice(0, flatIndex).concat(flat.slice(flatIndex + 1));
    }));
  }

  /**
   * Re-insert a flat row at `flatIndex` — the undo path for `deleteSet`.
   * If the session has since vanished (e.g. its only set was the one
   * we're restoring), it's recreated. flatIndex is clamped to the
   * surviving flat list's bounds, so a stale undo after additional
   * deletions still lands somewhere sensible.
   */
  function restoreSet(date: string, flatIndex: number, row: FlatSet) {
    consumeSeed();
    setSessionsState((prev) => {
      const next = prev.slice();
      const existingIdx = next.findIndex((s) => s.date === date);
      const baseFlat = existingIdx === -1 ? [] : flattenSession(next[existingIdx]);
      const clamped = Math.max(0, Math.min(flatIndex, baseFlat.length));
      const inserted = baseFlat.slice(0, clamped).concat(row, baseFlat.slice(clamped));
      const rebuilt: Session = { date, exercises: regroupExercises(inserted) };
      if (existingIdx === -1) {
        next.push(rebuilt);
        next.sort((a, b) => a.date.localeCompare(b.date));
      } else {
        next[existingIdx] = rebuilt;
      }
      return next;
    });
  }

  return {
    sessions,
    /* External setSessions — used by gist pull to overwrite local with
       remote canonical data. Either way the visible log stops being
       untouched seed, so consume the flag. */
    setSessions: (s) => {
      consumeSeed();
      setSessionsState(s);
    },
    addSession: (s) => {
      consumeSeed();
      setSessionsState((prev) =>
        [...prev, s].sort((a, b) => a.date.localeCompare(b.date))
      );
    },
    addSet,
    updateSet,
    deleteSet,
    restoreSet,
    /* Re-arms the seed flag — the user deliberately put seed back, so
       any subsequent fresh gist-create should still treat it as demo. */
    resetToSeed: () => {
      try { localStorage.setItem(SEED_FLAG_KEY, '1'); } catch { /* ignore */ }
      setSeedActiveState(true);
      setSessionsState(SEED_SESSIONS);
    },
    clearAll: () => {
      consumeSeed();
      setSessionsState([]);
    },
    seedActive,
  };
}

// ── pure helpers (exported for testing) ─────────────────────────────────

/** Per-set patch shape accepted by `updateSet`. */
export interface FlatSetPatch {
  name?: string;
  family?: Family;
  reps?: number;
  weight?: number;
}

/** Flattened representation of a session — one entry per set, in row order. */
export interface FlatSet {
  name: string;
  family: Family;
  reps: number;
  weight: number;
}

/** Flatten a session into the row-order list rendered by SetTable. */
export function flattenSession(session: Session): FlatSet[] {
  const out: FlatSet[] = [];
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      out.push({ name: ex.name, family: ex.family, reps: s.reps, weight: s.weight });
    }
  }
  return out;
}

/**
 * Rebuild ExerciseEntries from a flat list using the same consecutive
 * merge rule as `addSet`: a run of rows sharing a (case-insensitive
 * trimmed name AND family) becomes one ExerciseEntry. Either dimension
 * differing starts a new group.
 *
 * Why include family in the merge key (addSet uses name only): during
 * edit a user can change either field on any single row. If a 3-set
 * "bench / pushH" group has its middle row re-tagged as "bench / pushV",
 * collapsing on name alone would silently swallow the family change —
 * the row would re-render with pushH because the first group entry won
 * the family slot. Splitting on either field keeps the edit visible.
 */
export function regroupExercises(flat: FlatSet[]): ExerciseEntry[] {
  const out: ExerciseEntry[] = [];
  for (const row of flat) {
    const last = out[out.length - 1];
    const sameName =
      last && last.name.trim().toLowerCase() === row.name.trim().toLowerCase();
    const sameFamily = last && last.family === row.family;
    if (last && sameName && sameFamily) {
      last.sets.push({ reps: row.reps, weight: row.weight });
    } else {
      out.push({
        name: row.name,
        family: row.family,
        sets: [{ reps: row.reps, weight: row.weight }],
      });
    }
  }
  return out;
}

/**
 * Internal: locate the session for `date`, run `mutateFlat` over its
 * flattened rows, regroup, and stitch the session list back together.
 * Drops the session entirely when no rows remain.
 *
 * Returns the original list unchanged if the date is not found, so
 * stale callers (e.g. a row whose session was already removed) are
 * silent no-ops rather than throws.
 */
function applyFlatMutation(
  prev: Session[],
  date: string,
  mutateFlat: (flat: FlatSet[]) => FlatSet[],
): Session[] {
  const idx = prev.findIndex((s) => s.date === date);
  if (idx === -1) return prev;
  const flat = mutateFlat(flattenSession(prev[idx]));
  const next = prev.slice();
  if (flat.length === 0) {
    next.splice(idx, 1);
  } else {
    next[idx] = { date, exercises: regroupExercises(flat) };
  }
  return next;
}
