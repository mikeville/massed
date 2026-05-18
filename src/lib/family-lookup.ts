import type { Family } from './types';

/**
 * Map of common exercise names to their movement family.
 *
 * Keys are normalized: lowercase, equipment prefixes ("barbell", "db",
 * "dumbbell", "kettlebell", etc.) stripped, whitespace collapsed. The
 * intent is that a user can type "Bench", "DB Bench Press", or
 * "barbell bench press" and all three resolve to `pushH`.
 *
 * Coverage targets the most-logged exercises across a serious lifter's
 * program — common compounds, accessories, and their plural/variant
 * spellings. Unknown names return null so callers can decide the
 * fallback (LogScreen prompts the user with a 7-tile family chooser).
 */

export const FAMILY_LOOKUP: Record<string, Family> = {
  // hinge — hip-hinge dominant
  deadlift: 'hinge',
  deadlifts: 'hinge',
  'conventional deadlift': 'hinge',
  'sumo deadlift': 'hinge',
  'trap bar deadlift': 'hinge',
  'deficit deadlift': 'hinge',
  'block pull': 'hinge',
  'rack pull': 'hinge',
  rdl: 'hinge',
  rdls: 'hinge',
  'romanian deadlift': 'hinge',
  'romanian deadlifts': 'hinge',
  'stiff leg deadlift': 'hinge',
  'stiff-leg deadlift': 'hinge',
  'stiff legged deadlift': 'hinge',
  'single leg rdl': 'hinge',
  'single-leg rdl': 'hinge',
  'good morning': 'hinge',
  'good mornings': 'hinge',
  'hip thrust': 'hinge',
  'hip thrusts': 'hinge',
  'glute bridge': 'hinge',
  'glute bridges': 'hinge',
  'kettlebell swing': 'hinge',
  'kb swing': 'hinge',
  swing: 'hinge',
  swings: 'hinge',
  'back extension': 'hinge',
  hyperextension: 'hinge',
  hyperextensions: 'hinge',

  // squat — knee-dominant
  squat: 'squat',
  squats: 'squat',
  'back squat': 'squat',
  'back squats': 'squat',
  'front squat': 'squat',
  'front squats': 'squat',
  'goblet squat': 'squat',
  'split squat': 'squat',
  'bulgarian split squat': 'squat',
  'box squat': 'squat',
  'pause squat': 'squat',
  'tempo squat': 'squat',
  'zercher squat': 'squat',
  'pistol squat': 'squat',
  'sissy squat': 'squat',
  lunge: 'squat',
  lunges: 'squat',
  'walking lunge': 'squat',
  'walking lunges': 'squat',
  'reverse lunge': 'squat',
  'reverse lunges': 'squat',
  'step up': 'squat',
  'step ups': 'squat',
  'step-up': 'squat',
  'step-ups': 'squat',
  'leg press': 'squat',
  'hack squat': 'squat',

  // pushH — horizontal push
  bench: 'pushH',
  'bench press': 'pushH',
  'flat bench': 'pushH',
  'flat bench press': 'pushH',
  'incline bench': 'pushH',
  'incline bench press': 'pushH',
  'incline press': 'pushH',
  'decline bench': 'pushH',
  'decline bench press': 'pushH',
  'decline press': 'pushH',
  'close grip bench': 'pushH',
  'close-grip bench': 'pushH',
  'wide grip bench': 'pushH',
  'wide-grip bench': 'pushH',
  'floor press': 'pushH',
  'pin press': 'pushH',
  'machine chest press': 'pushH',
  'chest press': 'pushH',
  pushup: 'pushH',
  pushups: 'pushH',
  'push-up': 'pushH',
  'push-ups': 'pushH',
  'push up': 'pushH',
  'push ups': 'pushH',
  dip: 'pushH',
  dips: 'pushH',
  'weighted dip': 'pushH',
  'weighted dips': 'pushH',

  // pullH — horizontal pull
  row: 'pullH',
  rows: 'pullH',
  'bent over row': 'pullH',
  'bent-over row': 'pullH',
  'pendlay row': 'pullH',
  'seal row': 'pullH',
  't-bar row': 'pullH',
  'tbar row': 'pullH',
  'cable row': 'pullH',
  'seated row': 'pullH',
  'chest supported row': 'pullH',
  'chest-supported row': 'pullH',
  'one arm row': 'pullH',
  'single arm row': 'pullH',
  'inverted row': 'pullH',
  'face pull': 'pullH',
  'face pulls': 'pullH',
  'rear delt fly': 'pullH',
  'rear-delt fly': 'pullH',

  // pushV — vertical push
  ohp: 'pushV',
  'overhead press': 'pushV',
  'shoulder press': 'pushV',
  'seated shoulder press': 'pushV',
  'standing shoulder press': 'pushV',
  'machine shoulder press': 'pushV',
  'military press': 'pushV',
  'push press': 'pushV',
  'arnold press': 'pushV',
  'landmine press': 'pushV',
  'viking press': 'pushV',

  // pullV — vertical pull
  pullup: 'pullV',
  pullups: 'pullV',
  'pull-up': 'pullV',
  'pull-ups': 'pullV',
  'pull up': 'pullV',
  'pull ups': 'pullV',
  'weighted pullup': 'pullV',
  'weighted pull-up': 'pullV',
  'neutral grip pullup': 'pullV',
  'neutral grip pull-up': 'pullV',
  'wide grip pullup': 'pullV',
  'wide grip pull-up': 'pullV',
  chinup: 'pullV',
  chinups: 'pullV',
  'chin-up': 'pullV',
  'chin-ups': 'pullV',
  'chin up': 'pullV',
  'chin ups': 'pullV',
  'lat pulldown': 'pullV',
  'lat pulldowns': 'pullV',
  pulldown: 'pullV',
  pulldowns: 'pullV',
  'machine pulldown': 'pullV',
  'wide grip pulldown': 'pullV',
  'neutral grip pulldown': 'pullV',

  // iso — single-joint
  curl: 'iso',
  curls: 'iso',
  'bicep curl': 'iso',
  'bicep curls': 'iso',
  'biceps curl': 'iso',
  'biceps curls': 'iso',
  'hammer curl': 'iso',
  'hammer curls': 'iso',
  'preacher curl': 'iso',
  'preacher curls': 'iso',
  'concentration curl': 'iso',
  'concentration curls': 'iso',
  'spider curl': 'iso',
  'spider curls': 'iso',
  'incline curl': 'iso',
  'incline curls': 'iso',
  'cable curl': 'iso',
  'cable curls': 'iso',
  'ez bar curl': 'iso',
  'ez-bar curl': 'iso',
  'tricep extension': 'iso',
  'tricep extensions': 'iso',
  'triceps extension': 'iso',
  'triceps extensions': 'iso',
  'overhead tricep extension': 'iso',
  'overhead triceps extension': 'iso',
  'tricep pushdown': 'iso',
  'tricep pushdowns': 'iso',
  'triceps pushdown': 'iso',
  'triceps pushdowns': 'iso',
  pushdown: 'iso',
  pushdowns: 'iso',
  skullcrusher: 'iso',
  skullcrushers: 'iso',
  kickback: 'iso',
  kickbacks: 'iso',
  'tricep kickback': 'iso',
  'tricep kickbacks': 'iso',
  'lateral raise': 'iso',
  'lateral raises': 'iso',
  'side raise': 'iso',
  'side raises': 'iso',
  'front raise': 'iso',
  'front raises': 'iso',
  'rear delt raise': 'iso',
  'reverse fly': 'iso',
  'pec deck': 'iso',
  'pec fly': 'iso',
  'chest fly': 'iso',
  'cable fly': 'iso',
  'cable crossover': 'iso',
  fly: 'iso',
  flies: 'iso',
  'calf raise': 'iso',
  'calf raises': 'iso',
  'seated calf raise': 'iso',
  'seated calf raises': 'iso',
  'donkey calf raise': 'iso',
  'standing calf raise': 'iso',
  shrug: 'iso',
  shrugs: 'iso',
  plank: 'iso',
  planks: 'iso',
  'leg curl': 'iso',
  'leg curls': 'iso',
  'lying leg curl': 'iso',
  'seated leg curl': 'iso',
  'leg extension': 'iso',
  'leg extensions': 'iso',
  'ab wheel': 'iso',
  'ab wheel rollout': 'iso',
  'cable crunch': 'iso',
  crunch: 'iso',
  crunches: 'iso',
  'sit up': 'iso',
  'sit ups': 'iso',
  'sit-up': 'iso',
  'sit-ups': 'iso',
};

const EQUIPMENT_PREFIXES = [
  'barbell',
  'bb',
  'dumbbell',
  'db',
  'kettlebell',
  'kb',
  'cable',
  'machine',
  'smith',
];

/** Normalize an exercise name for lookup. */
function normalize(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const prefix of EQUIPMENT_PREFIXES) {
    if (s.startsWith(prefix + ' ')) {
      s = s.slice(prefix.length + 1);
      break;
    }
  }
  return s;
}

/**
 * Infer the movement family from a free-text exercise name.
 * Returns null when the name isn't recognized — callers decide the fallback.
 */
export function inferFamily(exerciseName: string): Family | null {
  const key = normalize(exerciseName);
  if (key in FAMILY_LOOKUP) return FAMILY_LOOKUP[key];
  return null;
}

/**
 * Suggest exercise names for a given typed query, drawing from both the
 * lookup table and the user's recent exercise names.
 *
 * - Empty query: returns the user's recents, capped at `limit`.
 * - Non-empty query: returns names that contain the query as a substring.
 *   Prefix matches sort first, then by length (shorter = closer match),
 *   then alphabetically.
 *
 * Recents are merged in (deduped, case-insensitive) and outranked by
 * exact prefix matches from the lookup. The returned names use the
 * casing of whichever source was first seen — recents preserve the
 * user's preferred spelling.
 */
export function suggestExercises(
  query: string,
  recents: string[],
  limit: number
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return recents.slice(0, limit);

  const recentsLower = new Set(recents.map((n) => n.toLowerCase()));
  const candidates: string[] = [...recents];
  for (const name of Object.keys(FAMILY_LOOKUP)) {
    if (!recentsLower.has(name)) candidates.push(name);
  }

  const matches = candidates.filter((n) => n.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();
    const aPrefix = aLow.startsWith(q);
    const bPrefix = bLow.startsWith(q);
    if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
    if (a.length !== b.length) return a.length - b.length;
    return aLow.localeCompare(bLow);
  });
  return matches.slice(0, limit);
}
