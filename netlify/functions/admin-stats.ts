/**
 * Admin-only stats endpoint for the in-app dashboard at /admin.
 *
 * Auth: a single ADMIN_TOKEN env var. The client sends it in the
 * `Authorization: Bearer <token>` header. Constant-time compare so a
 * timing attack against a long random token isn't realistic.
 *
 * Data: three Postgres views in Supabase, queried via PostgREST using
 * the service-role key (bypasses RLS so the views actually return
 * rows). The service-role key NEVER reaches the client — only this
 * function and Supabase see it.
 *
 * Required env vars:
 *   ADMIN_TOKEN                long random string; you set it
 *   SUPABASE_URL               already set for the parse function
 *   SUPABASE_SERVICE_ROLE_KEY  Settings → API → service_role
 */

declare const process: { env: Record<string, string | undefined> };

const JSON_HEADERS = { 'content-type': 'application/json' };

interface RecentRow {
  created_at: string;
  transcript: string | null;
  parsed_row_count: number | null;
  success: boolean;
  country: string | null;
  city: string | null;
}

interface DailyRow {
  day: string;
  events: number;
  successful: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

interface CountryRow {
  country: string;
  events: number;
  unique_visitors: number;
  cost_usd: number;
}

interface AdminStats {
  recent: RecentRow[];
  daily: DailyRow[];
  countries: CountryRow[];
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const adminToken = process.env.ADMIN_TOKEN ?? '';
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!adminToken || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'admin dashboard not configured.' }),
      { status: 501, headers: JSON_HEADERS }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const supplied = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  if (!constantTimeEqual(supplied, adminToken)) {
    return new Response(JSON.stringify({ error: 'unauthorized.' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  try {
    const [recent, daily, countries] = await Promise.all([
      query<RecentRow>(supabaseUrl, serviceKey, 'parse_events_recent'),
      query<DailyRow>(supabaseUrl, serviceKey, 'parse_events_daily'),
      query<CountryRow>(supabaseUrl, serviceKey, 'parse_events_by_country'),
    ]);
    const body: AdminStats = { recent, daily, countries };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};

async function query<T>(
  url: string,
  serviceKey: string,
  view: string
): Promise<T[]> {
  const res = await fetch(`${url}/rest/v1/${view}?select=*`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`supabase ${view} ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T[];
}

// Constant-time string compare. Length mismatch short-circuits — for a
// fixed-length random token, leaking length doesn't help an attacker.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
