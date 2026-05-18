# massed

A minimalist resistance training tracker. Log sets. See total weight lifted
across a period. Get fun facts about that weight. That's it.

> The product spec lives in [`docs/SPEC.md`](./docs/SPEC.md). Working
> conventions for contributors and AI assistants are in
> [`CLAUDE.md`](./CLAUDE.md).

## Stack

- React 18 + TypeScript
- Vite (dev server + build)
- Plain CSS modules with CSS custom properties (`tokens.css` is the design-system root)
- LocalStorage for persistence (single-device for now)

No router, no state library, no UI kit. The point is to keep dependencies near
zero so the design system stays legible.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build
npm run preview
```

### Voice mode (optional)

`/log` opens in **voice mode** by default: speak (or type) a workout
description, the app parses it into structured sets, you confirm. The
parse runs through a Claude API call, proxied by the Vite dev server so
the API key stays out of the browser.

To enable it locally, drop your key in `.env`:

```bash
cp .env.example .env
# then edit .env to set ANTHROPIC_API_KEY=sk-...
```

Without a key, voice mode still loads — but the **parse** step will
return an error. Toggle to **manual** in the `/log` header to use the
original form. The manual path works with no key configured.

When deploying, set `ANTHROPIC_API_KEY` as a server-side env var on the
host (e.g. Netlify Functions, Vercel Functions). The `server/parseWorkout.ts`
module is framework-agnostic and ports cleanly.

## Project structure

```
src/
  App.tsx                    # shell: wires data + period + fact engine
  main.tsx                   # entry
  components/
    CheckInScreen.tsx        # editorial "headline" check-in layout
    CheckInScreen.css
    RunOnViz.tsx             # the textured run-on viz (the heart of the system)
  lib/
    types.ts                 # Session, Family, Period, FunFact
    viz-constants.ts         # geometry & colors used by RunOnViz
    totals.ts                # totalWeight(), filterByPeriod()
    facts.ts                 # FACT_REFERENCES + pickFact() + nextFact()
    useSessions.ts           # localStorage-backed session store
  data/
    seed.ts                  # one week of seed data, rolling
  styles/
    tokens.css               # design tokens (color, type, spacing, viz constants)
    global.css               # resets + base type
docs/
  SPEC.md                    # full product spec (read first)
  VIZ.md                     # deep doc on the run-on visualization
```

## What's built vs. what's stubbed

**Built:**
- `RunOnViz` — texture system, sqrt scaling, set rounding, rep seams, label flow
- `CheckInScreen` — editorial layout matching the prototype mockup
- `pickFact` / `nextFact` — fact engine v0 with category rotation
- `totalWeight` / `filterByPeriod` — the math that drives everything
- LocalStorage persistence

**Not built:**
- Week-vs-week comparisons
- Onboarding (currently dumps the user straight into a populated check-in)

## Working with the code

The viz is the soul of the product. If you're adjusting it:

1. **Change geometry constants in `viz-constants.ts`** — they're shared with `tokens.css` (mirror any change).
2. **Texture density spread** is in `RunOnViz.tsx`'s `PATTERN_SPECS` — current values are calibrated.
3. **The layout pass is one-shot.** If you need hierarchical gaps (set vs. exercise vs. day vs. month), the tokenizer needs to emit boundary metadata and the layout function needs to read it. See the comment in `RunOnViz.tsx`.

The fact engine is the most active R&D area. See `docs/SPEC.md § Fact engine` for the design questions still open.
