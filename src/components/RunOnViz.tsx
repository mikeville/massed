import { Fragment, useId, useMemo } from 'react';
import type { Session, ExerciseEntry, SetEntry, Family } from '../lib/types';
import { VIZ, COLORS } from '../lib/viz-constants';

/**
 * RunOnViz
 * ────────
 * Renders a list of sessions as a continuous run-on of textured set rects.
 * Sessions wrap inline within their month. Set width is derived from
 * sqrt(weight). Each rep is delineated within its set by a thin ink seam
 * paired with a paper-colored highlight strip (faux-letterpress).
 *
 * Reverse-chronological by default — newest sessions render at the top of
 * the viz so the most recent work is what the eye lands on first.
 *
 * Months act as section breaks: the month name renders on its own line
 * with a full-width horizontal rule under it.
 *
 * Bar height (REP_H) is parameterized via the `repHeight` prop so the
 * check-in screen can render chunkier bars on desktop while the LogScreen
 * preview keeps them compact.
 */

export interface RunOnVizProps {
  sessions: Session[];
  /** Width of the SVG viewBox in user units. */
  width?: number;
  /** Optional class on the outer <svg>. */
  className?: string;
  /** Skip month/day labels and section rules — used by the LogScreen
   *  live-preview, where labels would just be noise. */
  compact?: boolean;
  /** Bar height in user units. Defaults to the base `VIZ.REP_H` (14).
   *  CheckInScreen passes a larger value on desktop so bars feel
   *  substantial as weight accumulates. */
  repHeight?: number;
}

type Token =
  | { kind: 'month'; text: string }
  | { kind: 'day'; text: string }
  | {
      kind: 'set';
      reps: number;
      repW: number;
      family: Family;
    };

interface PlacedSet {
  x: number;
  y: number;
  reps: number;
  repW: number;
  family: Family;
}
interface PlacedLabel {
  x: number;
  y: number;
  text: string;
  kind: 'month' | 'day';
}
interface PlacedRule {
  x1: number;
  x2: number;
  y: number;
}

const PAD = { L: 4, R: 4, T: 12 };
/** Vertical gap between rows of bars (and between a month rule and the
 *  bars below it). Stays constant across `repHeight` values. */
const INTER_ROW_GAP = 8;
/** Extra vertical breathing room above each month section break (after first). */
const MONTH_SECTION_GAP = 18;
/** Gap between the month header text baseline and the rule under it. */
const MONTH_RULE_OFFSET = 4;

/** Conservative monospace width estimates (matches IBM Plex Mono at our sizes). */
function dayLabelWidth(text: string): number {
  return text.length * 5.6 + 2;
}

// Future: weekday letter (M.27, T.28) belongs in the hover-state label,
// not the inline day glyph — the glyph stays terse for visual rhythm.

// sqrt scaling dampens outliers so 20-lb accessory work stays visible
// next to 400-lb compounds. Linear scaling makes the light stuff
// disappear; sqrt is the load-bearing design choice of the viz.
function repWidth(weight: number): number {
  return Math.sqrt(weight) * VIZ.SCALE_FACTOR;
}

type TexturedFamily = Exclude<Family, 'hinge' | 'iso'>;

// hinge fills solid ink, iso is outline-only; the other five families
// render with diagonal-line textures, so they need pattern + clip refs.
// Type predicate lets callers narrow `s.family` after the check.
const hasTexture = (f: Family): f is TexturedFamily =>
  f !== 'hinge' && f !== 'iso';

function tokenize(sessions: Session[]): Token[] {
  const ordered = [...sessions].reverse();
  const tokens: Token[] = [];
  let currentMonth: string | null = null;

  for (const sess of ordered) {
    const date = new Date(sess.date + 'T00:00:00');
    const monthName = date
      .toLocaleString('en-US', { month: 'long' })
      .toUpperCase();
    const dayStr = String(date.getDate());

    if (monthName !== currentMonth) {
      tokens.push({ kind: 'month', text: monthName });
      currentMonth = monthName;
    }
    tokens.push({ kind: 'day', text: dayStr });

    sess.exercises.forEach((ex: ExerciseEntry) => {
      ex.sets.forEach((set: SetEntry) => {
        tokens.push({
          kind: 'set',
          reps: set.reps,
          repW: repWidth(set.weight),
          family: ex.family,
        });
      });
    });
  }
  return tokens;
}

/**
 * Layout pass — assigns (x, y) to every token. Uses a single horizontal
 * cursor that wraps to the next line when a token would overflow.
 *
 * Month tokens are block-level: they break the current line, render a
 * heading + rule, and advance the cursor to a fresh line below the rule.
 */
function layout(
  tokens: Token[],
  lineW: number,
  repH: number
): {
  sets: PlacedSet[];
  labels: PlacedLabel[];
  rules: PlacedRule[];
  totalHeight: number;
} {
  const lineH = repH + INTER_ROW_GAP;
  const sets: PlacedSet[] = [];
  const labels: PlacedLabel[] = [];
  const rules: PlacedRule[] = [];
  let x = 0;
  let y = PAD.T;
  let lastWasSet = false;
  let firstMonth = true;

  const newline = () => {
    y += lineH;
    x = 0;
    lastWasSet = false;
  };

  for (const tok of tokens) {
    if (tok.kind === 'month') {
      // Section break. Close the current line if mid-flow.
      if (x > 0) newline();
      if (!firstMonth) y += MONTH_SECTION_GAP;
      firstMonth = false;

      const ruleY = y + repH + MONTH_RULE_OFFSET;
      labels.push({ x: PAD.L, y, text: tok.text, kind: 'month' });
      rules.push({ x1: PAD.L, x2: PAD.L + lineW, y: ruleY });
      // Advance the cursor so the gap between the month rule and the
      // first bar below matches the inter-row gap between bars.
      y = ruleY + INTER_ROW_GAP;
      x = 0;
      lastWasSet = false;
    } else if (tok.kind === 'day') {
      if (lastWasSet) x += VIZ.DAY_GAP;
      const w = dayLabelWidth(tok.text);
      if (x + w > lineW && x > 0) newline();
      labels.push({ x: PAD.L + x, y, text: tok.text, kind: 'day' });
      x += w + VIZ.POST_LABEL;
      lastWasSet = false;
    } else {
      if (lastWasSet) x += VIZ.SET_GAP;
      const setW = tok.reps * tok.repW;
      if (x + setW > lineW && x > 0) newline();
      sets.push({
        x: PAD.L + x,
        y,
        reps: tok.reps,
        repW: tok.repW,
        family: tok.family,
      });
      x += setW;
      lastWasSet = true;
    }
  }

  return { sets, labels, rules, totalHeight: y + repH + PAD.T };
}

interface PatternSpec {
  width: number;
  strokeWidth: number;
}

/** Density spread, recalibrated:
 *  squat is the densest, pullV is the sparsest. Steps widen through the middle.
 */
const PATTERN_SPECS: Record<TexturedFamily, PatternSpec> = {
  squat: { width: 1.6, strokeWidth: 0.9 },
  pushH: { width: 2.6, strokeWidth: 0.9 },
  pullH: { width: 3.6, strokeWidth: 1.0 },
  pushV: { width: 4.8, strokeWidth: 1.0 },
  pullV: { width: 6.4, strokeWidth: 1.05 },
};

export function RunOnViz({
  sessions,
  width = 600,
  className,
  compact = false,
  repHeight = VIZ.REP_H,
}: RunOnVizProps) {
  const uid = useId();
  const repH = repHeight;
  const lineW = Math.max(0, width - PAD.L - PAD.R);

  const { sets, labels, rules, totalHeight } = useMemo(() => {
    const tokens = tokenize(sessions);
    // Compact mode strips month/day tokens before layout — sets flow
    // straight across with no headers or day glyphs.
    const visible = compact ? tokens.filter((t) => t.kind === 'set') : tokens;
    return layout(visible, lineW, repH);
  }, [sessions, lineW, compact, repH]);

  // useId may emit colons (e.g. ":r1:") which aren't valid in SVG ids.
  const safeUid = uid.replace(/:/g, '');
  const patternId = (family: keyof typeof PATTERN_SPECS) =>
    `dl-${family}-${safeUid}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        {(Object.keys(PATTERN_SPECS) as Array<keyof typeof PATTERN_SPECS>).map(
          (family) => {
            const spec = PATTERN_SPECS[family];
            return (
              <pattern
                key={family}
                id={patternId(family)}
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
            );
          }
        )}
        {sets.map((s, i) => {
          if (!hasTexture(s.family)) return null;
          const setW = s.reps * s.repW;
          const innerW = setW - VIZ.SIDE_INSET * 2;
          const innerH = repH - VIZ.SEAM_INSET * 2;
          if (innerW <= 0 || innerH <= 0) return null;
          const r = Math.min(VIZ.RADIUS, setW / 2);
          const innerRx = Math.max(0, r - VIZ.SIDE_INSET);
          return (
            <clipPath id={`clip-${safeUid}-${i}`} key={i}>
              <rect
                x={s.x + VIZ.SIDE_INSET}
                y={s.y + VIZ.SEAM_INSET}
                width={innerW}
                height={innerH}
                rx={innerRx}
                ry={Math.max(0, VIZ.RADIUS - VIZ.SEAM_INSET)}
              />
            </clipPath>
          );
        })}
      </defs>

      {rules.map((r, i) => (
        <line
          key={`rule-${i}`}
          x1={r.x1}
          x2={r.x2}
          y1={r.y}
          y2={r.y}
          stroke={COLORS.ink}
          strokeWidth={1}
        />
      ))}

      {sets.map((s, i) => (
        <SetMark
          key={i}
          set={s}
          repH={repH}
          patternUrl={hasTexture(s.family) ? `url(#${patternId(s.family)})` : null}
          clipUrl={hasTexture(s.family) ? `url(#clip-${safeUid}-${i})` : null}
        />
      ))}

      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y + repH - 3}
          fill={l.kind === 'month' ? COLORS.ink : '#6e6a60'}
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={l.kind === 'month' ? 11 : 9.5}
          fontWeight={l.kind === 'month' ? 600 : 400}
          letterSpacing={l.kind === 'month' ? '0.18em' : '0.04em'}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

interface SetMarkProps {
  set: PlacedSet;
  patternUrl: string | null;
  clipUrl: string | null;
  repH: number;
}

function SetMark({ set: s, patternUrl, clipUrl, repH }: SetMarkProps) {
  const setW = s.reps * s.repW;
  if (setW <= 0) return null;

  const r = Math.min(VIZ.RADIUS, setW / 2);
  const isIso = s.family === 'iso';
  const isHinge = s.family === 'hinge';
  const isPatterned = !isIso && !isHinge;

  const seams: JSX.Element[] = [];
  if (s.reps > 1 && s.repW >= 1.5) {
    for (let i = 1; i < s.reps; i++) {
      const sx = s.x + i * s.repW;
      // ink seam (skipped on hinge — invisible on solid ink)
      if (!isHinge) {
        seams.push(
          <line
            key={`ink-${i}`}
            x1={sx}
            x2={sx}
            y1={s.y + VIZ.SEAM_INSET}
            y2={s.y + repH - VIZ.SEAM_INSET}
            stroke={COLORS.ink}
            strokeWidth={VIZ.SEAM_W}
          />
        );
      }
      // highlight stroke — what creates the lighting effect. Wider on
      // patterned/iso bars (where it pairs with an ink seam); narrower
      // on hinge bars (where it's the only rep delimiter and a thicker
      // light stripe on solid ink would over-read).
      const hlOffset = isHinge
        ? VIZ.HIGHLIGHT_OFFSET
        : VIZ.HIGHLIGHT_OFFSET_WIDE;
      const hlWidth = isHinge ? VIZ.SEAM_W : VIZ.HIGHLIGHT_W;
      seams.push(
        <line
          key={`hl-${i}`}
          x1={sx + hlOffset}
          x2={sx + hlOffset}
          y1={s.y + VIZ.SEAM_INSET}
          y2={s.y + repH - VIZ.SEAM_INSET}
          stroke={COLORS.vizBg}
          strokeWidth={hlWidth}
        />
      );
    }
  }

  return (
    <Fragment>
      {/* Outer outline + base fill */}
      {isPatterned ? (
        <>
          <rect
            x={s.x}
            y={s.y}
            width={setW}
            height={repH}
            rx={r}
            ry={VIZ.RADIUS}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={VIZ.STROKE}
          />
          {patternUrl && clipUrl && (
            <rect
              x={s.x}
              y={s.y}
              width={setW}
              height={repH}
              fill={patternUrl}
              clipPath={clipUrl}
            />
          )}
        </>
      ) : (
        <rect
          x={s.x}
          y={s.y}
          width={setW}
          height={repH}
          rx={r}
          ry={VIZ.RADIUS}
          fill={isHinge ? COLORS.ink : 'none'}
          stroke={COLORS.ink}
          strokeWidth={VIZ.STROKE}
        />
      )}
      {seams}
    </Fragment>
  );
}
