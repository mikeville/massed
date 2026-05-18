import { forwardRef, useRef } from 'react';
import type { Family } from '../lib/types';
import { FamilyChip } from './FamilyChip';
import { ExerciseCombobox } from './ExerciseCombobox';
import styles from './SetRow.module.css';

/**
 * SetRow — the shared atom of every view that lists sets.
 *
 * Two modes:
 *   - `static`: read-only cells. Used by SetTable (with `showTotal`) and
 *     the saved-zone of EditLedger.
 *   - `edit`: typeahead + number inputs + per-row × delete. Used in
 *     EditLedger's drafts zone.
 *
 * Both modes share a single 4-column CSS grid:
 *   exercise | family (chip + text) | reps × weight | end (total OR ×)
 *
 * On mobile, the grid reflows: family cell ejects to row-leading
 * position (the chip becomes the row marker; family text hides), the
 * reps×weight cell drops to a second line spanning full width.
 */

const FAMILY_LABEL: Record<Family, string> = {
  hinge: 'hinge',
  squat: 'squat',
  pushH: 'push h',
  pullH: 'pull h',
  pushV: 'push v',
  pullV: 'pull v',
  iso: 'iso',
};

interface BaseProps {
  /** Visual tone — `saved` slightly mutes static rows in the EditLedger
   *  to distinguish them from drafts/SetTable rows. */
  tone?: 'default' | 'saved';
}

interface StaticProps extends BaseProps {
  mode: 'static';
  exercise: string;
  family: Family;
  reps: number;
  weight: number;
  /** Right-most cell renders the total lb when true; hidden otherwise. */
  showTotal?: boolean;
}

interface EditProps extends BaseProps {
  mode: 'edit';
  exercise: string;
  family: Family | null;
  reps: string;
  weight: string;
  recents: string[];
  autoFocusExercise?: boolean;
  onExerciseChange: (next: string) => void;
  onExerciseCommit: (name: string, family: Family) => void;
  onFamilyChange: (next: Family) => void;
  onRepsChange: (next: string) => void;
  onWeightChange: (next: string) => void;
  /** Called when the row's last field commits with enter (or tab-out). */
  onRowCommit?: () => void;
  /** Called when the × button is clicked. Hidden when omitted. */
  onDelete?: () => void;
  /** Used for screen-reader context. */
  rowLabel?: string;
}

export type SetRowProps = StaticProps | EditProps;

export const SetRow = forwardRef<HTMLDivElement, SetRowProps>(function SetRow(
  props,
  ref
) {
  if (props.mode === 'static') return <SetRowStatic {...props} />;
  return <SetRowEdit ref={ref} {...props} />;
});

function SetRowStatic({
  exercise,
  family,
  reps,
  weight,
  showTotal,
  tone,
}: StaticProps) {
  return (
    <div
      className={`${styles.row} ${styles.rowStatic} ${
        tone === 'saved' ? styles.rowSaved : ''
      }`}
      role="row"
    >
      <div className={styles.cellExercise} role="cell">
        {exercise}
      </div>
      <div className={styles.cellFamily} role="cell">
        <FamilyChip family={family} label={exercise} size={12} />
        <span className={styles.familyText}>{FAMILY_LABEL[family]}</span>
      </div>
      <div className={styles.cellRepsWt} role="cell">
        <RepsByWeight reps={reps} weight={weight} />
      </div>
      <div className={styles.cellEnd} role="cell">
        {showTotal ? (
          <span className={styles.totalText}>{(reps * weight).toLocaleString('en-US')}</span>
        ) : null}
      </div>
    </div>
  );
}

const SetRowEdit = forwardRef<HTMLDivElement, EditProps>(function SetRowEdit(
  {
    exercise,
    family,
    reps,
    weight,
    recents,
    autoFocusExercise,
    onExerciseChange,
    onExerciseCommit,
    onFamilyChange,
    onRepsChange,
    onWeightChange,
    onRowCommit,
    onDelete,
    rowLabel,
  },
  ref
) {
  const repsRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRowCommit?.();
    }
  }

  return (
    <div
      ref={ref}
      className={`${styles.row} ${styles.rowEdit}`}
      role="row"
      aria-label={rowLabel}
    >
      <div className={styles.cellExercise} role="cell">
        <ExerciseCombobox
          value={exercise}
          family={family}
          recents={recents}
          onChange={onExerciseChange}
          onCommit={(name, fam) => {
            onExerciseCommit(name, fam);
            // After commit, advance focus to reps.
            repsRef.current?.focus();
            repsRef.current?.select();
          }}
          autoFocus={autoFocusExercise}
          placeholder="exercise"
          nextFieldRef={repsRef}
          inputClassName={styles.exerciseInput}
        />
      </div>
      <div className={styles.cellFamily} role="cell">
        {family && (
          <>
            <FamilyChip family={family} onChange={onFamilyChange} label={exercise} size={12} />
            <span className={styles.familyText}>{FAMILY_LABEL[family]}</span>
          </>
        )}
      </div>
      <div className={styles.cellRepsWt} role="cell">
        <span className={styles.repsXWtEdit}>
          <input
            ref={repsRef}
            type="number"
            inputMode="numeric"
            min={0}
            value={reps}
            onChange={(e) => onRepsChange(e.target.value)}
            className={styles.numberInput}
            aria-label="reps"
            placeholder="—"
          />
          <span className={styles.xMark}>×</span>
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            onKeyDown={handleWeightKeyDown}
            className={styles.numberInput}
            aria-label="weight in pounds"
            placeholder="—"
          />
        </span>
      </div>
      <div className={styles.cellEnd} role="cell">
        {onDelete && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onDelete}
            aria-label={rowLabel ? `remove ${rowLabel}` : 'remove row'}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * The reps × weight numeric pair — same 3-track grid used in SetTable so
 * numbers right- and left-align consistently across read-only and edit
 * contexts.
 */
function RepsByWeight({ reps, weight }: { reps: number; weight: number }) {
  return (
    <span className={styles.repsXWt}>
      <span className={styles.repsCol}>{reps}</span>
      <span className={styles.xMark}>×</span>
      <span className={styles.wtCol}>{weight}</span>
    </span>
  );
}
