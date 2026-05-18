import { useState } from 'react';
import { Link } from 'wouter';
import type { SyncStatus, UseGistSync } from '../lib/useGistSync';
import styles from './SettingsScreen.module.css';

/* SettingsScreen — URL-only `/settings` route. No navigation from the
   main app chrome to keep the masthead clean; reach this by typing the
   URL. Single user, personal device — credentials live in localStorage. */

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
        ? `last synced ${relativeTimeFrom(lastSyncedAt)}`
        : 'not synced yet';
    case 'pending':
      return 'change queued — pushing in a few seconds';
    case 'syncing':
      return 'syncing…';
    case 'synced':
      return `synced ${relativeTimeFrom(status.at)}`;
    case 'error':
      return `sync failed: ${status.message}`;
  }
}

export function SettingsScreen({ sync }: SettingsScreenProps) {
  const { config, status, lastSyncedAt } = sync;

  const [gistInput, setGistInput] = useState(config?.gistId ?? '');
  const [pat, setPat] = useState(config?.pat ?? '');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleTest() {
    setTestResult(null);
    setBusy(true);
    const result = await sync.testConnection({ gistInput, pat });
    setBusy(false);
    setTestResult(result.ok ? 'connected.' : `failed: ${result.error}`);
  }

  function handleSave() {
    sync.saveConfig({ gistInput, pat });
    setTestResult(null);
  }

  async function handlePush() {
    setBusy(true);
    await sync.pushNow();
    setBusy(false);
  }

  async function handlePull() {
    const ok = window.confirm(
      'pull from gist will overwrite all local data. continue?',
    );
    if (!ok) return;
    setBusy(true);
    await sync.pullNow();
    setBusy(false);
  }

  function handleDisconnect() {
    const ok = window.confirm(
      'disconnect from gist? your local data is unaffected.',
    );
    if (!ok) return;
    sync.clearConfig();
    setGistInput('');
    setPat('');
    setTestResult(null);
  }

  const trimmedGist = gistInput.trim();
  const trimmedPat = pat.trim();
  const filledIn = trimmedGist.length > 0 && trimmedPat.length > 0;
  const dirty =
    trimmedGist !== (config?.gistId ?? '') ||
    trimmedPat !== (config?.pat ?? '');

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← back
        </Link>
        <h1 className={styles.title}>sync</h1>
      </header>

      <section className={styles.section}>
        <div className={styles.status}>{statusLine(status, lastSyncedAt)}</div>
        {config && (
          <div className={styles.statusMeta}>
            gist <code>{config.gistId}</code>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>credentials</h2>
        <label className={styles.field}>
          <span className={styles.label}>gist id or url</span>
          <input
            type="text"
            value={gistInput}
            onChange={(e) => setGistInput(e.target.value)}
            placeholder="9a8b7c6d5e4f3a2b1c0d…"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>github token</span>
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="github_pat_…"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            className={styles.input}
          />
        </label>
        <div className={styles.row}>
          <button
            type="button"
            onClick={handleTest}
            disabled={busy || !filledIn}
            className={styles.btn}
          >
            test connection
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !dirty || !filledIn}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            save
          </button>
        </div>
        {testResult && <div className={styles.testResult}>{testResult}</div>}
      </section>

      {config && (
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
              pull from gist
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
      )}

      <section className={styles.section}>
        <h2 className={styles.heading}>setup</h2>
        <ol className={styles.steps}>
          <li>
            create a gist at{' '}
            <a href="https://gist.github.com" target="_blank" rel="noreferrer">
              gist.github.com
            </a>
            . filename <code>massed.json</code>, content <code>[]</code>.
            secret is fine — the url is unguessable but still publicly readable
            to anyone who has it.
          </li>
          <li>
            generate a fine-grained personal access token at{' '}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              github.com/settings/personal-access-tokens
            </a>
            . no repository access; account permissions → gists: read and
            write.
          </li>
          <li>
            paste the gist id (or full url) and token above. test, then save.
            click <em>push now</em> to upload your current local data.
          </li>
        </ol>
        <p className={styles.note}>
          the token lives only in this browser's localstorage. it never ships
          in the source code or to anyone visiting the deployed app.
        </p>
      </section>
    </article>
  );
}
