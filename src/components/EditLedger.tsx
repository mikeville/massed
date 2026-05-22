import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import type { Family, Session, SetEntry } from '../lib/types';
import { inferFamily } from '../lib/family-lookup';
import { formatDateHeader, todayISO } from '../lib/format-date';
import { recentExerciseNames } from '../lib/recent-exercises';
import { flattenSession } from '../lib/useSessions';
import { RunOnViz } from './RunOnViz';
import { SetRow } from './SetRow';
import styles from './EditLedger.module.css';

/**
 * EditLedger — the editable set-list shared by manual mode and voice
 * mode (after parse). Layout:
 *
 *   [date row]          (for <date input> · info hint about per-save dates)
 *   [{date}, saved zone] (read-only SetRows of the selected day's stored
 *                        session, if any)
 *   [drafts zone]       (editable SetRows; per-row × delete)
 *   [entry row]         (blank SetRow.Edit; tab/enter commits to drafts)
 *   [bar preview]       (RunOnViz compact of saved + drafts)
 *   [save button]       (writes drafts via onSave, navigates to /)
 *
 * The entry row is the most active piece: typing in the exercise cell
 * opens the typeahead popover; selecting a known name or providing a
 * family on the fly advances focus to reps, then weight, then commits.
 *
 * Date semantics: a single date governs every draft in the batch. To
 * log sets across multiple days the user saves, then starts another
 * entry.
 */

interface Draft {
  exercise: string;
  family: Family;
  reps: number;
  weight: number;
}

interface EntryRow {
  exercise: string;
  family: Family | null;
  reps: string;
  weight: string;
}

const EMPTY_ENTRY: EntryRow = { exercise: '', family: null, reps: '', weight: '' };

export interface EditLedgerProps {
  sessions: Session[];
  onSave: (date: string, name: string, family: Family, set: SetEntry) => void;
  /** Pre-populated drafts (used by voice mode after parse). */
  initialDrafts?: Draft[];
  /** Optional secondary action (e.g. voice mode's "back to mic"). */
  secondary?: { label: string; onClick: () => void };
  /** When false and the ledger has any content, a quiet hint surfaces
      directing the user to set up sync. Coming from a place where they
      see "I am about to leave my own data in someone else's prototype
      browser" is the right moment to flag it. */
  syncConfigured: boolean;
  /** True while the visible log is untouched demo data. The hint reframes
      around "this app is in demo mode" so a fresh visitor reads it as "make this
      app mine" rather than "back up my data". */
  seedActive: boolean;
}

export function EditLedger({
  sessions,
  onSave,
  initialDrafts,
  secondary,
  syncConfigured,
  seedActive,
}: EditLedgerProps) {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [drafts, setDrafts] = useState<Draft[]>(() => initialDrafts ?? []);
  const [entry, setEntry] = useState<EntryRow>(EMPTY_ENTRY);
  const [error, setError] = useState<string | null>(null);
  const entryRowRef = useRef<HTMLDivElement>(null);

  // If the caller swaps the initial drafts (voice re-parse), reset.
  useEffect(() => {
    if (initialDrafts) setDrafts(initialDrafts);
  }, [initialDrafts]);

  // The session for the selected date (saved sets shown read-only above
  // drafts). Falls back to null when nothing has been logged yet for the
  // chosen day — the "saved" zone simply doesn't render.
  const savedForDate = useMemo(
    () => sessions.find((s) => s.date === selectedDate) ?? null,
    [sessions, selectedDate]
  );

  // Recents feed the typeahead. Names come from saved sessions only — drafts
  // are already visible above the entry row, so re-surfacing them as chips
  // would just echo the immediate context. Recents are global, not
  // date-scoped: switching to a past day shouldn't shrink the pool.
  const recents = useMemo(() => recentExerciseNames(sessions, 8), [sessions]);

  // Synthesized session for the bar preview, dated to the user's pick.
  // Saved sets first (preserved as-is), then drafts appended
  // chronologically. The render path tolerates the drafts not yet
  // matching the addSet grouping semantics — RunOnViz treats each
  // ExerciseEntry as its own bar sequence anyway.
  const previewSessions: Session[] = useMemo(() => {
    if (!savedForDate && drafts.length === 0) return [];
    const exercises = savedForDate
      ? savedForDate.exercises.map((ex) => ({ ...ex, sets: [...ex.sets] }))
      : [];
    for (const d of drafts) {
      // Mirror the addSet last-entry merging so the preview shape matches
      // what storage will look like post-save.
      const last = exercises[exercises.length - 1];
      if (last && last.name.trim().toLowerCase() === d.exercise.trim().toLowerCase()) {
        last.sets.push({ reps: d.reps, weight: d.weight });
      } else {
        exercises.push({
          name: d.exercise,
          family: d.family,
          sets: [{ reps: d.reps, weight: d.weight }],
        });
      }
    }
    return [{ date: selectedDate, exercises }];
  }, [savedForDate, drafts, selectedDate]);

  // Live width for the preview viz.
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    setPreviewWidth(Math.floor(node.getBoundingClientRect().width));
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setPreviewWidth(Math.floor(w));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // ── handlers ──────────────────────────────────────────────────────────

  function commitDraft(d: Draft) {
    setDrafts((prev) => [...prev, d]);
    setEntry(EMPTY_ENTRY);
    setError(null);
    // Refocus the exercise cell so the next row is one keystroke away.
    queueMicrotask(() => {
      const input = entryRowRef.current?.querySelector('input');
      if (input instanceof HTMLInputElement) input.focus();
    });
  }

  function handleEntryCommit() {
    const name = entry.exercise.trim();
    const fam = entry.family ?? inferFamily(name);
    const r = Number(entry.reps);
    const w = Number(entry.weight);
    if (!name) return setError('exercise name is required.');
    if (!fam) return setError('pick a family for this exercise.');
    if (!Number.isFinite(r) || r <= 0) return setError('reps must be a positive number.');
    if (!Number.isFinite(w) || w < 0) return setError('weight must be a number.');
    commitDraft({ exercise: name, family: fam, reps: r, weight: w });
  }

  function handleSave() {
    setError(null);
    // If the entry row has any content, attempt to commit it first.
    let allDrafts = drafts;
    const partial =
      entry.exercise.trim() !== '' || entry.reps !== '' || entry.weight !== '';
    if (partial) {
      const name = entry.exercise.trim();
      const fam = entry.family ?? inferFamily(name);
      const r = Number(entry.reps);
      const w = Number(entry.weight);
      if (!name) return setError('exercise name is required.');
      if (!fam) return setError('pick a family for this exercise.');
      if (!Number.isFinite(r) || r <= 0) return setError('reps must be a positive number.');
      if (!Number.isFinite(w) || w < 0) return setError('weight must be a number.');
      allDrafts = [...drafts, { exercise: name, family: fam, reps: r, weight: w }];
    }
    if (allDrafts.length === 0) return setError('nothing to save.');
    if (!selectedDate) return setError('pick a date.');
    for (const d of allDrafts) {
      onSave(selectedDate, d.exercise, d.family, { reps: d.reps, weight: d.weight });
    }
    setLocation('/');
  }

  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function deleteDraft(i: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── render ────────────────────────────────────────────────────────────

  const hasContent =
    drafts.length > 0 ||
    entry.exercise.trim() !== '' ||
    entry.reps !== '' ||
    entry.weight !== '';

  // Cap "log in the future" — possible typo guardrail. The date input
  // itself stays free-form so a stubborn user can still pick anything;
  // the `max` attribute simply nudges the native picker's wheel.
  const todayMax = todayISO();

  // The hint only appears once the user has signaled intent to log
  // (drafts present from a parse, or a partial manual entry). It also
  // suppresses itself once sync is wired up — at that point this
  // device is no longer the only copy.
  const showSyncHint = !syncConfigured && hasContent;

  return (
    <div className={styles.ledger}>
      <DateRow value={selectedDate} max={todayMax} onChange={setSelectedDate} />

      <HeaderRow />

      {savedForDate && savedForDate.exercises.length > 0 && (
        <section className={styles.zone}>
          <p className={styles.zoneLabel}>
            {formatDateHeader(selectedDate)}, saved
          </p>
          <div className={styles.rows}>
            {flattenSession(savedForDate).map((row, i) => (
              <SetRow
                key={`saved-${i}`}
                mode="static"
                exercise={row.name}
                family={row.family}
                reps={row.reps}
                weight={row.weight}
                tone="saved"
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.zone}>
        {(drafts.length > 0 || savedForDate) && (
          <p className={styles.zoneLabel}>
            {drafts.length > 0 ? 'drafts' : 'new'}
          </p>
        )}
        <div className={styles.rows}>
          {drafts.map((d, i) => (
            <SetRow
              key={`draft-${i}`}
              mode="edit"
              exercise={d.exercise}
              family={d.family}
              reps={String(d.reps)}
              weight={String(d.weight)}
              recents={recents}
              rowLabel={d.exercise}
              onExerciseChange={(name) => updateDraft(i, { exercise: name })}
              onExerciseCommit={(name, fam) =>
                updateDraft(i, { exercise: name, family: fam })
              }
              onFamilyChange={(fam) => updateDraft(i, { family: fam })}
              onRepsChange={(r) => updateDraft(i, { reps: Number(r) || 0 })}
              onWeightChange={(w) => updateDraft(i, { weight: Number(w) || 0 })}
              onDelete={() => deleteDraft(i)}
            />
          ))}

          {/* The blank entry row. Always present. */}
          <SetRow
            ref={entryRowRef}
            mode="edit"
            exercise={entry.exercise}
            family={entry.family}
            reps={entry.reps}
            weight={entry.weight}
            recents={recents}
            autoFocusExercise={drafts.length === 0}
            rowLabel="new set"
            onExerciseChange={(name) => {
              setEntry((p) => ({ ...p, exercise: name }));
              setError(null);
            }}
            onExerciseCommit={(name, fam) =>
              setEntry((p) => ({ ...p, exercise: name, family: fam }))
            }
            onFamilyChange={(fam) => setEntry((p) => ({ ...p, family: fam }))}
            onRepsChange={(r) => setEntry((p) => ({ ...p, reps: r }))}
            onWeightChange={(w) => setEntry((p) => ({ ...p, weight: w }))}
            onRowCommit={handleEntryCommit}
          />
        </div>
      </section>

      {showSyncHint && (
        <Link href="/settings" className={styles.syncHint}>
          {seedActive ? (
            <>
              This app is in demo mode.{' '}
              <span className={styles.syncHintAction}>
                Set up your own log to save your workouts →
              </span>
            </>
          ) : (
            <>
              Your data only lives in this browser for now.{' '}
              <span className={styles.syncHintAction}>Set up your log to save your workouts →</span>
            </>
          )}
        </Link>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div ref={previewRef} className={styles.preview}>
        {previewWidth > 0 && previewSessions.length > 0 && (
          <RunOnViz
            sessions={previewSessions}
            width={previewWidth}
            repHeight={previewWidth > 500 ? 42 : 20}
            compact
          />
        )}
      </div>

      <div className={styles.actions}>
        {secondary && (
          <button
            type="button"
            className={styles.secondary}
            onClick={secondary.onClick}
          >
            {secondary.label}
          </button>
        )}
        <button
          type="button"
          className={styles.primary}
          onClick={handleSave}
          disabled={!hasContent}
        >
          save
        </button>
      </div>
    </div>
  );
}

/**
 * DateRow — "for <input type=date>".
 *
 * Native <input type="date"> gives us locale-correct picker UI on every
 * platform for zero dependency cost. We strip Chrome's default chrome
 * (clear button, picker indicator border) in CSS and keep the field
 * legible-but-quiet by inheriting mono caps from the surrounding label.
 */
function DateRow({
  value,
  max,
  onChange,
}: {
  value: string;
  max: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className={styles.dateRow}>
      <label className={styles.dateLabel}>
        <span className={styles.dateLabelPrefix}>for</span>
        <input
          type="date"
          className={styles.dateInput}
          value={value}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          aria-label="date for these sets"
        />
      </label>
    </div>
  );
}

function HeaderRow() {
  return (
    <div className={styles.headerRow} role="row" aria-hidden="true">
      <div className={`${styles.headerCell} ${styles.headerExercise}`}>exercise</div>
      <div className={`${styles.headerCell} ${styles.headerFamily}`}>family</div>
      <div className={`${styles.headerCell} ${styles.headerRepsWt}`}>
        reps <span className={styles.headerX}>×</span> wt
      </div>
      <div className={`${styles.headerCell} ${styles.headerEnd}`} />
    </div>
  );
}
