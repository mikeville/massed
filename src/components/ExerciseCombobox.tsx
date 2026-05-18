import { useEffect, useRef, useState } from 'react';
import type { Family } from '../lib/types';
import { inferFamily, suggestExercises } from '../lib/family-lookup';
import { FamilyChip } from './FamilyChip';
import styles from './ExerciseCombobox.module.css';

/**
 * ExerciseCombobox — the editable exercise cell.
 *
 * On focus, a popover anchors below the input with:
 *   - empty input: recent exercises (chip list)
 *   - typed input: matching names from the lookup + recents
 *   - no match: a "+ add as new" option that opens a family picker
 *
 * Commits via onCommit (called when the user picks a chip, presses
 * enter, or tabs out with a value). For known names, family is
 * auto-inferred. For unknown names, the family picker collects it
 * before the row can commit.
 *
 * Designed to fit inside a SetRow cell — no chip bar pushes the form
 * down; everything happens in the floating popover.
 */

const ALL_FAMILIES: Family[] = [
  'hinge',
  'squat',
  'pushH',
  'pullH',
  'pushV',
  'pullV',
  'iso',
];

const FAMILY_LABEL: Record<Family, string> = {
  hinge: 'hinge',
  squat: 'squat',
  pushH: 'push h',
  pullH: 'pull h',
  pushV: 'push v',
  pullV: 'pull v',
  iso: 'iso',
};

export interface ExerciseComboboxProps {
  value: string;
  family: Family | null;
  recents: string[];
  onChange: (next: string) => void;
  /** Called with a finalized name + family (e.g., on chip click or enter
   *  with a known name). Distinct from onChange so the caller can decide
   *  what "row commit" means (advance focus, append draft, etc.). */
  onCommit: (name: string, family: Family) => void;
  /** Called when the input is given focus — useful when the row needs
   *  to expand or scroll into view in its parent. */
  onFocus?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Tab order destination after this cell — when present, enter on a
   *  known name advances to it. */
  nextFieldRef?: React.RefObject<HTMLElement>;
  /** Optional id for label association. */
  id?: string;
  /** Class applied to the inner input so SetRow can size it. */
  inputClassName?: string;
}

const SUGGEST_LIMIT = 6;

export function ExerciseCombobox({
  value,
  family,
  recents,
  onChange,
  onCommit,
  onFocus,
  placeholder,
  autoFocus,
  nextFieldRef,
  id,
  inputClassName,
}: ExerciseComboboxProps) {
  const [open, setOpen] = useState(false);
  // When the user types a name not in the lookup AND no chip matches,
  // the popover swaps to a "+ add with family" picker.
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close popover on outside click / escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset the "adding" state when the value clears or matches a known
  // lookup entry — no need to ask for a family in those cases.
  useEffect(() => {
    if (!value.trim() || inferFamily(value)) setAdding(false);
  }, [value]);

  const suggestions = suggestExercises(value, recents, SUGGEST_LIMIT);
  const inferred = inferFamily(value);
  const trimmed = value.trim();
  const hasExactMatch =
    trimmed !== '' &&
    suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  function handleSelect(name: string) {
    onChange(name);
    const fam = inferFamily(name);
    if (fam) {
      onCommit(name, fam);
      setOpen(false);
      setAdding(false);
      // Advance focus to the next field if provided.
      nextFieldRef?.current?.focus();
    } else {
      // Unknown chip selection — needs a family before commit.
      setAdding(true);
    }
  }

  function handleAddWithFamily(fam: Family) {
    if (!trimmed) return;
    onCommit(trimmed, fam);
    setOpen(false);
    setAdding(false);
    nextFieldRef?.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!trimmed) return;
      const fam = inferFamily(trimmed) ?? family;
      if (fam) {
        onCommit(trimmed, fam);
        setOpen(false);
        setAdding(false);
        nextFieldRef?.current?.focus();
      } else {
        setOpen(true);
        setAdding(true);
      }
    } else if (e.key === 'ArrowDown' && !open) {
      setOpen(true);
    }
  }

  function handleBlur() {
    // Don't close on blur — the popover's own click handler will commit.
    // The outside-click listener handles the actual dismiss.
  }

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        className={`${styles.input} ${inputClassName ?? ''}`}
        value={value}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          onFocus?.();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && (
        <div className={styles.popover}>
          {adding ? (
            <>
              <p className={styles.popoverNote}>
                pick a family for <strong>{trimmed}</strong>:
              </p>
              <ul className={styles.familyList} role="listbox">
                {ALL_FAMILIES.map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      className={styles.familyOption}
                      onClick={() => handleAddWithFamily(f)}
                    >
                      <FamilyChip family={f} size={12} />
                      <span>{FAMILY_LABEL[f]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {suggestions.length > 0 && (
                <ul className={styles.chipList} role="listbox">
                  {suggestions.map((name) => {
                    const fam = inferFamily(name) ?? 'iso';
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          className={styles.chip}
                          onMouseDown={(e) => {
                            // Prevent input blur so popover stays alive
                            // through the click.
                            e.preventDefault();
                          }}
                          onClick={() => handleSelect(name)}
                        >
                          <FamilyChip family={fam} size={10} />
                          <span>{name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {trimmed && !hasExactMatch && !inferred && (
                <button
                  type="button"
                  className={styles.addNew}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setAdding(true)}
                >
                  + add <strong>{trimmed}</strong> as new
                </button>
              )}
              {!trimmed && suggestions.length === 0 && (
                <p className={styles.popoverNote}>
                  type an exercise — e.g. bench, squat, deadlift.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
