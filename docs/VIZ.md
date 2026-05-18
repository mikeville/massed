# The visualization, in detail

A standalone reference for `RunOnViz`. Read after `SPEC.md`.

---

## The mental model

Think of it as **typeset prose**, where:

- Each rep is a glyph.
- Each set is a word (made of glyphs touching, separated by hairline seams).
- Each exercise is a phrase (sets close together, slightly larger gap between words).
- Each session is a sentence (gapped further, prefixed with a date).
- A month is a chapter (gapped most, prefixed with a label like "APRIL").
- The whole flow wraps to fit the column width, like text in a column.

This metaphor is deliberate. It tells you what *not* to do — don't add
icons, don't add backgrounds-per-day, don't try to align sessions
horizontally across the grid. The flow is the structure.

---

## Encoding

| Property | Meaning |
|---|---|
| Width of one rep | √(weight) × 0.9, in px |
| Height of one rep | 14px (sweet spot is 12–16px at this rep width; outside that range the viz starts to feel either thin or chunky) |
| Texture inside the set | the family of the exercise |
| Outline | always 1px ink |
| Inter-rep seam | always 0.7px ink hairline + 0.7px viz-bg highlight |
| Inter-set gap | 5px |
| Inter-exercise gap | 9px |
| Inter-day gap | 14px |
| Inter-month gap | 18px |
| Wrap-line height | 26px (REP_H + 12px breathing) |

### Why sqrt scaling

Linear width creates a 9:1 ratio between deadlift (315lb) and lateral
raise (35lb). That's accurate to total weight lifted but visually it makes
accessory work disappear. Sqrt scaling compresses that to ~3:1 — heavy
work still dominates, but light work remains legibly present.

The 0.9 calibration factor was chosen so a 225-lb rep renders at roughly
the same width as it did in the linear prototype (13.5px). Above 225, the
curve compresses; below, it expands.

If you want to swap to log scaling later, the change is one line in
`viz-constants.ts` (`SCALE_FACTOR` becomes `LOG_BASE`, plus a function
swap).

### Why texture, not color

- Color creates an opacity hierarchy you didn't ask for. Light colors read as "less important."
- Texture is equal-weight; only different.
- Texture survives at small sizes, in dark mode, in print, in screenshots, in social.
- Texture lets us go single-ink (as the brand wants) without losing differentiation.

### Why set-level rounding (not rep-level)

A set is the meaningful unit of work. Three sets of squats is what the
user wrote in their notebook. The set rounds; the reps inside it are
delineated by seams. This:

- Preserves the "manuscript of work" feel — each set looks like a contiguous chunk
- Lets reps be countable for anyone who looks closely
- Avoids the visual fragmentation of rep-level rounding, which becomes noisy at high rep counts

Rep-level rounding was tested. It works for heavy/low-rep work but breaks
down for high-rep accessory work where the rep boxes get too narrow for
the texture to render.

### Why the highlight pixel

The 1px viz-bg-colored line offset 0.7px from each ink seam creates a
faux-letterpress lighting cue. The eye reads it as a thin notch with a
beveled face. It's small but it does real work — it's what makes the
viz feel "designed" rather than algorithmic.

On hinge (solid ink), the ink seam is invisible against the ink fill.
The highlight pixel does ALL the seam work. The result reads as a pale
groove cut into the solid ink — which is arguably even better than the
seam treatment on patterned families.

---

## Layout algorithm

### Tokenize → Layout → Render

```
sessions
  → tokenize() → [Token, Token, …]    (flat list of months, days, sets)
  → layout()   → { sets, labels, totalHeight }
  → render     → SVG
```

### Tokenize

Walks the session list. For each session:

1. Emit a `month` token if the month has changed.
2. Emit a `day` token.
3. For each exercise, for each set, emit a `set` token.

The output is a flat array. **This loses the exercise/session boundary
information**, which is why gaps between sets can't currently differ
based on whether they're "next set" vs "next exercise" vs "next day".

This is a known simplification. See *Known limitations* below.

### Layout

Single forward pass. Maintains a horizontal cursor `x` and a vertical
cursor `y`. For each token, compute its width, decide whether it fits on
the current line, and either:

- place it at `(PAD.L + x, y)` and advance `x`, or
- newline (`y += LINE_H, x = 0`) and place it at line start.

Gaps are added *before* the token, not after, so the first token on a
line starts flush left.

The layout returns:

- `sets`: array of `{x, y, reps, repW, family}` ready to render
- `labels`: array of `{x, y, text, kind}` ready to render
- `totalHeight`: the height the SVG needs to be

### Render

A React component walks `sets` and emits one rect (or two — outline + clipped texture) per set, plus seams. Then walks `labels` and emits text elements.

Each `RunOnViz` instance generates unique IDs for its patterns and clipPaths (using `useId()`), so multiple instances on one page don't collide.

---

## Known limitations

### 1. Flat tokens lose hierarchy

The tokenizer doesn't currently emit boundary metadata, so the layout
function can't distinguish "next set within an exercise" from "first set
of next exercise" from "first set of next session". Currently all set-to-set
gaps are `SET_GAP`.

**To fix**: add `{kind: 'set', boundary: 'set' | 'exercise' | 'session'}`
to the Token type, and have the layout function add the appropriate gap
based on boundary.

This wasn't done in the seed because it adds complexity that wasn't
visible in the prototypes. A real product version should fix it.

### 2. Month label width is hardcoded for "APRIL"

The estimate of monospace text width uses 7px per character. This is
calibrated for IBM Plex Mono at our 10px size, but it's not a measured
value. Long month names (SEPTEMBER) will fit but won't be precisely
sized.

**To fix**: render the text invisibly first, measure it via `getBBox`,
then use the measurement.

### 3. Layout is recomputed on every render

`useMemo` caches by sessions reference + width, but if you mutate the
sessions array in place, the cache won't bust. Always pass a fresh array.

### 4. Wrap heuristic is greedy

We wrap as soon as a token would overflow. There's no look-ahead for
"would the line look better if I wrapped one token earlier?". For most
data this is fine, but a future enhancement could implement
Knuth-Plass-style wrapping for nicer line lengths.

### 5. No animation

Adding a rep should feel like watching a sentence grow. Currently the
viz re-renders statically. The animation primitive should be: each new
rep fades + slides in over ~200ms, with the whole flow pushing rightward
to accommodate.

---

## Extension ideas

- **Tooltips on hover.** Hovering a set could show "5 × 315 lb deadlift, Wed Apr 23".
- **Sparkline mode.** Compress vertically when the viz is being shown as a strip in a list view.
- **All-time view.** Today, the viz can render arbitrary date ranges, but a year of data overflows the typical column. Either split into chapters per month with bigger gaps, or zoom out the rep height to ~6px.
- **Per-exercise filter.** "Show only my bench press." The same component, different filtered input.
- **Color mode (toggleable).** For users who'd rather have one accent color per family. Defaults to single-ink but discoverable.

---

## Testing the viz

Things to look at when tweaking:

1. **Texture density spread.** Squat should feel close to hinge but distinguishable. PullV should feel close to iso but distinguishable. The middle four families should each feel clearly separated. Render the legend strip at multiple sizes and check.
2. **Light-weight legibility.** Lateral raise at 20 lb is the canonical hard case. The set should be small but visible, not a sliver.
3. **Wrap behavior.** Resize the SVG width and watch wrap points. Sets should never wrap mid-set.
4. **Hinge vs squat at a glance.** They should be distinguishable. If they merge, widen squat's spacing.
5. **Multiple instances on one page.** Two `RunOnViz` components shouldn't bleed patterns or clipPaths into each other.

---

## Glossary

- **Family**: one of the 7 movement-pattern categories. Drives texture.
- **Run-on**: the wrapping prose-like flow of sets.
- **Seam**: the vertical hairline marking a rep boundary inside a set.
- **Highlight pixel**: the 1px viz-bg line that pairs with each ink seam, creating the letterpress effect.
- **Texture clip**: the inset clipPath that keeps the diagonal pattern from kissing the rounded outline.
- **Set rect**: the outer rounded rectangle of one set.
