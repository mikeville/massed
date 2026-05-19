import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from './types';
import {
  fetchGist,
  findOrCreateGist,
  formatGistError,
  parseGistInput,
  probeGist,
  pushGist,
  type GistConfig,
} from './gistSync';

/* useGistSync — sidecar to useSessions that mirrors local state to a
   user-owned GitHub gist.

   Storage layout (all in localStorage):
     massed:gist:config        { gistId, pat }
     massed:gist:lastSyncedAt  ISO timestamp of the last successful push
                               or pull
     massed:gist:hasPulled     '1' once we've ever pulled — flag is
                                reserved for future "auto-pull on cold
                                start with empty local" UX; not used by
                                the hook itself yet

   Auto-push: any change to `sessions` schedules a 5s debounced PATCH.
   The mount render is suppressed via a ref so hydration doesn't trigger
   a spurious push.

   Race policy: pushes are fire-and-forget. If two pushes overlap on the
   network, GitHub processes them last-write-wins by completion order;
   any drift self-corrects on the next change. Acceptable for a
   personal, single-device tool. */

const CONFIG_KEY = 'massed:gist:config';
const LAST_SYNCED_KEY = 'massed:gist:lastSyncedAt';
const HAS_PULLED_KEY = 'massed:gist:hasPulled';
const DEBOUNCE_MS = 5000;

export type SyncStatus =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'syncing' }
  | { kind: 'synced'; at: string }
  | { kind: 'error'; message: string };

export interface UseGistSync {
  config: GistConfig | null;
  status: SyncStatus;
  lastSyncedAt: string | null;
  saveConfig: (input: { gistInput: string; pat: string }) => void;
  clearConfig: () => void;
  pushNow: () => Promise<void>;
  pullNow: () => Promise<{ ok: true } | { ok: false; error: string }>;
  testConnection: (input: {
    gistInput: string;
    pat: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** One-shot connect: take a token, find or create a massed.json gist,
      persist the config. The "gist id" never crosses the UI. */
  connectWithToken: (
    pat: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

function loadConfig(): GistConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.gistId === 'string' &&
      typeof parsed.pat === 'string'
    ) {
      return { gistId: parsed.gistId, pat: parsed.pat };
    }
  } catch {
    /* fall through */
  }
  return null;
}

export function useGistSync(
  sessions: Session[],
  setSessions: (s: Session[]) => void,
): UseGistSync {
  const [config, setConfig] = useState<GistConfig | null>(() => loadConfig());
  const [status, setStatus] = useState<SyncStatus>({ kind: 'idle' });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNCED_KEY),
  );

  /* Refs let the debounced push read the latest values without
     re-creating the timer effect on every render. */
  const sessionsRef = useRef(sessions);
  const configRef = useRef(config);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const timerRef = useRef<number | null>(null);
  /* Skip the first sessions effect after mount so localStorage hydration
     doesn't fire a push. Also re-set after pullNow so the post-pull
     setSessions doesn't immediately push the data we just pulled. */
  const suppressNextRef = useRef(true);

  const doPush = useCallback(async (): Promise<void> => {
    const c = configRef.current;
    if (!c) return;
    setStatus({ kind: 'syncing' });
    try {
      await pushGist(c, sessionsRef.current);
      const at = new Date().toISOString();
      localStorage.setItem(LAST_SYNCED_KEY, at);
      setLastSyncedAt(at);
      setStatus({ kind: 'synced', at });
    } catch (e) {
      setStatus({ kind: 'error', message: formatGistError(e) });
    }
  }, []);

  useEffect(() => {
    if (suppressNextRef.current) {
      suppressNextRef.current = false;
      return;
    }
    if (!configRef.current) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setStatus({ kind: 'pending' });
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void doPush();
    }, DEBOUNCE_MS);
  }, [sessions, doPush]);

  const saveConfig: UseGistSync['saveConfig'] = useCallback(
    ({ gistInput, pat }) => {
      const next: GistConfig = {
        gistId: parseGistInput(gistInput),
        pat: pat.trim(),
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      setConfig(next);
      setStatus({ kind: 'idle' });
    },
    [],
  );

  const clearConfig: UseGistSync['clearConfig'] = useCallback(() => {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(LAST_SYNCED_KEY);
    localStorage.removeItem(HAS_PULLED_KEY);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setConfig(null);
    setLastSyncedAt(null);
    setStatus({ kind: 'idle' });
  }, []);

  const pushNow: UseGistSync['pushNow'] = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await doPush();
  }, [doPush]);

  const pullNow: UseGistSync['pullNow'] = useCallback(async () => {
    const c = configRef.current;
    if (!c) return { ok: false as const, error: 'no gist configured' };
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus({ kind: 'syncing' });
    try {
      const remote = await fetchGist(c);
      suppressNextRef.current = true;
      setSessions(remote);
      localStorage.setItem(HAS_PULLED_KEY, '1');
      const at = new Date().toISOString();
      localStorage.setItem(LAST_SYNCED_KEY, at);
      setLastSyncedAt(at);
      setStatus({ kind: 'synced', at });
      return { ok: true as const };
    } catch (e) {
      const error = formatGistError(e);
      setStatus({ kind: 'error', message: error });
      return { ok: false as const, error };
    }
  }, [setSessions]);

  const testConnection: UseGistSync['testConnection'] = useCallback(
    async ({ gistInput, pat }) => {
      const trial: GistConfig = {
        gistId: parseGistInput(gistInput),
        pat: pat.trim(),
      };
      try {
        await probeGist(trial);
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: formatGistError(e) };
      }
    },
    [],
  );

  const connectWithToken: UseGistSync['connectWithToken'] = useCallback(
    async (pat) => {
      const trimmed = pat.trim();
      if (!trimmed) {
        return { ok: false as const, error: 'paste your token first' };
      }
      setStatus({ kind: 'syncing' });
      try {
        const { gistId, created } = await findOrCreateGist(
          trimmed,
          sessionsRef.current,
        );
        const next: GistConfig = { gistId, pat: trimmed };
        localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
        setConfig(next);
        if (!created) {
          // Existing gist on the account — treat it as canonical so a
          // returning user on a new device gets their data back. The
          // suppress flag prevents the resulting setSessions from
          // triggering an auto-push of stale local data.
          const remote = await fetchGist({ gistId, pat: trimmed });
          suppressNextRef.current = true;
          setSessions(remote);
          localStorage.setItem(HAS_PULLED_KEY, '1');
        }
        const at = new Date().toISOString();
        localStorage.setItem(LAST_SYNCED_KEY, at);
        setLastSyncedAt(at);
        setStatus({ kind: 'synced', at });
        return { ok: true as const };
      } catch (e) {
        const error = formatGistError(e);
        setStatus({ kind: 'error', message: error });
        return { ok: false as const, error };
      }
    },
    [setSessions],
  );

  return {
    config,
    status,
    lastSyncedAt,
    saveConfig,
    clearConfig,
    pushNow,
    pullNow,
    testConnection,
    connectWithToken,
  };
}
