import type { Session } from '../lib/types';

/**
 * Remote seed — the *living* demo source.
 *
 * Cold-load flow: a visitor with empty localStorage instantly renders
 * the bundled `SEED_SESSIONS` (in `seed.ts`), then this fetch fires in
 * the background. On success, the bundled snapshot is replaced with the
 * remote contents — keeping the deployed demo in sync with Mike's
 * personal sync gist without re-shipping the bundle.
 *
 * The URL points at a public gist whose raw endpoint is anonymously
 * fetchable and CDN-cached (~5 min). Same gist is the write target of
 * the PAT-authenticated sync in `useGistSync.ts`, so Mike's edits flow
 * end-to-end: app edit → gist push → demo refresh.
 *
 * Any failure (network, 404, malformed JSON, non-array payload) returns
 * null and the caller keeps showing the bundled snapshot. No throws,
 * no console noise — the bundled fallback is good enough.
 */

const REMOTE_SEED_URL =
  'https://gist.githubusercontent.com/mikeville/62f3a9f7097f2a196b93d88e0a580fac/raw/massed.json';

export async function fetchRemoteSeed(): Promise<Session[] | null> {
  try {
    const res = await fetch(REMOTE_SEED_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    return parsed as Session[];
  } catch {
    return null;
  }
}
