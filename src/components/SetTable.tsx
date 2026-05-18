import { useEffect, useMemo, useRef, useState } from 'react';
import type { Family, Session } from '../lib/types';
import { totalWeight } from '../lib/totals';
import { formatDateHeader } from '../lib/format-date';
import { recentExerciseNames } from '../lib/recent-exercises';
import { flattenSession, type FlatSet, type FlatSetPatch } from '../lib/useSessions';
import { inferFamily } from '../lib/family-lookup';
import { SetRow } from './SetRow';
import { SwipeableSetRow, useSingleOpenRow } from './SwipeableSetRow';
import styles from './SetTable.module.css';

/**
 * SetTable — the read-only inspection lens, with optional in-place edit.
 *
 * Where RunOnViz answers "what does my training feel like," this view
 * answers "what exactly did I do." Same data, different lens.
 *
 * Built from `SetRow.Static` so the layout, type, and family chip match
 * the editable ledger on /log exactly. The only thing this view adds is
 * date grouping and a per-session total in each date header.
 *
 * When `onUpdateSet`/`onDeleteSet` are supplied, each row gains a pair
 * of edit/delete affordances revealed by hover (desktop) or left-swipe
 * (touch). Tapping the row content still drops it into in-place edit
 * — same `SetRow.edit` UI that powers the EditLedger drafts zone, so
 * users see one editing pattern across the app. The destructive
 * delete lives outside the edit form (lesson learned: a × adjacent to
 * the reps/weight fields was a fat-finger trap) and writes through a
 * 5-second undo toast that calls `onRestoreSet` to splice the row
 * back in place.
 */

const UNDO_TIMEOUT_MS = 5000;

export interface SetTableProps {
  sessions: Session[];
  onUpdateSet?: (date: string, flatIndex: number, patch: FlatSetPatch) => void;
  onDeleteSet?: (date: string, flatIndex: number) => void;
  onRestoreSet?: (date: string, flatIndex: number, row: FlatSet) => void;
}

interface EditingCoord {
  date: string;
  flatIndex: number;
}

interface EditingDraft {
  name: string;
  family: Family;
  reps: string;
  weight: string;
}

interface PendingUndo {
  date: string;
  flatIndex: number;
  row: FlatSet;
}

export function SetTable({
  sessions,
  onUpdateSet,
  onDeleteSet,
  onRestoreSet,
}: SetTableProps) {
  const interactive = Boolean(onUpdateSet && onDeleteSet && onRestoreSet);

  const [editing, setEditing] = useState<EditingCoord | null>(null);
  const [draft, setDraft] = useState<EditingDraft | null>(null);
  const swipe = useSingleOpenRow();
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Recents pool — same source as EditLedger's typeahead, so the inline
  // edit's name suggestions feel identical to logging a fresh set.
  const recents = useMemo(() => recentExerciseNames(sessions, 8), [sessions]);

  // Bail out of edit mode if the data shifts beneath us (e.g. seed reset,
  // or a successful delete reduced the session). Without this, the
  // editing coord can dangle past a row that no longer exists.
  useEffect(() => {
    if (!editing) return;
    const session = sessions.find((s) => s.date === editing.date);
    if (!session) {
      setEditing(null);
      setDraft(null);
      return;
    }
    const flat = flattenSession(session);
    if (editing.flatIndex >= flat.length) {
      setEditing(null);
      setDraft(null);
    }
  }, [sessions, editing]);

  // Tear down the undo timer on unmount or when the pending entry is
  // cleared by an undo or a fresh delete.
  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  function startEdit(date: string, flatIndex: number, row: FlatSet) {
    if (!interactive) return;
    swipe.setOpen(null);
    setEditing({ date, flatIndex });
    setDraft({
      name: row.name,
      family: row.family,
      reps: String(row.reps),
      weight: String(row.weight),
    });
  }

  function commitEdit() {
    if (!editing || !draft || !onUpdateSet) {
      setEditing(null);
      setDraft(null);
      return;
    }
    const name = draft.name.trim();
    const fam = draft.family ?? inferFamily(name);
    const r = Number(draft.reps);
    const w = Number(draft.weight);
    // Validation mirrors EditLedger — invalid commits discard rather than
    // overwrite real data with garbage. The cell stays as-was on disk; the
    // user sees the row revert to its prior values.
    const valid =
      name !== '' &&
      fam !== null &&
      Number.isFinite(r) &&
      r > 0 &&
      Number.isFinite(w) &&
      w >= 0;
    if (valid && fam) {
      onUpdateSet(editing.date, editing.flatIndex, {
        name,
        family: fam,
        reps: r,
        weight: w,
      });
    }
    setEditing(null);
    setDraft(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(null);
  }

  function handleDelete(date: string, flatIndex: number, row: FlatSet) {
    if (!onDeleteSet) return;
    swipe.setOpen(null);
    onDeleteSet(date, flatIndex);
    setPendingUndo({ date, flatIndex, row });
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setPendingUndo(null);
      undoTimerRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  function handleUndo() {
    if (!pendingUndo || !onRestoreSet) return;
    onRestoreSet(pendingUndo.date, pendingUndo.flatIndex, pendingUndo.row);
    setPendingUndo(null);
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  if (sessions.length === 0) {
    return <p className={styles.empty}>no sets in this period.</p>;
  }
  // Seed and the on-disk log are stored ascending; show newest first.
  const ordered = [...sessions].reverse();
  return (
    <div className={styles.table} role="table" aria-label="logged sets">
      <HeaderRow />
      {ordered.map((session) => (
        <SessionGroup
          key={session.date}
          session={session}
          interactive={interactive}
          editing={editing?.date === session.date ? editing : null}
          draft={editing?.date === session.date ? draft : null}
          recents={recents}
          swipe={swipe}
          onStartEdit={startEdit}
          onDraftChange={setDraft}
          onCommit={commitEdit}
          onCancel={cancelEdit}
          onDelete={handleDelete}
        />
      ))}
      {pendingUndo && (
        <UndoToast
          row={pendingUndo.row}
          onUndo={handleUndo}
          onDismiss={() => setPendingUndo(null)}
        />
      )}
    </div>
  );
}

function HeaderRow() {
  return (
    <div className={styles.headerRow} role="row" aria-hidden="true">
      <div className={`${styles.headerCell} ${styles.headerExercise}`}>exercise</div>
      <div className={`${styles.headerCell} ${styles.headerFamily}`}>family</div>
      {/* Single text run, mirroring the data's `6 × 85` compact phrase. */}
      <div className={`${styles.headerCell} ${styles.headerRepsWt}`}>
        reps <span className={styles.headerX}>×</span> wt
      </div>
      <div className={`${styles.headerCell} ${styles.headerEnd}`}>total</div>
    </div>
  );
}

interface SessionGroupProps {
  session: Session;
  interactive: boolean;
  editing: EditingCoord | null;
  draft: EditingDraft | null;
  recents: string[];
  swipe: { isOpen: (key: string) => boolean; setOpen: (key: string | null) => void };
  onStartEdit: (date: string, flatIndex: number, row: FlatSet) => void;
  onDraftChange: (next: EditingDraft) => void;
  onCommit: () => void;
  onCancel: () => void;
  onDelete: (date: string, flatIndex: number, row: FlatSet) => void;
}

function SessionGroup({
  session,
  interactive,
  editing,
  draft,
  recents,
  swipe,
  onStartEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onDelete,
}: SessionGroupProps) {
  const sessionTotal = totalWeight([session]);
  const flat = flattenSession(session);
  return (
    <section className={styles.session} role="rowgroup">
      <div className={styles.dateRow} role="row">
        <span className={styles.dateLabel}>{formatDateHeader(session.date)}</span>
        <span className={styles.dateTotal}>{formatLb(sessionTotal)} lb</span>
      </div>
      {flat.map((row, i) => {
        const isEditing = editing?.flatIndex === i && draft !== null;
        const key = `${session.date}-${i}`;
        if (isEditing && draft) {
          return (
            <EditingRow
              key={key}
              draft={draft}
              recents={recents}
              onDraftChange={onDraftChange}
              onCommit={onCommit}
              onCancel={onCancel}
            />
          );
        }
        if (!interactive) {
          return (
            <SetRow
              key={key}
              mode="static"
              exercise={row.name}
              family={row.family}
              reps={row.reps}
              weight={row.weight}
              showTotal
            />
          );
        }
        const label = `${row.name} ${row.reps} by ${row.weight}`;
        return (
          <SwipeableSetRow
            key={key}
            label={label}
            isOpen={swipe.isOpen(key)}
            onOpenChange={(open) => swipe.setOpen(open ? key : null)}
            onEdit={() => onStartEdit(session.date, i, row)}
            onDelete={() => onDelete(session.date, i, row)}
          >
            <SetRow
              mode="static"
              exercise={row.name}
              family={row.family}
              reps={row.reps}
              weight={row.weight}
              showTotal
            />
          </SwipeableSetRow>
        );
      })}
    </section>
  );
}

/**
 * The editing-row wrapper. Owns the blur-out commit logic and the
 * escape-to-cancel keymap, then delegates the visual row to SetRow in
 * `edit` mode — the same atom used by EditLedger's drafts zone, so the
 * inline edit looks and behaves identically to logging a new set.
 *
 * Note: no `onDelete` is passed to SetRow here. Deleting from the
 * table happens through the swipe/hover action — keeping the edit form
 * free of a destructive button means the user can't fat-finger a
 * delete while reaching for the reps field.
 */
function EditingRow({
  draft,
  recents,
  onDraftChange,
  onCommit,
  onCancel,
}: {
  draft: EditingDraft;
  recents: string[];
  onDraftChange: (next: EditingDraft) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Auto-focus the reps field on entry. The exercise cell has its own
  // typeahead lifecycle, so jumping straight to reps means a single tap
  // → straight into the most commonly edited number.
  useEffect(() => {
    const input = wrapRef.current?.querySelector<HTMLInputElement>('input[type="number"]');
    input?.focus();
    input?.select();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.editWrap}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && wrapRef.current?.contains(next)) return;
        onCommit();
      }}
      onMouseDown={(e) => {
        // Empty cell space, the family text label, and the padding
        // zones inside the row aren't focusable — clicking them would
        // pull focus out of whichever input is active and collapse
        // the row. Suppress the focus shift so the row stays open
        // until the user clicks outside the wrap entirely. Inputs,
        // buttons (including the FamilyChip), and other tabbables
        // pass through untouched.
        const target = e.target as HTMLElement | null;
        if (
          target &&
          !target.closest(
            'input, button, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
          )
        ) {
          e.preventDefault();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <SetRow
        mode="edit"
        exercise={draft.name}
        family={draft.family}
        reps={draft.reps}
        weight={draft.weight}
        recents={recents}
        rowLabel={draft.name}
        onExerciseChange={(name) => onDraftChange({ ...draft, name })}
        onExerciseCommit={(name, fam) => onDraftChange({ ...draft, name, family: fam })}
        onFamilyChange={(fam) => onDraftChange({ ...draft, family: fam })}
        onRepsChange={(reps) => onDraftChange({ ...draft, reps })}
        onWeightChange={(weight) => onDraftChange({ ...draft, weight })}
        onRowCommit={onCommit}
      />
    </div>
  );
}

/**
 * UndoToast — the minimal "deleted X · undo" surface that follows a
 * trash tap. Renders inline at the bottom of the table rather than
 * floating, so it stays within the column's typographic rhythm. Auto-
 * dismisses after 5 seconds via the parent's timer; can be undone with
 * one keystroke or one tap before then.
 */
function UndoToast({
  row,
  onUndo,
  onDismiss,
}: {
  row: FlatSet;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className={styles.undoToast} role="status" aria-live="polite">
      <span className={styles.undoText}>
        deleted {row.name} {row.reps} × {row.weight}
      </span>
      <div className={styles.undoActions}>
        <button type="button" className={styles.undoBtn} onClick={onUndo}>
          undo
        </button>
        <button
          type="button"
          className={styles.undoDismiss}
          onClick={onDismiss}
          aria-label="dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function formatLb(n: number): string {
  return n.toLocaleString('en-US');
}
