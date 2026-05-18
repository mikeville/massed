import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import styles from './SwipeableSetRow.module.css';

/**
 * SwipeableSetRow — a row wrapper that surfaces edit + delete actions
 * via the conventions users already know:
 *
 *   - Desktop (hover-capable pointers): a hairline ⟪✎ ⌫⟫ pair fades in
 *     at the right edge on hover or keyboard focus, overlaying the
 *     row's total column. No layout shift. Linear / Notion / GitHub.
 *
 *   - Touch (no-hover pointers): swipe the row leftward to reveal the
 *     same pair. Snaps open past 50% or on a quick flick. Tapping the
 *     row content (or any other row) snaps it closed. iOS Mail.
 *
 * The component is purely a presentational shell — `children` renders
 * the actual row (a static SetRow), `onEdit`/`onDelete` are wired by
 * the caller. Tap-to-edit on the row content remains the primary
 * action; the icons are the safer surface for the destructive one.
 *
 * Why framer-motion's drag rather than custom pointer math: spring
 * snap-back, velocity-aware dismissal, and direction locking (drag="x"
 * passes vertical scroll through) are already correct out of the box.
 * The library is already in the bundle for the route affordance.
 */

const ACTIONS_WIDTH = 88;
const SPRING = { type: 'spring', stiffness: 600, damping: 45 } as const;

export interface SwipeableSetRowProps {
  label: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}

export function SwipeableSetRow({
  label,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
  children,
}: SwipeableSetRowProps) {
  // Only enable drag on devices without hover. matchMedia is read once
  // at mount — a hybrid laptop that gains/loses a touchscreen mid-
  // session won't update, but the cost of that edge case is zero
  // (drag still works via the same gesture on touch screens that
  // report `hover: hover`).
  const canDrag = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches,
    []
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    const passedThreshold = -info.offset.x > ACTIONS_WIDTH / 2;
    const flickedLeft = info.velocity.x < -300;
    onOpenChange(passedThreshold || flickedLeft);
  }

  return (
    <div
      className={`${styles.shell} ${isOpen ? styles.shellOpen : ''}`}
      data-swipe-row
    >
      <motion.div
        className={styles.surface}
        /* role="button" + tabIndex make the row a keyboard target —
           Enter/Space invoke edit, Delete invokes delete. Mouse + touch
           don't bind a primary action to a bare tap on the row content
           anymore: edit lives behind the pencil, delete behind trash.
           That keeps a casual tap from triggering iOS's input-focus
           zoom and prevents accidental edits when the user really
           meant to scroll. */
        role="button"
        tabIndex={0}
        aria-label={`actions for ${label}`}
        drag={canDrag ? 'x' : false}
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={0.05}
        dragMomentum={false}
        animate={{ x: isOpen ? -ACTIONS_WIDTH : 0 }}
        transition={SPRING}
        onDragEnd={handleDragEnd}
        onClick={() => {
          // A tap on an already-open row closes it (iOS Mail).
          // Otherwise: no-op — edit/delete are explicit choices via
          // the icons, not a side-effect of touching the row.
          if (isOpen) onOpenChange(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit();
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            onDelete();
          }
        }}
      >
        {children}
      </motion.div>

      {/* Actions live as siblings of the dragging surface so they don't
          translate along with it. Two buttons, individually labeled —
          screen readers see "edit X" and "delete X" announced when
          focused, regardless of the visual reveal state. */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onEdit}
          tabIndex={-1}
          aria-label={`edit ${label}`}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionDelete}`}
          onClick={onDelete}
          tabIndex={-1}
          aria-label={`delete ${label}`}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook: track which row in a list is open, with the canonical
 * "tap outside closes" behavior. Returns a getter (is this key open?)
 * and a setter (pass null to close everything).
 */
export function useSingleOpenRow(): {
  isOpen: (key: string) => boolean;
  setOpen: (key: string | null) => void;
} {
  const [open, setOpenState] = useState<string | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      const target = e.target as Element | null;
      if (!target?.closest('[data-swipe-row]')) setOpenState(null);
    }
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [open]);

  return {
    isOpen: (key) => openRef.current === key,
    setOpen: (key) => setOpenState(key),
  };
}

/* ── Icons ───────────────────────────────────────────────────────────
   Hairline single-stroke glyphs sized to read at 14px. Stroke uses
   currentColor so they inherit row tone (muted at rest, ink on hover/
   active). 1.1px stroke matches the rule lines and viz seams across
   the design system. */

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" />
      <path d="M9.5 4l2.5 2.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4.5h10" />
      <path d="M6.5 4.5V3h3v1.5" />
      <path d="M4.5 4.5l.75 9h5.5l.75-9" />
    </svg>
  );
}
