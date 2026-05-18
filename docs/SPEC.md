# massed — product spec

*Last updated: April 2026. Source of truth for the prototype.*

---

## What this is

A resistance training tracker that does one thing well: turns the dry total
of "weight × reps × sets" into something a human wants to see.

The user logs a set. Cumulative weight is computed. On every check-in, the
app renders a **headline fact** ("≈ a 1985 Honda Civic") with a textured
**run-on visualization** of the work itself.

The viz is the visible craft. The fact engine is the deep design problem:
how do you make stochastic content (one fact per open) feel like taste, not
like a Mad Lib?

---

## Non-goals for MVP

- **Not a coaching MVP.** No programs. No "what to do next." No nutrition.
- **Not a social MVP.** No feed, no likes, no comparison-to-strangers. The user is comparing themselves to civics and tigers, not to other lifters.
- **Not a multi-modal tracker MVP.** Resistance training only for v1. Running may follow later (different scale, different metaphors).
- **Not feature-complete fitness software.** Heart rate, body composition, sleep, mobility — none of it. The product is opinionated; the opinion is "less."
- **Not a real-time logger.** Sessions are logged after the workout, not set-by-set during. No rest timers, no in-workout prompts. The lifter is doing the work; the phone stays in the bag.

---

## Audience and use cases

- **Lifter who already has a routine.** They know what to do. They don't want to be coached. They want to see what they did.
- **Daily check-in (1×/day, ~10 seconds).** Open the app, see the fact, see the bars, close.
- **Post-workout logging (3–5×/week, ~60 seconds).** Log the session that just finished.
- **Occasional historical browse (1×/week, ~2 minutes).** Switch period to month/year/all to see the longer arc.

The 10-second check-in is the most important interaction. It runs much
more often than logging. The visual system is tuned for it.

---

## Data model

See [`src/lib/types.ts`](../src/lib/types.ts) for the canonical TypeScript types.

```
Session
  date: ISO YYYY-MM-DD
  exercises: ExerciseEntry[]

ExerciseEntry
  name: string         (display: "incline DB bench")
  family: Family       (visual encoding key)
  sets: SetEntry[]

SetEntry
  reps: number
  weight: number       (lb, single value per set in v1)
```

### Family — the seven movement patterns

The viz reduces the universe of exercises to seven movement patterns. This
is what makes the system scale: a serious lifter has 15+ exercises in
rotation, but only ~7 patterns underneath them.

| Family | Pattern | Examples |
|---|---|---|
| `hinge` | hip hinge | deadlift, RDL, good morning |
| `squat` | knee-dominant | back squat, front squat, lunge, leg press |
| `pushH` | horizontal push | bench, incline bench, dip, pushup |
| `pullH` | horizontal pull | row, face pull, seal row |
| `pushV` | vertical push | OHP, push press, DB shoulder press |
| `pullV` | vertical pull | pullup, chinup, lat pulldown |
| `iso` | isolation / accessory | curl, lateral raise, calf raise, tricep ext |

**Open question:** is 7 the right number, or should it collapse to 5
(merging vertical/horizontal axes)? Current bet is 7 — losing the
push-vs-pull V/H distinction would erase information lifters care about.

---

## The visualization

See [`docs/VIZ.md`](./VIZ.md) for the deep doc. Summary here.

### What it is

A continuous **run-on** of textured set rectangles. Each set is one rounded
shape; reps within the set are marked by hairline ink seams paired with
1px viz-bg highlights (faux-letterpress). The width of each rep is
`sqrt(weight) * 0.9` — heavier reps are wider, but sqrt-scaled so 20-lb
lateral raises don't disappear.

Between sets, a small gap. Between exercises, a slightly larger gap.
Between days, a date number drops inline. New months announce themselves
with a single "APRIL" label that consumes the same horizontal space the
sets do, then the run-on continues.

When the cursor would overflow the right edge, it wraps. Days do not force
new lines; the flow is genuinely continuous.

### Why it works

1. **Every rep is visible.** No summarization. The user sees their actual work.
2. **Texture, not color, distinguishes families.** Survives at small sizes, in dark mode, in print. No accidental hierarchy.
3. **The hierarchy of gaps is the only hierarchy.** No nested boxes, no tabs, no expanded/collapsed states. The flow is the structure.
4. **It scales.** A year of training is a long block of prose, not a chart that needs zooming.

### Texture system

| Family | Texture |
|---|---|
| `hinge` | solid ink |
| `squat` | diagonal lines, 1.6px spacing |
| `pushH` | diagonal lines, 2.6px spacing |
| `pullH` | diagonal lines, 3.6px spacing |
| `pushV` | diagonal lines, 4.8px spacing |
| `pullV` | diagonal lines, 6.4px spacing |
| `iso` | empty (outline only) |

Steps are wider in the middle of the spread and tighter at the ends —
hinge→squat is intentionally close (both heavy patterns), pullV→iso is
intentionally close (both light patterns), but the middle four families
have visible separation.

### Set rendering details

- Set outline: 1px ink, 4px corner radius (clamped to half the set width for narrow sets).
- Rep seams: 0.7px ink line, inset 1.5px from top and bottom.
- Highlight pixel: 0.7px viz-bg-colored line, offset 0.7px right of the ink seam. Creates the letterpress lighting cue.
- Hinge: ink seam is omitted (invisible against ink fill); only the highlight remains, reading as a pale groove.
- Texture clip: every patterned set has a `clipPath` inset 1.5px on all four sides, so the diagonals don't kiss the rounded outline.

All numbers live in [`src/lib/viz-constants.ts`](../src/lib/viz-constants.ts).

---

## The fact engine

This is the design problem that distinguishes the product: stochastic
content, novelty calibration, taste-as-a-system.

### The constraint

Every time the user opens the app, they should see a fact that feels:

- **Specific** (a 1985 Honda Civic, not a "small car")
- **Novel** (different from the last few they've seen)
- **On-tone** (dry, slightly absurd, never hype)
- **Plausible** (the math works; the comparison lands)

### Tones to mix

| Tone | Example | When to use |
|---|---|---|
| Specific-and-weird | "47 hardcover dictionaries" | Default. Most facts should be like this. |
| Absurdist | "7 adult Bengal tigers, stacked" | When the math gives a nice round count. |
| Mundane | "≈ a 1985 Honda Civic" | Use sparingly — but well-placed, more novel than absurd. |
| Historical | "the bell of Notre-Dame" | Rare, for moments of perspective. |

### Category rotation

Recent categories should not repeat. The current implementation tracks the
last 3 shown categories in localStorage and excludes them from the next
pick. (Falls back to repeating if no candidate exists outside the
exclusion set.)

### Match algorithm

For a target weight, find references whose count (`weight ÷ reference`) is
between 0.5 and 50. Score candidates by:

- distance from a "round" count (3.0 lands better than 3.4)
- size penalty (3 of something reads better than 47 of something)

The lowest-scoring candidate wins.

### What's stubbed

The seed library has ~20 entries. Production needs ~200, curated:

- 30+ vehicles (cars, trucks, bikes, planes, boats — varied scales)
- 40+ animals (mammals, fish, dinosaurs, weird ones)
- 30+ household objects
- 20+ historical artifacts (bells, cannons, statues)
- 30+ food items (heaviest pumpkin, single grains, watermelon, etc.)
- 20+ buildings/landmarks (only at the very high end of weight)

Curation principles for whoever writes more:

- **Specificity over generality.** "1985 Honda Civic" beats "an old car."
- **Familiar but weird.** Things people can picture but don't expect to see compared.
- **Short.** Each `text` field has to fit a single deck line on a phone.
- **Real.** No making up weights. If we don't know, don't include it.


---

## Period logic

Default scope is **week** (rolling, last 7 days). Users can switch to day,
month, year, or all.

Rationale (this is in the SPEC because it's a real design call, not just an
implementation detail):

- A week is the natural training cycle. Weekly volume is the metric coaches actually care about.
- It's a satisfying chunk: long enough to feel meaningful, short enough to feel achievable.
- Mid-week opens create productive tension to finish strong.

### Scope rotation (planned, not built)

Pure repetition kills the loop. Planned weighting for the auto-shown period
on opens where the user hasn't manually set one:

- ~70% week
- ~15% month
- ~10% all-time
- ~5% something specific (e.g., "this exercise this year")

The 5% "specific" slot is the dopamine hit — when the all-time view shows
up unprompted, it's a moment ("oh damn, I've lifted three garbage trucks").

For v1: always honor the user's last-selected period. Rotation comes later.

---

## Screens

### CheckIn (built)

The primary screen. The user lands here.

```
┌─────────────────────────────┐
│  MASSED / VOL. 47    apr 27 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← editorial double rule
│  ───────────────────────── │
│                             │
│  THIS WEEK, YOU LIFTED      │  ← eyebrow
│                             │
│  ONE HONDA                  │  ← uppercase headline
│  CIVIC                      │  ← italic serif tail
│                             │
│  27,310 lbs across four     │  ← deck (italic serif)
│  sessions. mostly squats…   │
│                             │
│  THE WORK     APR 21–27     │
│  ┌─────────────────────────┐│
│  │ ▮▮▮ ▤▤▤ ▮▮ ▦▦▦  …      ││  ← run-on viz (paper-grey field)
│  └─────────────────────────┘│
│  4         27.3k       140  │
│  sessions  pounds      reps │
│                             │
│  [day][week][month][yr][all]│  ← period toggle (bottom, thumb-reach)
└─────────────────────────────┘
```

---

## What's intentionally NOT here

- Coaching, programming, "what to do next"
- Body composition, weight, photos
- Streak counters, badges, levels, XP
- Social features, sharing, "post your workout"
- Heart rate, sleep, recovery, calories
- A library of preset exercises with images
- Form videos
- Personal records as a separate concept (they're inherent in the data; we don't need to surface them as trophies)

The product is opinionated. Each of these has a reason it's not here. If
you find yourself reaching for one, write down the reason it would help
the 10-second check-in, and weigh it against the cost in surface area.

---

## Principles

These are the standalone design rules that govern the product. They're
abstracted from individual decisions but they have teeth — when a new
feature or change is being considered, run it through these.

### 1. No agent that nags

If an AI feature is being added, it must clear one of three bars:

- **(a)** It suggests something *genuinely* fun, exciting, or rewarding to do right now (not a journaling prompt, not a curiosity question, not a check-in nudge).
- **(b)** It teaches the user something they didn't already know.
- **(c)** It stays silent.

Anything else — reflection prompts, "how was your workout?" follow-ups,
encouragement nudges, suggested-next-set prompts — fails. These features
are common in fitness apps and they're consistently bad. The product
demonstrates better taste by not having them.

### 2. The data layer is forward-compatible; the UI is current-state

The data we log should be simple, fundamental, and continuously
captured, so that the substrate accrues value as models improve. Sets
and reps and weights, recorded faithfully. The UI on top of that data
can be tuned to what current models can do well; the data underneath
should outlast any specific UI design.

Practical implications:

- Don't store derived data (totals, streaks, computed insights). Compute on read.
- Don't capture lossy aggregates when raw data fits. A session is a list of sets, not a "sessionVolume: 27310" number.
- Don't tightly couple data shape to current UI. If the viz changes, the data shouldn't have to.

### 3. Less surface area, more depth

Fewer screens at higher quality beat more screens at lower quality. Each
new piece of product surface area is a tax on the design system's
coherence. A new button is not free; it has to earn its place.

When considering an addition: would removing an existing thing be a
better way to make this point?

### 4. Friction is okay where it serves the product

The lack of real-time logging is friction. The lack of a quick-add
button is friction. The requirement to type the exercise name is
friction. These are deliberate — they keep the product respectful and
unobtrusive.

Friction that *doesn't* serve the product is bad. Confusing copy. Hidden
gestures. Unclear empty states. Remove that without hesitation.

### 5. Specificity over generality, always

The cardinal rule of the voice and the fact engine, applied everywhere.
"A 1985 Honda Civic" beats "a small car." "27,310 lbs across four
sessions" beats "great work this week." "Tap to log a set" beats "Get
started."

If a string can be more specific without getting longer, make it more
specific.

### 6. Documentation is part of shipping

A feature that ships without updating SPEC or VIZ as appropriate is
incomplete. The docs *are* part of the artifact; they're not an
afterthought.

If updating the docs would be tedious, the feature is probably
introducing complexity that should be reconsidered.

---

## Voice notes

The product has a voice. It is:

- **Dry**. No hype. No exclamation points.
- **Observational**. "27,310 lbs across four sessions" is a statement, not a celebration.
- **Specific**. "A 1985 Honda Civic" not "approximately one car."
- **Slightly absurd** when the moment calls for it. Never forced.
- **Never preachy**. This is not a wellness app. The lifter is doing the work; we are noticing it.

### Numbers

Numbers carry the voice as much as the words do.

- **Comma-separated for thousands.** "27,310" reads as a real measurement; "27310" reads as a database row.
- **No rounding cliffs.** Use "27k" only when space is genuinely tight; otherwise keep the full number. Premature rounding makes the work feel approximate.
- **Lowercase units.** "lbs", "kg" — not "LBS".

When in doubt: would a friend say this in a text? If no, rewrite.

This applies to fact copy, eyebrow labels, error states, empty states, and
push notifications (when those exist).

---

## Brand

The product is called **massed**.

- Primary type: Fraunces (display), Bricolage Grotesque (headlines), IBM Plex Sans (body), IBM Plex Mono (labels & numerics).
- Color: cream paper (`#faf6ec`) on warm grey deck (`#efece6`); ink (`#14130f`); muted (`#6e6a60`); rules (`#d6d2c7`); viz field (`#ebe8de`). No accents.

Tokens are in [`src/styles/tokens.css`](../src/styles/tokens.css).
