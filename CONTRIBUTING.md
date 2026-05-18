# Contributing

massed is a small, opinionated project. Contributions are welcome, but
the bar for changes is shape-fit, not just correctness.

## Before opening a PR

1. **Read `CLAUDE.md`** first. The working principles there apply to
   humans too — token-first styling, plain CSS modules, dependencies
   stay near zero.
2. **Read `docs/SPEC.md`.** Several non-goals and design principles
   are intentional and have a reason. If a PR would reverse one, raise
   it in an issue first and surface the trade-off.
3. **Match the voice.** UI strings are lowercase, dry, observational.
   No marketing voice, no exclamation points.

## What's in scope

- Bug fixes
- Type improvements
- Refactors that reduce LOC without changing behavior
- Better comments where the code is doing something subtle
- New tokens in `src/styles/tokens.css` for values you find yourself wanting

## What's out of scope (without prior discussion)

- Adding a dependency (any size — the constraint is the point)
- Charting libraries, UI kits, Tailwind
- Backend or accounts
- Streaks, badges, gamification (see `SPEC.md § What's intentionally NOT here`)
- Coaching, "what to do next" features (see `SPEC.md § Non-goals for MVP`)

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm test             # vitest, math only
npm run build
```

The viz is regression-checked by eye, not by test. If your change
touches the viz, attach a before/after screenshot to the PR.

## Bug reports

Use the bug report issue template. Include the steps to reproduce, the
exact text of any error, and what you expected to see instead.

## Feature requests

Use the feature request template. Lead with the user problem, not the
proposed implementation. Many features are out of scope by design —
see `SPEC.md` for the ones that are and why.
