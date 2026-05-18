import { useEffect, useState } from 'react';
import type { FunFact, Period } from './types';
import { nextFact, nextRandomFact } from './facts';

/**
 * Stable fact picking — same `(period, total)` returns the same fact
 * across reloads and tab returns. Re-rolls only when the underlying
 * total changes meaningfully, the period changes, or the 24h TTL
 * elapses (so tomorrow's open gets fresh variety on identical data).
 *
 * The cache key rounds `total` to the nearest 10 lb so that trivial
 * day-to-day fluctuation doesn't re-pick a fact. Anyone hitting that
 * boundary will see a re-roll, but the boundary is narrow enough that
 * it almost never matters in practice — and the variety it produces
 * is welcome, not annoying.
 *
 * Note: localStorage access is guarded so this hook is safe to call
 * during SSR or in test environments where `window` may not exist.
 */
const CACHE_PREFIX = 'massed:fact:';
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Dev escape hatch — when enabled, the cache is bypassed and every
 * render picks a fresh fact. Useful when iterating on the fact pool
 * and you want to refresh the page to sample variety.
 *
 * Two ways to enable, whichever's easier in the moment:
 *
 *   1. URL query param — append `?freshFact` to the URL. Sticks for
 *      the current tab; clear by removing the param.
 *   2. localStorage flag — `localStorage.setItem('massed:dev:fresh-fact', '1')`
 *      in the console. Persists across sessions. Clear with
 *      `localStorage.removeItem('massed:dev:fresh-fact')`.
 *
 * Either being present is enough to enable fresh mode.
 */
const DEV_FRESH_FACT_KEY = 'massed:dev:fresh-fact';
const DEV_FRESH_FACT_QUERY = 'freshFact';

interface CachedFact {
  fact: FunFact | null;
  ts: number;
}

export function useStableFact(period: Period, total: number): FunFact | null {
  const [fact, setFact] = useState<FunFact | null>(() =>
    resolveFact(period, total)
  );

  useEffect(() => {
    setFact(resolveFact(period, total));
  }, [period, total]);

  return fact;
}

function resolveFact(period: Period, total: number): FunFact | null {
  if (isDevFreshFactEnabled()) {
    // Random pick (not the deterministic scorer). Without randomness,
    // the dev path converged to a stable cycle and refreshes showed
    // the same fact every time.
    return nextRandomFact(total);
  }
  const key = cacheKey(period, total);
  const cached = readCache(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.fact;
  }
  const fresh = nextFact(total);
  writeCache(key, { fact: fresh, ts: Date.now() });
  return fresh;
}

function isDevFreshFactEnabled(): boolean {
  // URL query takes precedence — most discoverable.
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has(DEV_FRESH_FACT_QUERY)) return true;
    }
  } catch {
    /* fall through to localStorage check */
  }
  try {
    return localStorage.getItem(DEV_FRESH_FACT_KEY) === '1';
  } catch {
    // storage unavailable (e.g. private mode) → assume dev mode is off
    return false;
  }
}

/**
 * Cache key is keyed by period and total rounded to 10 lb buckets.
 * Exported for tests — the pure-string output is the part worth
 * asserting against, and it lets us reason about cache hits/misses
 * without touching the DOM.
 */
export function cacheKey(period: Period, total: number): string {
  const bucket = Math.round(total / 10) * 10;
  return `${CACHE_PREFIX}${period}:${bucket}`;
}

function readCache(key: string): CachedFact | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFact;
    if (typeof parsed?.ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: CachedFact): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable; degrade silently */
  }
}
