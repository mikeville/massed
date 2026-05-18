import type { Session } from './types';

/* gistSync — pure HTTP wrappers around the GitHub Gists API.
   Direct fetch, no SDK. Errors are thrown as { status?, message }. */

export const GIST_FILENAME = 'massed.json';
// Pre-rename filename, kept around for one-time read fallback when the
// user's existing gist still has the old file. Safe to delete after the
// first successful push, which writes massed.json.
const LEGACY_GIST_FILENAME = 'tonnage.json';
const GIST_API = 'https://api.github.com/gists';

export interface GistConfig {
  gistId: string;
  pat: string;
}

export interface GistError {
  status?: number;
  message: string;
}

/** Accept a full gist URL or a bare ID. Strips the user-segment if present. */
export function parseGistInput(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i);
  if (urlMatch) return urlMatch[1];
  return trimmed;
}

async function gistFetch(path: string, init: RequestInit, pat: string): Promise<Response> {
  const res = await fetch(`${GIST_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') detail = body.message;
    } catch {
      /* body might not be JSON */
    }
    /* Some HTTP/2 backends return empty statusText, so build the message
       from whichever pieces actually carry signal. */
    const parts = [String(res.status), res.statusText, detail]
      .map((p) => p.trim())
      .filter(Boolean);
    const err: GistError = {
      status: res.status,
      message: parts.join(' ').toLowerCase(),
    };
    throw err;
  }
  return res;
}

/* Fetch the gist and parse the massed.json file as Session[]. Returns
   an empty array if the file exists but is empty. Throws GistError on
   network/auth failures or a missing data file. Falls back to the
   legacy tonnage.json once for gists that predate the rename. */
export async function fetchGist(config: GistConfig): Promise<Session[]> {
  const res = await gistFetch(
    `/${encodeURIComponent(config.gistId)}`,
    { method: 'GET' },
    config.pat,
  );
  const data = await res.json();
  const file = data?.files?.[GIST_FILENAME] ?? data?.files?.[LEGACY_GIST_FILENAME];
  if (!file) {
    throw { message: `gist has no ${GIST_FILENAME} file yet — push first to create it` } as GistError;
  }
  const content = typeof file.content === 'string' ? file.content : '';
  if (!content.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw { message: `${GIST_FILENAME} is not valid json` } as GistError;
  }
  if (!Array.isArray(parsed)) {
    throw { message: `${GIST_FILENAME} is not a sessions array` } as GistError;
  }
  return parsed as Session[];
}

/* PATCH the gist with the given sessions. Creates massed.json on the
   gist if it doesn't exist yet. */
export async function pushGist(config: GistConfig, sessions: Session[]): Promise<void> {
  const body = JSON.stringify({
    files: { [GIST_FILENAME]: { content: JSON.stringify(sessions, null, 2) } },
  });
  await gistFetch(
    `/${encodeURIComponent(config.gistId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
    config.pat,
  );
}

/* Lightweight existence/auth probe used by the "test connection" button.
   Returns success without parsing the file — a gist with no massed.json
   is still a valid target (push will create it). */
export async function probeGist(config: GistConfig): Promise<void> {
  await gistFetch(
    `/${encodeURIComponent(config.gistId)}`,
    { method: 'GET' },
    config.pat,
  );
}

export function formatGistError(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  if (e instanceof Error) return e.message.toLowerCase();
  return 'unknown error';
}
