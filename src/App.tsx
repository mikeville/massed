import { useMemo, useState } from 'react';
import { Route, Router, Switch, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useSessions } from './lib/useSessions';
import { useGistSync } from './lib/useGistSync';
import { AdminScreen } from './components/AdminScreen';
import { CheckInScreen } from './components/CheckInScreen';
import { LogScreen } from './components/LogScreen';
import { SettingsScreen } from './components/SettingsScreen';
import type { Period, Session } from './lib/types';
import { totalWeight, filterByPeriod } from './lib/totals';
import { useStableFact } from './lib/useStableFact';
import styles from './App.module.css';

/**
 * Pick the initial period so an empty view isn't the first thing the user
 * sees on cold load. Prefer the smallest period that actually contains
 * data, escalating outward. `day` is deliberately skipped — it's too narrow
 * a default even when today has sets, so the floor is `week`.
 */
function pickInitialPeriod(sessions: Session[]): Period {
  const candidates: Period[] = ['week', 'month', 'year', 'all'];
  for (const p of candidates) {
    if (filterByPeriod(sessions, p).length > 0) return p;
  }
  return 'week';
}

export function App() {
  const {
    sessions,
    setSessions,
    addSet,
    updateSet,
    deleteSet,
    restoreSet,
    resetToSeed,
    seedActive,
  } = useSessions();
  const sync = useGistSync(sessions, setSessions, seedActive);
  const [period, setPeriod] = useState<Period>(() => pickInitialPeriod(sessions));

  const total = useMemo(
    () => totalWeight(filterByPeriod(sessions, period)),
    [sessions, period]
  );

  /* useStableFact caches by (period, totalRounded) so reload and tab
     return give the same fact. It re-rolls when the total changes
     meaningfully, the period changes, or the 24h TTL elapses. */
  const fact = useStableFact(period, total);

  return (
    <Router base={ROUTER_BASE}>
      <main className={styles.app}>
        <div className={styles.appColumn}>
          <RouteAffordance />
          <Switch>
            <Route path="/">
              <CheckInScreen
                sessions={sessions}
                period={period}
                onPeriodChange={setPeriod}
                fact={fact}
                onUpdateSet={updateSet}
                onDeleteSet={deleteSet}
                onRestoreSet={restoreSet}
                onResetData={resetToSeed}
              />
            </Route>
            <Route path="/log">
              <LogScreen
                sessions={sessions}
                syncConfigured={sync.config !== null}
                seedActive={seedActive}
                onSave={addSet}
              />
            </Route>
            <Route path="/settings">
              <SettingsScreen sync={sync} />
            </Route>
            <Route path="/admin">
              <AdminScreen />
            </Route>
          </Switch>
        </div>
      </main>
    </Router>
  );
}

/* When this app is served as a sub-path of another site (e.g.
   /massed/), Wouter needs to strip that prefix so the route patterns
   below stay rooted at "/". Detected at runtime from the page URL,
   not build-time, because the same bundle serves both contexts —
   standalone (root) and proxied (sub-path). */
const ROUTER_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const m = window.location.pathname.match(/^\/massed(?=\/|$)/);
  return m ? m[0] : '';
})();

/* RouteAffordance — one element that lives across route changes so the
   masthead never sees an unmount/remount flicker. On `/` it reads as
   the ink-filled "+" FAB; on `/log` as a bare "×". Rotation walks
   through 765° (2 full turns + 45°) while fill + border + color
   crossfade; reversing the route walks back the same way. */
// Mirror of --c-ink / --c-paper. framer-motion needs JS color strings
// to interpolate the fill, so these are duplicated by necessity.
// If tokens.css changes, change here too.
const AFFORDANCE_INK = '#14130f';
const AFFORDANCE_PAPER = '#faecec';
const AFFORDANCE_FADE = { duration: 0.45, ease: 'easeInOut' } as const;

function RouteAffordance() {
  const [location, setLocation] = useLocation();
  /* Settings and admin are URL-only and stand apart from the
     check-in / log loop; suppressing the FAB there avoids a confusing
     third destination. */
  if (location === '/settings' || location === '/admin') return null;
  const isLog = location === '/log';
  const target = isLog ? '/' : '/log';
  const label = isLog ? 'back to check-in' : 'log a set';

  return (
    <motion.a
      href={target}
      onClick={(e) => {
        e.preventDefault();
        setLocation(target);
      }}
      aria-label={label}
      className={styles.appAffordance}
      initial={false}
      animate={{
        rotate: isLog ? 765 : 0,
        backgroundColor: isLog ? `${AFFORDANCE_INK}00` : AFFORDANCE_INK,
        borderColor: isLog ? `${AFFORDANCE_INK}00` : AFFORDANCE_INK,
        color: isLog ? AFFORDANCE_INK : AFFORDANCE_PAPER,
        fontSize: isLog ? 28 : 22,
      }}
      transition={{
        rotate: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
        backgroundColor: AFFORDANCE_FADE,
        borderColor: AFFORDANCE_FADE,
        color: AFFORDANCE_FADE,
        fontSize: AFFORDANCE_FADE,
      }}
    >
      +
    </motion.a>
  );
}
