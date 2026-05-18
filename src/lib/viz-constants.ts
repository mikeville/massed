/**
 * Viz geometry — kept in TS so the SVG renderer can use them numerically.
 * These mirror the --viz-* CSS custom properties in tokens.css.
 *
 * If you change a value here, mirror it in tokens.css (and vice versa).
 * A future improvement: read from CSS at runtime via getComputedStyle so
 * there's only one source.
 */

export const VIZ = {
  /** Height of a single rep row (px). */
  REP_H: 14,
  /** Outer corner radius of a set rect (px). */
  RADIUS: 4,
  /** Set outline stroke width (px). */
  STROKE: 1,
  /** Width of the inter-rep ink seam line (px). */
  SEAM_W: 0.7,
  /** Vertical inset of seams from top/bottom (px). */
  SEAM_INSET: 1.5,
  /** Horizontal inset of texture clip from left/right (px). */
  SIDE_INSET: 1.5,
  /** Distance from rep boundary to highlight stroke center on hinge bars
   *  (where the highlight is the only delimiter — no ink seam). */
  HIGHLIGHT_OFFSET: 0.7,
  /** Width of the highlight stroke on patterned/iso bars (px). Wider
   *  than SEAM_W so the faux-letterpress reads stronger; left at
   *  SEAM_W on hinge bars where the highlight stands alone. */
  HIGHLIGHT_W: 2,
  /** Distance from rep boundary to highlight stroke center on
   *  patterned/iso bars. Equals (SEAM_W + HIGHLIGHT_W) / 2 so the
   *  highlight's left edge sits flush against the ink seam's right. */
  HIGHLIGHT_OFFSET_WIDE: 1.35,

  /** Spacing between sets within an exercise. */
  SET_GAP: 5,
  /** Spacing between exercises within a session. */
  EX_GAP: 9,
  /** Spacing between days in the run-on flow. */
  DAY_GAP: 14,
  /** Spacing before a new month label. */
  MONTH_GAP: 18,
  /** Space after a day or month label, before the first set. */
  POST_LABEL: 6,

  /** sqrt-scale calibration factor: width = sqrt(weight) * SCALE. */
  SCALE_FACTOR: 0.9,
} as const;

export const COLORS = {
  ink: '#14130f',
  /* Seam highlight stripe — matches the page bg (paper) so the
     between-rep highlights read as "paper showing through" rather than
     a separate tan tone. */
  vizBg: '#faecec',
  paper: '#faecec',
} as const;
