/**
 * Core domain types.
 *
 * Resistance training is logged as Sessions, which contain Exercises,
 * which contain Sets. A Set is the atom of work: a number of reps at
 * a given weight.
 *
 * The viz reduces 'exercise' to 'family' for visual encoding (one of
 * seven movement patterns). The exercise name is preserved separately
 * so the log shows e.g. "incline bench" while the viz shows the
 * horizontal-push texture.
 */

/** Movement pattern — drives the visual texture. */
export type Family =
  | 'hinge'   // deadlift, RDL, good morning
  | 'squat'   // back squat, front squat, lunge, leg press
  | 'pushH'   // bench, incline bench, dip, pushup
  | 'pullH'   // row, face pull, seal row
  | 'pushV'   // OHP, push press, DB shoulder press
  | 'pullV'   // pullup, chinup, lat pulldown
  | 'iso';    // curl, lateral raise, calf raise, tricep ext

/** A single set: reps performed at a single weight. */
export interface SetEntry {
  reps: number;
  /** Weight in pounds for v1. Per-rep weights deferred. */
  weight: number;
}

/** All sets of a given exercise within a session. */
export interface ExerciseEntry {
  /** Display name as the user logs it: "bench", "incline DB bench", etc. */
  name: string;
  /** Movement pattern — drives the texture in the viz. */
  family: Family;
  sets: SetEntry[];
}

/** A training session — typically one calendar day. */
export interface Session {
  /** ISO date string, YYYY-MM-DD. */
  date: string;
  exercises: ExerciseEntry[];
}

/** What scope is the user looking at right now? */
export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

/**
 * Structured tokens for a comparison phrase. The renderer places these
 * three slots into the headline directly — no string-splitting, no
 * "italicize the last word" heuristic. The italic slot is the punchline
 * noun for the moment kind; trail is any upright copy that follows it
 * (e.g. ", empty" after "Boeing 737").
 */
export interface ComparisonTokens {
  /** Upright (uppercase, display sans) portion before the italic. */
  lead: string;
  /** Italic serif portion — the punchline noun. */
  italic: string;
  /** Optional upright tail after the italic. */
  trail?: string;
}

/** A computed fun fact about a weight total. */
export interface FunFact {
  /** Structured headline tokens — see ComparisonTokens. */
  tokens: ComparisonTokens;
  /** Category for novelty rotation: "vehicle", "animal", etc. */
  category: FactCategory;
  /** The reference object's weight (lb) used to compute the comparison. */
  referenceWeight: number;
}

export type FactCategory =
  | 'vehicle'
  | 'animal'
  | 'object'
  | 'food'
  | 'historical'
  | 'mundane';
