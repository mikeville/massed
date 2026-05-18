#!/usr/bin/env bash
# One-shot bootstrap for massed.
# Installs deps, copies .env.example -> .env if missing, prints next steps.

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "error: node not found. install Node 20+ (https://nodejs.org)."
  exit 1
fi

NODE_MAJOR=$(node -v | sed -E 's/^v([0-9]+)\..*/\1/')
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo "warning: node ${NODE_MAJOR} detected. vitest 4 needs node 20+."
fi

echo "→ installing dependencies"
npm install

if [ ! -f .env ]; then
  echo "→ creating .env from template"
  cp .env.example .env
  echo "  (voice mode needs an ANTHROPIC_API_KEY; edit .env to enable)"
fi

echo ""
echo "ready."
echo ""
echo "  npm run dev          start dev server at http://localhost:5173"
echo "  npm run typecheck    strict tsc"
echo "  npm test             vitest (math only)"
echo "  npm run build        production build"
