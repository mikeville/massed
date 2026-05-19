import type { Family } from './types';

/**
 * Client wrapper around the /api/parse-workout endpoint.
 *
 * Network shape mirrors the server-side `parseWorkout` handler.
 * Duplicated here intentionally — client and server should not share
 * a build graph through random unrelated modules.
 */

export interface ParsedRow {
  name: string;
  family: Family;
  reps: number;
  weight: number;
}

export interface ParsedWorkout {
  rows: ParsedRow[];
}

export async function parseWorkout(transcript: string): Promise<ParsedWorkout> {
  // Relative path (no leading slash) so the request resolves under
  // whatever prefix the page was served at — root for a standalone
  // deploy, or a sub-path when this app is proxied beneath another
  // site. Assumes flat routes (one path segment after the prefix);
  // deeper nesting would need an explicit anchor to the app root.
  const res = await fetch('api/parse-workout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const fallback = `parse failed (${res.status}).`;
    let detail = '';
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === 'string') detail = body.error;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(detail || fallback);
  }
  return (await res.json()) as ParsedWorkout;
}
