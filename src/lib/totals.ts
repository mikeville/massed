import type { Session, Period } from './types';

/**
 * Sum total weight lifted (lb) across a list of sessions.
 * Calculation: for each set, add reps × weight.
 */
export function totalWeight(sessions: Session[]): number {
  let total = 0;
  for (const sess of sessions) {
    for (const ex of sess.exercises) {
      for (const set of ex.sets) {
        total += set.reps * set.weight;
      }
    }
  }
  return total;
}

// Rolling window sizes per period. Calendar-aligned weeks/months would
// surprise the user — "this week" should mean the last 7 days, not the
// last Mon–Sun.
const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

/**
 * Filter sessions to a given period, anchored at `now`.
 * `all` returns everything; every other period is a rolling window
 * ending at `now`, inclusive.
 */
export function filterByPeriod(
  sessions: Session[],
  period: Period,
  now: Date = new Date()
): Session[] {
  if (period === 'all') return sessions;

  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (PERIOD_DAYS[period] - 1));

  return sessions.filter((s) => {
    const d = new Date(s.date + 'T00:00:00');
    return d >= cutoff && d <= now;
  });
}
