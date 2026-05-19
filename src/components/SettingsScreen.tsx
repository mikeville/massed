import { useState } from 'react';
import { Link } from 'wouter';
import type { SyncStatus, UseGistSync } from '../lib/useGistSync';
import styles from './SettingsScreen.module.css';

/* SettingsScreen — the only place a user wires up cross-device sync.
   Reachable from the gear icon on /log, or by URL.

   Two faces:
   - not connected → a two-step wizard. "open github" launches the
     token form with the right scope already selected; "connect" then
     finds an existing massed.json gist on the account or mints a new
     one. The user never thinks about a "gist id".
   - connected → status, push/pull, disconnect. */

// Pre-fills the classic-PAT form: name = "massed", scope = gist.
// Classic tokens are deprecated-but-supported by GitHub; chosen here
// because the fine-grained equivalent can't pre-select the gists
// permission and would re-introduce the multi-step friction.
const TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=massed';

export interface SettingsScreenProps {
  sync: UseGistSync;
}

function relativeTimeFrom(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function statusLine(status: SyncStatus, lastSyncedAt: string | null): string {
  switch (status.kind) {
    case 'idle':
      return lastSyncedAt
        ? `last synced ${relativeTimeFrom(lastSyncedAt)}.`
        : 'not synced yet.';
    case 'pending':
      return 'change queued — pushing in a few seconds.';
    case 'syncing':
      return 'syncing…';
    case 'synced':
      return `synced ${relativeTimeFrom(status.at)}.`;
    case 'error':
      return `sync failed: ${status.message}`;
  }
}

export function SettingsScreen({ sync }: SettingsScreenProps) {
  const { config } = sync;

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← back
        </Link>
        <h1 className={styles.title}>sync</h1>
      </header>

      {config ? <Connected sync={sync} /> : <NotConnected sync={sync} />}
    </article>
  );
}

function NotConnected({ sync }: { sync: UseGistSync }) {
  const [pat, setPat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    setBusy(true);
    const result = await sync.connectWithToken(pat);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <>
      <p className={styles.intro}>
        this browser is the only place your workouts exist. set up sync
        and they live in a private file on your{' '}
        <em>own</em> github — your data, your file, no server in the
        middle.
      </p>

      <section className={styles.step}>
        <h2 className={styles.heading}>1. get a token</h2>
        <p className={styles.copy}>
          this is a key from github that lets massed read and write that
          one file. the link below pre-fills the right name and
          permission — on the github page, scroll past the expiration
          field and tap <em>generate token</em>, then copy what it shows
          you.
        </p>
        <a
          className={styles.linkBtn}
          href={TOKEN_URL}
          target="_blank"
          rel="noreferrer"
        >
          open github →
        </a>
      </section>

      <section className={styles.step}>
        <h2 className={styles.heading}>2. paste it here</h2>
        <input
          type="password"
          value={pat}
          onChange={(e) => {
            setPat(e.target.value);
            setError(null);
          }}
          placeholder="ghp_… or github_pat_…"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className={styles.input}
          aria-label="github token"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy || pat.trim().length === 0}
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
        >
          {busy ? 'connecting…' : 'connect'}
        </button>
        <p className={styles.note}>
          the token lives only in this browser's storage. it never leaves
          for anywhere but github. if you've used massed before on
          another device, we'll find your existing file automatically.
        </p>
      </section>
    </>
  );
}

function Connected({ sync }: { sync: UseGistSync }) {
  const { config, status, lastSyncedAt } = sync;
  const [busy, setBusy] = useState(false);

  async function handlePush() {
    setBusy(true);
    await sync.pushNow();
    setBusy(false);
  }

  async function handlePull() {
    const ok = window.confirm(
      'pull from github will overwrite this device with the latest stored data. continue?',
    );
    if (!ok) return;
    setBusy(true);
    await sync.pullNow();
    setBusy(false);
  }

  function handleDisconnect() {
    const ok = window.confirm(
      'disconnect this device? your local data and the github file are both untouched — you can reconnect any time.',
    );
    if (!ok) return;
    sync.clearConfig();
  }

  return (
    <>
      <section className={styles.section}>
        <div className={styles.status}>{statusLine(status, lastSyncedAt)}</div>
        {config && (
          <div className={styles.statusMeta}>
            file{' '}
            <a
              href={`https://gist.github.com/${config.gistId}`}
              target="_blank"
              rel="noreferrer"
            >
              <code>{config.gistId.slice(0, 12)}…</code>
            </a>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>actions</h2>
        <div className={styles.row}>
          <button
            type="button"
            onClick={handlePush}
            disabled={busy}
            className={styles.btn}
          >
            push now
          </button>
          <button
            type="button"
            onClick={handlePull}
            disabled={busy}
            className={styles.btn}
          >
            pull from github
          </button>
        </div>
        <div className={styles.row}>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className={`${styles.btn} ${styles.btnSubtle}`}
          >
            disconnect
          </button>
        </div>
      </section>
    </>
  );
}
