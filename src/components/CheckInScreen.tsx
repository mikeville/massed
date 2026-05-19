import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Session, Period, FunFact } from '../lib/types';
import type { FlatSet, FlatSetPatch } from '../lib/useSessions';
import { totalWeight, filterByPeriod } from '../lib/totals';
import { RunOnViz } from './RunOnViz';
import { SetTable } from './SetTable';
import styles from './CheckInScreen.module.css';

/* The headline renders structured tokens straight from the FunFact —
   no string-splitting. `italic` is the punchline noun (intentional per
   entry, not heuristic on "last word"); `trail` is any upright copy
   that follows the noun (e.g. ", empty" after "Boeing 737"). */

/**
 * CheckInScreen
 * ─────────────
 * The "headline" check-in layout. Read-only — logging happens at /log.
 *
 * Control hierarchy:
 *  - View toggle (viz/table) + period dropdown sit in the masthead's
 *    top-right cluster. The view toggle is a segmented control (flush
 *    buttons under one border); the period dropdown shows its current
 *    value on the trigger and opens a popover styled to match
 *    FamilyChip / ExerciseCombobox.
 *  - + FAB rides next to those controls on desktop, and is the only
 *    ink-filled element in the cluster's gravity well.
 *  - Stats sit immediately under the masthead rule pair, above the
 *    editorial headline, so the numbers anchor before the prose.
 *  - The headline section has no fixed height; framer-motion's `layout`
 *    smooths the vertical shift that timeframe changes produce.
 */

export interface CheckInScreenProps {
  sessions: Session[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  fact: FunFact | null;
  /** Inline edit/delete from the table view. Omit any of the three to
   *  fall back to a read-only render — useful for any future "preview"
   *  callsite that shouldn't mutate. */
  onUpdateSet?: (date: string, flatIndex: number, patch: FlatSetPatch) => void;
  onDeleteSet?: (date: string, flatIndex: number) => void;
  onRestoreSet?: (date: string, flatIndex: number, row: FlatSet) => void;
  /** Hidden escape hatch — long-press the issue label to invoke. */
  onResetData: () => void;
}

// Long enough that an accidental press won't trigger reset, short enough
// that the gesture still feels intentional once you know it's there.
const LONG_PRESS_MS = 1200;

// Above ~500px the viz frame has room for taller reps without crowding
// the headline; below it the reps tighten to keep mobile vertical rhythm.
const DESKTOP_WIDTH_THRESHOLD = 500;
const DESKTOP_REP_HEIGHT = 42;
const MOBILE_REP_HEIGHT = 20;

// Subtle ease-out for the viz frame when the headline above it changes
// height. Short enough to read as a softened layout shift, not an
// animation sequence.
const SLIDE_TRANSITION = { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] as const };

const PERIOD_LABELS: Period[] = ['day', 'week', 'month', 'year', 'all'];

const PERIOD_DECK: Record<Period, string> = {
  day: 'today',
  week: 'this week',
  month: 'this month',
  year: 'this year',
  all: 'so far',
};

type ViewMode = 'viz' | 'table';
const VIEW_LABELS: ViewMode[] = ['viz', 'table'];

export function CheckInScreen({
  sessions,
  period,
  onPeriodChange,
  fact,
  onUpdateSet,
  onDeleteSet,
  onRestoreSet,
  onResetData,
}: CheckInScreenProps) {
  const filtered = useMemo(() => filterByPeriod(sessions, period), [sessions, period]);
  const total = useMemo(() => totalWeight(filtered), [filtered]);
  const sessionCount = filtered.length;
  const [view, setView] = useState<ViewMode>('viz');

  const vizRef = useRef<HTMLDivElement>(null);
  const [vizWidth, setVizWidth] = useState(0);
  useEffect(() => {
    const node = vizRef.current;
    if (!node) return;
    setVizWidth(Math.floor(node.getBoundingClientRect().width));
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setVizWidth(Math.floor(w));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Long-press the issue label as the hidden reset escape hatch.
  const longPressTimer = useRef<number | null>(null);
  const startLongPress = () => {
    longPressTimer.current = window.setTimeout(() => {
      if (window.confirm('reset to seed week? anything you logged will be cleared.')) {
        onResetData();
      }
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className={styles.checkin}>
      <div className={styles.checkinTop}>
        <span
          className={styles.checkinIssue}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
        >
          Massed
        </span>
        {/* The view toggle + period dropdown live above the rule pair —
            same masthead slot on every viewport. The route affordance
            (rendered at the App level) sits to the right of this
            cluster; the masthead's padding-right leaves room for it. */}
        <div className={styles.checkinTopRight}>
          <ViewToggle value={view} onChange={setView} />
          <PeriodMenu value={period} onChange={onPeriodChange} />
        </div>
      </div>
      <div className={styles.checkinRule} />
      <div className={styles.checkinRuleThin} />

      <div className={styles.checkinBody}>
        {/* Stats anchor under the masthead. No top rule — the masthead's
            own thin rule above them does that job. A single hairline
            below separates the numbers from the editorial headline. */}
        <div className={styles.checkinStats}>
          <Stat label="sessions" value={sessionCount.toString()} />
          <Stat label="pounds" value={formatKilo(total)} />
          <Stat label="reps" value={countReps(filtered).toString()} />
        </div>

        {/* Headline = the editorial caption for the viz — only in viz
            mode. Height is unconstrained; it changes instantly when the
            fact changes between timeframes. The viz below uses
            framer-motion's `layout="position"` to slide to its new
            spot rather than jump. */}
        {view === 'viz' && (
          <div className={styles.checkinHedSection}>
            <div className={styles.checkinEyebrow}>
              {PERIOD_DECK[period]}, you lifted
            </div>
            {fact ? (
              <h1 className={styles.checkinHed}>
                <span className={styles.checkinHedUpright}>{fact.tokens.lead} </span>
                {/* Span (not <em>) so no UA-default font-style sneaks in;
                    the .checkin__hed-italic rule is solely responsible
                    for the italic decision. */}
                <span className={styles.checkinHedItalic}>{fact.tokens.italic}</span>
                {fact.tokens.trail ? (
                  <span className={styles.checkinHedUpright}>{fact.tokens.trail}</span>
                ) : null}
              </h1>
            ) : (
              <h1 className={styles.checkinHed}>no work logged.</h1>
            )}
          </div>
        )}

        {/* `layout="position"` (not full `layout`) animates only x/y —
            the viz's own size jumps instantly to its new value, only
            its position slides. That keeps the viz from "expanding from
            the center" when its bounding box changes, and stops the
            whole frame from re-animating when only the headline's
            length changes. */}
        <motion.div
          layout="position"
          ref={vizRef}
          className={styles.checkinVizFrame}
          transition={SLIDE_TRANSITION}
        >
          {view === 'viz' && vizWidth > 0 && (
            <RunOnViz
              sessions={filtered}
              width={vizWidth}
              repHeight={vizWidth > DESKTOP_WIDTH_THRESHOLD ? DESKTOP_REP_HEIGHT : MOBILE_REP_HEIGHT}
            />
          )}
          {view === 'table' && (
            <SetTable
              sessions={filtered}
              onUpdateSet={onUpdateSet}
              onDeleteSet={onDeleteSet}
              onRestoreSet={onRestoreSet}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* PeriodMenu — the timeframe selector. Modeled on FamilyChip's popover
   so it inherits the project's dropdown shape (paper bg, ink border,
   soft drop shadow, click-outside / Escape dismiss). The trigger shows
   the current value's deck label so state is legible at rest. */
function PeriodMenu({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.checkinPeriod}>
      <button
        type="button"
        className={styles.checkinPeriodTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{PERIOD_DECK[value]}</span>
        <span aria-hidden className={styles.checkinPeriodCaret}>▾</span>
      </button>
      {open && (
        <ul className={styles.checkinPeriodPopover} role="listbox">
          {PERIOD_LABELS.map((p) => (
            <li key={p}>
              <button
                type="button"
                role="option"
                aria-selected={p === value}
                className={
                  p === value
                    ? `${styles.checkinPeriodOption} ${styles.checkinPeriodOptionActive}`
                    : styles.checkinPeriodOption
                }
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
              >
                {PERIOD_DECK[p]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className={styles.checkinView}>
      {VIEW_LABELS.map((v) => (
        <button
          key={v}
          type="button"
          className={v === value ? styles.isActive : ''}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.checkinStat}>
      <b>{value}</b>
      {label}
    </div>
  );
}

function countReps(sessions: Session[]): number {
  let n = 0;
  for (const s of sessions)
    for (const ex of s.exercises) for (const set of ex.sets) n += set.reps;
  return n;
}

// Compact weight readout for the stats row: 1,234 → "1.2k", 999 → "999".
// Keeps the stats line single-row even when the total runs into millions.
function formatKilo(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

