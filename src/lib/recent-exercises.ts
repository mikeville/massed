import type { Session } from './types';

/**
 * Most-recent unique exercise names, newest first. Used by every surface
 * that hosts an `ExerciseCombobox` (EditLedger's draft + entry rows,
 * SetTable's inline edit) so the typeahead's recents reflect the same
 * pool everywhere.
 *
 * Walks sessions back-to-front so the most recently logged name wins
 * the dedup race. Stops once `limit` distinct names have been collected.
 */
export function recentExerciseNames(sessions: Session[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    for (let j = sessions[i].exercises.length - 1; j >= 0; j--) {
      const name = sessions[i].exercises[j].name.trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        result.push(name);
        if (result.length >= limit) return result;
      }
    }
  }
  return result;
}
