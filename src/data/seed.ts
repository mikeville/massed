import type { Session } from '../lib/types';

/**
 * Seed data — Mike's actual training log, Jan 12 – May 22, 2026.
 *
 * This file is the *bundled* snapshot — what cold-loads instantly when
 * a visitor first hits the app, and what falls back if the remote-seed
 * fetch (see `remoteSeed.ts`) fails. The living demo source on the
 * deployed site is a public gist; this file is just the last-known-good
 * snapshot baked into the build.
 *
 * Conventions applied while structuring the raw log:
 *
 * - Bodyweight on pull-ups and dips is logged as 150 lb (current
 *   bodyweight), so unweighted sets contribute to the total-weight
 *   headline.
 * - Machine "block" weights resolve as: 1 block = 5 lb, each additional
 *   block = 10 lb. So 1=5, 2=15, 3=25, 4=35.
 * - Soccer drills, form-study notes, and other non-resistance work were
 *   dropped — the schema only models reps × weight.
 * - Exercise names canonicalized via `family-lookup.ts`. Note dips
 *   resolve to pushH per the project's family taxonomy.
 * - Empty rest days produce no Session.
 * - On days where sets were logged in interleaved order (e.g.
 *   curl/bench/curl/bench), entries are preserved chronologically as
 *   separate ExerciseEntry objects — matching what `addSet` produces.
 */

export const SEED_SESSIONS: Session[] = [
  {
    date: '2026-01-12',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 5, weight: 105 },
          { reps: 3, weight: 105 },
        ],
      },
    ],
  },
  {
    date: '2026-01-13',
    exercises: [
      {
        name: 'pull-ups',
        family: 'pullV',
        sets: [
          { reps: 10, weight: 150 },
          { reps: 10, weight: 150 },
        ],
      },
    ],
  },
  {
    date: '2026-01-14',
    exercises: [
      {
        name: 'curls',
        family: 'iso',
        sets: [{ reps: 10, weight: 30 }],
      },
    ],
  },
  {
    date: '2026-01-15',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 6, weight: 105 },
          { reps: 6, weight: 105 },
        ],
      },
    ],
  },
  {
    date: '2026-01-16',
    exercises: [
      {
        name: 'pull-ups',
        family: 'pullV',
        sets: [
          { reps: 10, weight: 150 },
          { reps: 10, weight: 150 },
        ],
      },
    ],
  },
  {
    date: '2026-01-19',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 7, weight: 105 },
          { reps: 7, weight: 105 },
        ],
      },
    ],
  },
  {
    // Source: "squat 1x 45, 2x 75" — reps unspecified, assumed 10 each
    // to match the pattern of every other squat entry in the log.
    date: '2026-01-22',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 45 },
          { reps: 10, weight: 75 },
          { reps: 10, weight: 75 },
        ],
      },
    ],
  },
  {
    date: '2026-01-29',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 5, weight: 105 },
          { reps: 6, weight: 105 },
        ],
      },
    ],
  },
  {
    date: '2026-02-12',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 6, weight: 105 },
          { reps: 6, weight: 105 },
          { reps: 6, weight: 105 },
        ],
      },
    ],
  },
  {
    date: '2026-02-26',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
        ],
      },
    ],
  },
  {
    date: '2026-02-27',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 25 },
          { reps: 10, weight: 25 },
          { reps: 10, weight: 25 },
        ],
      },
    ],
  },
  {
    date: '2026-03-02',
    exercises: [
      {
        name: 'shoulder press',
        family: 'pushV',
        sets: [
          { reps: 10, weight: 25 },
          { reps: 10, weight: 25 },
          { reps: 10, weight: 25 },
        ],
      },
    ],
  },
  {
    date: '2026-03-06',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
          { reps: 2, weight: 95 },
        ],
      },
    ],
  },
  {
    // "8blb" in source — interpreted as 85 lb, matching the 3/23 entry
    // which spells out the same load as "85lb".
    date: '2026-03-13',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
        ],
      },
      {
        name: 'pull-ups',
        family: 'pullV',
        sets: [
          { reps: 6, weight: 150 },
          { reps: 6, weight: 150 },
          { reps: 6, weight: 150 },
        ],
      },
    ],
  },
  {
    date: '2026-03-16',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
        ],
      },
    ],
  },
  {
    date: '2026-03-23',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 8, weight: 85 },
        ],
      },
      {
        name: 'chest fly',
        family: 'iso',
        sets: [{ reps: 10, weight: 35 }],
      },
      {
        name: 'lat pulldown',
        family: 'pullV',
        sets: [{ reps: 10, weight: 35 }],
      },
    ],
  },
  {
    date: '2026-03-24',
    exercises: [
      {
        name: 'curls',
        family: 'iso',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
        ],
      },
    ],
  },
  {
    // Circuit (squat → leg press → deadlift) × 3 in the source; flattened
    // here into grouped ExerciseEntries — matches the prior seed convention
    // and reads more naturally in the log table.
    date: '2026-03-26',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
        ],
      },
      {
        name: 'leg press',
        family: 'squat',
        sets: [
          { reps: 10, weight: 35 },
          { reps: 10, weight: 35 },
          { reps: 10, weight: 35 },
        ],
      },
      {
        name: 'deadlift',
        family: 'hinge',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
        ],
      },
    ],
  },
  {
    date: '2026-03-27',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
        ],
      },
      {
        name: 'chest fly',
        family: 'iso',
        sets: [
          { reps: 6, weight: 35 },
          { reps: 3, weight: 35 },
          { reps: 1, weight: 35 },
        ],
      },
    ],
  },
  {
    date: '2026-04-27',
    exercises: [
      {
        name: 'curls',
        family: 'iso',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 6, weight: 65 },
          { reps: 7, weight: 65 },
        ],
      },
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 5, weight: 95 },
          { reps: 6, weight: 95 },
          { reps: 4, weight: 95 },
        ],
      },
    ],
  },
  {
    date: '2026-04-28',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
        ],
      },
      {
        name: 'deadlift',
        family: 'hinge',
        sets: [
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
        ],
      },
    ],
  },
  {
    date: '2026-04-29',
    exercises: [
      {
        name: 'shoulder press',
        family: 'pushV',
        sets: [
          { reps: 6, weight: 65 },
          { reps: 6, weight: 65 },
          { reps: 5, weight: 65 },
        ],
      },
      {
        name: 'pull-ups',
        family: 'pullV',
        sets: [
          { reps: 5, weight: 150 },
          { reps: 5, weight: 150 },
          { reps: 5, weight: 150 },
        ],
      },
    ],
  },
  {
    // Source logged in interleaved order curl/bench × 3 — preserved as
    // separate ExerciseEntry objects.
    date: '2026-05-04',
    exercises: [
      { name: 'curls', family: 'iso', sets: [{ reps: 7, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 7, weight: 105 }] },
      { name: 'curls', family: 'iso', sets: [{ reps: 7, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 7, weight: 105 }] },
      { name: 'curls', family: 'iso', sets: [{ reps: 7, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 6, weight: 105 }] },
    ],
  },
  {
    // Interleaved deadlift/squat.
    date: '2026-05-06',
    exercises: [
      { name: 'deadlift', family: 'hinge', sets: [{ reps: 10, weight: 65 }] },
      { name: 'back squat', family: 'squat', sets: [{ reps: 7, weight: 65 }] },
      { name: 'deadlift', family: 'hinge', sets: [{ reps: 11, weight: 65 }] },
      { name: 'back squat', family: 'squat', sets: [{ reps: 7, weight: 65 }] },
      { name: 'deadlift', family: 'hinge', sets: [{ reps: 10, weight: 65 }] },
      { name: 'back squat', family: 'squat', sets: [{ reps: 10, weight: 65 }] },
    ],
  },
  {
    date: '2026-05-07',
    exercises: [
      { name: 'dips', family: 'pushH', sets: [{ reps: 10, weight: 150 }] },
      {
        name: 'shoulder press',
        family: 'pushV',
        sets: [
          { reps: 7, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 3, weight: 65 },
          { reps: 8, weight: 65 },
          { reps: 2, weight: 65 },
        ],
      },
    ],
  },
  {
    date: '2026-05-12',
    exercises: [
      { name: 'curls', family: 'iso', sets: [{ reps: 10, weight: 65 }] },
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 8, weight: 105 },
          { reps: 10, weight: 105 },
          { reps: 8, weight: 105 },
          { reps: 11, weight: 105 },
          { reps: 10, weight: 105 },
        ],
      },
    ],
  },
  {
    // Interleaved dips/pull-ups.
    date: '2026-05-15',
    exercises: [
      { name: 'dips', family: 'pushH', sets: [{ reps: 10, weight: 150 }] },
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 10, weight: 150 }] },
      { name: 'dips', family: 'pushH', sets: [{ reps: 10, weight: 150 }] },
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 5, weight: 150 }] },
      { name: 'dips', family: 'pushH', sets: [{ reps: 10, weight: 150 }] },
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 5, weight: 150 }] },
    ],
  },
  {
    // Interleaved curl/bench.
    date: '2026-05-18',
    exercises: [
      { name: 'curls', family: 'iso', sets: [{ reps: 10, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 8, weight: 105 }] },
      { name: 'curls', family: 'iso', sets: [{ reps: 10, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 7, weight: 105 }] },
      { name: 'curls', family: 'iso', sets: [{ reps: 8, weight: 65 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 5, weight: 105 }] },
    ],
  },
  {
    // Interleaved pull-up/bench.
    date: '2026-05-22',
    exercises: [
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 10, weight: 150 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 10, weight: 105 }] },
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 8, weight: 150 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 8, weight: 105 }] },
      { name: 'pull-ups', family: 'pullV', sets: [{ reps: 8, weight: 150 }] },
      { name: 'bench', family: 'pushH', sets: [{ reps: 6, weight: 105 }] },
    ],
  },
];
