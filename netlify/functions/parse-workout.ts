/**
 * Netlify function — production equivalent of the Vite dev middleware
 * in vite.config.ts. Both paths feed the same pure handler in
 * `server/parseWorkout.ts`; only the request/response plumbing differs.
 *
 * The API key is read from the Netlify environment and never sent to
 * the client. Configure ANTHROPIC_API_KEY in the Netlify site UI.
 */

import { parseWorkout } from '../../server/parseWorkout';

// Minimal shim so this file can typecheck without @types/node — we only
// need process.env. The full Node types pull in globals that overlap
// with the web types this file already uses (Request, Response).
declare const process: { env: Record<string, string | undefined> };

const JSON_HEADERS = { 'content-type': 'application/json' };

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';

  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = typeof body.transcript === 'string' ? body.transcript : '';
    const out = await parseWorkout({ transcript, apiKey });
    return new Response(JSON.stringify(out), { status: 200, headers: JSON_HEADERS });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
