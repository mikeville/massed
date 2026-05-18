# CLAUDE.md

*Read in this order: this file → `README.md` → `docs/SPEC.md`. Then `docs/VIZ.md` if you'll be touching the viz.*

You're working on **massed**, a minimalist resistance training tracker.
The project is at the seed stage: design system established, primary
screen built, prototype-quality but real React/TS code.

## Your job

`docs/SPEC.md` is the current statement of design intent. Don't quietly
drift from it — if you find a real reason to challenge something there,
raise the trade-off explicitly and let it be a conscious change rather
than an accidental one.

## How to work in this repo

- **Tokens, not magic numbers.** If you reach for a color or spacing value, check `src/styles/tokens.css` first. If it doesn't exist, add it there.
- **Viz constants are dual-sourced.** Change `src/lib/viz-constants.ts` AND mirror in `tokens.css`.
- **Keep dependencies near zero.** No Tailwind, no UI kits, no charting libraries. The constraint is the point.
- **No tests for visual output.** Test math (`totals.ts`, `facts.ts`). Viz is regression-checked by eye.
- **Type strictly.** `tsconfig.json` has `strict: true` and `noUnused*: true`. Make new code clean by those rules.
- **Plain CSS, not CSS-in-JS.** One CSS file per component, colocated.

## Voice

The product is dry, lowercase, observational. See `docs/SPEC.md § Voice
notes`. This applies to every string the user sees: button labels, error
states, empty states, fact copy. If you find yourself writing something
upbeat or marketing-y, rewrite it.

## Things to flag rather than decide alone

- Adding a dependency (any size).
- Changing the texture system or sqrt scaling in the viz.
- Adding a new screen not in `SPEC.md § Screens`.
- Changing the data model in `src/lib/types.ts`.
- Adding any kind of analytics, tracking, or remote calls.

For those: leave a comment, raise it in conversation, and propose an
approach with trade-offs. Then wait.

## Things to just do

- Bug fixes
- Type improvements
- Refactors that reduce LOC without changing behavior
- Better comments where the code is doing something subtle
- New tokens for values you find yourself wanting

## Quality bar

1. **Visible craft.** The output looks designed. The CSS is clean. The TypeScript reads well.
2. **Legible system.** Someone reading the code should understand the design principles without external explanation.
3. **No mystery.** Every non-obvious choice has a comment explaining why. The cost of writing the comment is trivial; the cost of NOT writing it compounds.

If you're producing code that doesn't meet this bar, slow down. The
project does not benefit from speed at the cost of quality.

## Quick orientation

```
src/
  App.tsx                   # ◆ shell — wires data + period + fact
  components/
    CheckInScreen.tsx       # ◆ primary screen (built)
    RunOnViz.tsx            # ◆ the visualization (built, pinned)
  lib/
    types.ts                # ◆ data model (pinned)
    viz-constants.ts        # ◆ viz geometry (pinned)
    totals.ts               # math
    facts.ts                # fact engine v0
    useSessions.ts          # localStorage hook
  data/
    seed.ts                 # one week of seed data
  styles/
    tokens.css              # ◆ design tokens (pinned)

docs/
  SPEC.md                   # ◆ what & why (read first)
  VIZ.md                    # how the viz works
```

◆ = read first
"pinned" = don't change without conversation
