/**
 * Logging to the Supabase parse_events table.
 *
 * The caller has already returned the parse response (or is about to)
 * by the time we log. If Supabase is slow or unreachable, swallow the
 * error — telemetry failures must never affect the user.
 *
 * We `await` rather than truly fire-and-forget because serverless
 * platforms freeze execution once the response returns, which would
 * orphan a detached promise. A short abort cap keeps the worst case
 * bounded.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface ParseEvent {
  transcript: string | null;
  parsed_row_count: number | null;
  success: boolean;
  error_message: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  country: string | null;
  city: string | null;
  region: string | null;
  ip_hash: string | null;
  user_agent: string | null;
}

// Well below Netlify's 10s function timeout; a healthy POST is ~50–150ms.
const LOG_TIMEOUT_MS = 1500;

export async function logParseEvent(
  config: SupabaseConfig,
  event: ParseEvent
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOG_TIMEOUT_MS);
  try {
    await fetch(`${config.url}/rest/v1/parse_events`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
  } catch {
    // intentionally swallowed — telemetry must never break parse
  } finally {
    clearTimeout(timeout);
  }
}
