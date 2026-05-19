/**
 * Netlify function — production equivalent of the Vite dev middleware
 * in vite.config.ts. Both paths feed the same pure handler in
 * `server/parseWorkout.ts`; only the request/response plumbing differs.
 *
 * The API key is read from the Netlify environment and never sent to
 * the client. Configure ANTHROPIC_API_KEY in the Netlify site UI.
 *
 * This function also logs one row per parse (success or failure) to
 * Supabase: transcript, token usage, computed cost, Netlify geo, and a
 * salted hash of the client IP. Logging is best-effort with a short
 * abort cap — if Supabase is slow or unset, the parse response still
 * returns normally. The dev middleware deliberately does NOT log, so
 * `npm run dev` won't pollute the production dataset.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   the parse model key
 *   SUPABASE_URL        project URL (e.g. https://xxx.supabase.co)
 *   SUPABASE_ANON_KEY   anon JWT — table RLS allows insert only
 *   IP_HASH_SALT        any long random string; rotating it severs
 *                       continuity of "unique visitor" identity
 */

import { parseWorkout } from '../../server/parseWorkout';
import { costUsd } from '../../server/pricing';
import { logParseEvent, type ParseEvent } from '../../server/logEvent';

declare const process: { env: Record<string, string | undefined> };

const JSON_HEADERS = { 'content-type': 'application/json' };

// The DB schema doesn't enforce text length, so we cap here. Pathological
// inputs would bloat row size and Supabase free-tier storage.
const MAX_TRANSCRIPT_LEN = 4000;
const MAX_UA_LEN = 500;
const MAX_ERR_LEN = 2000;

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? '';
  const ipSalt = process.env.IP_HASH_SALT ?? '';

  const body = (await request.json().catch(() => ({}))) as { transcript?: unknown };
  const transcript = typeof body.transcript === 'string' ? body.transcript : '';

  const visitor = await readVisitor(request, ipSalt);

  try {
    const result = await parseWorkout({ transcript, apiKey });
    await maybeLog(supabaseUrl, supabaseKey, {
      transcript: truncate(transcript, MAX_TRANSCRIPT_LEN),
      parsed_row_count: result.workout.rows.length,
      success: true,
      error_message: null,
      model: result.model,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      cost_usd: costUsd(result.model, result.usage),
      ...visitor,
    });
    return new Response(JSON.stringify(result.workout), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    await maybeLog(supabaseUrl, supabaseKey, {
      transcript: truncate(transcript, MAX_TRANSCRIPT_LEN),
      parsed_row_count: null,
      success: false,
      error_message: truncate(message, MAX_ERR_LEN),
      model: null,
      input_tokens: null,
      output_tokens: null,
      cost_usd: null,
      ...visitor,
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};

async function maybeLog(
  url: string,
  anonKey: string,
  event: ParseEvent
): Promise<void> {
  if (!url || !anonKey) return;
  await logParseEvent({ url, anonKey }, event);
}

interface VisitorFields {
  country: string | null;
  city: string | null;
  region: string | null;
  ip_hash: string | null;
  user_agent: string | null;
}

async function readVisitor(request: Request, salt: string): Promise<VisitorFields> {
  const geo = readGeo(request);
  const ip = readClientIp(request);
  return {
    country: geo.country,
    city: geo.city,
    region: geo.region,
    ip_hash: ip && salt ? await hashIp(ip, salt) : null,
    user_agent: truncate(request.headers.get('user-agent'), MAX_UA_LEN),
  };
}

interface NetlifyGeoPayload {
  country?: { code?: string };
  subdivision?: { code?: string };
  city?: string;
}

function readGeo(request: Request): {
  country: string | null;
  city: string | null;
  region: string | null;
} {
  // Netlify ships geo as a base64-encoded JSON blob in x-nf-geo.
  const raw = request.headers.get('x-nf-geo');
  if (!raw) return { country: null, city: null, region: null };
  try {
    const decoded = JSON.parse(atob(raw)) as NetlifyGeoPayload;
    return {
      country: decoded.country?.code ?? null,
      city: decoded.city ?? null,
      region: decoded.subdivision?.code ?? null,
    };
  } catch {
    return { country: null, city: null, region: null };
  }
}

function readClientIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-nf-client-connection-ip');
}

// Salted SHA-256 → first 32 hex chars. Web Crypto avoids a node:crypto
// import (and the @types/node dep that would come with it). 128 bits of
// hash is overkill for "is this the same visitor" but the cost is zero.
async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function truncate(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}
