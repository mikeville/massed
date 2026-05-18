import type { Session } from '../lib/types';

/**
 * Seed data — Mike's actual training log, Jan 12 – Apr 29, 2026.
 *
 * Conventions applied while structuring the raw log:
 *
 * - Bodyweight on pull-ups is logged as 150 lb (current bodyweight),
 *   so unweighted pull-up sets contribute to the total-weight headline.
 * - Machine "block" weights resolve as: 1 block = 5 lb, each additional
 *   block = 10 lb. So 1=5, 2=15, 3=25, 4=35.
 * - Soccer drills, form-study notes, and other non-resistance work were
 *   dropped — the schema only models reps × weight.
 * - Exercise names canonicalized via `family-lookup.ts`.
 * - Empty rest days produce no Session.
 */

export const SEED_SESSIONS: Session[] = [
  {
    date: '2026-01-12',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 5, weight: 135 },
          { reps: 3, weight: 135 },
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
          { reps: 6, weight: 135 },
          { reps: 6, weight: 135 },
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
          { reps: 7, weight: 135 },
          { reps: 7, weight: 135 },
        ],
      },
    ],
  },
  {
    date: '2026-01-22',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 45 },
          { reps: 10, weight: 95 },
          { reps: 10, weight: 95 },
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
          { reps: 5, weight: 135 },
          { reps: 6, weight: 135 },
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
          { reps: 6, weight: 135 },
          { reps: 6, weight: 135 },
          { reps: 6, weight: 135 },
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
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
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
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
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
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 },
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
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 10, weight: 65 },
          { reps: 2, weight: 95 },
        ],
      },
    ],
  },
  {
    date: '2026-03-13',
    exercises: [
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
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
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
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
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
          { reps: 8, weight: 115 },
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
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
        ],
      },
    ],
  },
  {
    date: '2026-03-26',
    exercises: [
      {
        name: 'back squat',
        family: 'squat',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
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
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
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
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
          { reps: 10, weight: 115 },
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
          { reps: 10, weight: 85 },
          { reps: 6, weight: 85 },
          { reps: 7, weight: 85 },
        ],
      },
      {
        name: 'bench',
        family: 'pushH',
        sets: [
          { reps: 5, weight: 125 },
          { reps: 6, weight: 125 },
          { reps: 4, weight: 125 },
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
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
        ],
      },
      {
        name: 'deadlift',
        family: 'hinge',
        sets: [
          { reps: 10, weight: 85 },
          { reps: 10, weight: 85 },
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
          { reps: 6, weight: 85 },
          { reps: 6, weight: 85 },
          { reps: 5, weight: 85 },
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
];
