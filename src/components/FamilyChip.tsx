import { useId, useState, useEffect, useRef } from 'react';
import type { Family } from '../lib/types';
import { COLORS } from '../lib/viz-constants';
import styles from './FamilyChip.module.css';

/**
 * FamilyChip — a tiny square that mirrors the family's treatment in
 * RunOnViz. Hatched pattern for the five "patterned" families, solid
 * ink for hinge, ink outline for iso. Doubles as a visual legend
 * across every screen that shows set data.
 *
 * Pattern specs duplicate RunOnViz's `PATTERN_SPECS` — keeping these
 * in sync with the viz is the load-bearing invariant; the chip is a
 * miniature slice of the same texture.
 *
 * Editable mode: clicking the chip opens a popover with all seven
 * families to override. Read-only mode (no onChange): the chip is
 * inert.
 */

const CHIP_SIZE = 14;

interface PatternSpec {
  width: number;
  strokeWidth: number;
}

// Mirrors RunOnViz.PATTERN_SPECS. If those change, change here too.
const PATTERN_SPECS: Record<
  Exclude<Family, 'hinge' | 'iso'>,
  PatternSpec
> = {
  squat: { width: 1.6, strokeWidth: 0.9 },
  pushH: { width: 2.6, strokeWidth: 0.9 },
  pullH: { width: 3.6, strokeWidth: 1.0 },
  pushV: { width: 4.8, strokeWidth: 1.0 },
  pullV: { width: 6.4, strokeWidth: 1.05 },
};

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

export interface FamilyChipProps {
  family: Family;
  /** When provided, the chip is interactive and opens an override popover. */
  onChange?: (next: Family) => void;
  /** For accessibility — the exercise this chip annotates, if any. */
  label?: string;
  size?: number;
}

export function FamilyChip({ family, onChange, label, size = CHIP_SIZE }: FamilyChipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Click-outside / escape closes the popover.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
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

  const aria = label ? `family for ${label}: ${FAMILY_LABEL[family]}` : `family: ${FAMILY_LABEL[family]}`;

  if (!onChange) {
    return (
      <span className={styles.chipWrap} aria-label={aria}>
        <ChipMark family={family} size={size} />
      </span>
    );
  }

  return (
    <span ref={wrapperRef} className={styles.chipWrap}>
      <button
        type="button"
        className={styles.chipBtn}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${aria}. click to change.`}
      >
        <ChipMark family={family} size={size} />
      </button>
      {open && (
        <ul className={styles.popover} role="listbox">
          {ALL_FAMILIES.map((f) => (
            <li key={f}>
              <button
                type="button"
                role="option"
                aria-selected={f === family}
                className={`${styles.option} ${f === family ? styles.optionActive : ''}`}
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
              >
                <ChipMark family={f} size={size} />
                <span className={styles.optionLabel}>{FAMILY_LABEL[f]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

/**
 * The actual SVG square. Renders identically to a single-rep slice of
 * the family's bar in RunOnViz: outlined-with-pattern for the five
 * patterned families, solid ink for hinge, outlined-and-empty for iso.
 */
function ChipMark({ family, size }: { family: Family; size: number }) {
  const rawId = useId();
  const patternId = `chip-${family}-${rawId.replace(/:/g, '')}`;
  const isHinge = family === 'hinge';
  const isIso = family === 'iso';
  const isPatterned = !isHinge && !isIso;
  const spec = isPatterned
    ? PATTERN_SPECS[family as Exclude<Family, 'hinge' | 'iso'>]
    : null;

  const stroke = 1;
  const inner = size - stroke;
  const half = stroke / 2;

  return (
    <svg
      className={styles.chip}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {isPatterned && spec && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={spec.width}
            height={spec.width}
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={spec.width}
              stroke={COLORS.ink}
              strokeWidth={spec.strokeWidth}
            />
          </pattern>
        </defs>
      )}
      <rect
        x={half}
        y={half}
        width={inner}
        height={inner}
        rx={2}
        ry={2}
        fill={
          isHinge
            ? COLORS.ink
            : isPatterned
              ? `url(#${patternId})`
              : 'none'
        }
        stroke={COLORS.ink}
        strokeWidth={stroke}
      />
    </svg>
  );
}
