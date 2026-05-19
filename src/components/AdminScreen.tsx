import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import styles from './AdminScreen.module.css';

/* AdminScreen — token-gated view of the parse_events telemetry.
   Three sections, in priority order:
   - spend: per-day token usage and dollar cost. The summary line
     above the table answers "am I bleeding money" at a glance.
   - who: country breakdown with unique-visitor counts.
   - recent: chronological feed of what people actually said into
     the mic. The thing I care most about reading.

   The token lives in localStorage (one key, one user, my own
   devices) and can be cleared with the "lock" button so the
   dashboard re-prompts on the next visit. */

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

const TOKEN_KEY = 'massed:admin-token';

export function AdminScreen() {
  const [token, setToken] = useState<string>(
    () => localStorage.getItem(TOKEN_KEY) ?? ''
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((t: string) => {
    if (!t) return () => {};
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('api/admin-stats', {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            setToken('');
            throw new Error('wrong token.');
          }
          const body = (await res.json().catch(() => ({}))) as {
            error?: unknown;
          };
          throw new Error(
            typeof body.error === 'string' ? body.error : `failed (${res.status}).`
          );
        }
        return res.json() as Promise<AdminStats>;
      })
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'failed.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(token), [token, load]);

  const handleUnlock = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const handleLock = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setStats(null);
  };

  if (!token) return <TokenGate onSubmit={handleUnlock} />;

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← back
        </Link>
        <h1 className={styles.title}>admin</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => load(token)}
            className={styles.headerLink}
            disabled={loading}
          >
            {loading ? '…' : 'refresh'}
          </button>
          <button
            type="button"
            onClick={handleLock}
            className={styles.headerLink}
          >
            lock
          </button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {!stats && !error && <p className={styles.status}>loading…</p>}

      {stats && (
        <>
          <DailySection rows={stats.daily} />
          <CountriesSection rows={stats.countries} />
          <RecentSection rows={stats.recent} />
        </>
      )}
    </article>
  );
}

function TokenGate({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← back
        </Link>
        <h1 className={styles.title}>admin</h1>
      </header>
      <p className={styles.intro}>paste the admin token to see who's using parse.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) onSubmit(val.trim());
        }}
      >
        <input
          type="password"
          className={styles.input}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="token"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="admin token"
        />
        <button type="submit" className={styles.btn} disabled={!val.trim()}>
          unlock
        </button>
      </form>
    </article>
  );
}

function DailySection({ rows }: { rows: DailyRow[] }) {
  const totalCost = rows.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalEvents = rows.reduce((s, r) => s + r.events, 0);
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>spend</h2>
      <p className={styles.summary}>
        {totalEvents} {totalEvents === 1 ? 'parse' : 'parses'}, ${totalCost.toFixed(4)} total.
      </p>
      {rows.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>day</th>
              <th>parses</th>
              <th>ok</th>
              <th>in tok</th>
              <th>out tok</th>
              <th>$</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td>
                <td>{r.events}</td>
                <td>{r.successful}</td>
                <td>{r.input_tokens.toLocaleString()}</td>
                <td>{r.output_tokens.toLocaleString()}</td>
                <td>{Number(r.cost_usd).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CountriesSection({ rows }: { rows: CountryRow[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>who</h2>
      {rows.length === 0 ? (
        <p className={styles.empty}>no events yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>country</th>
              <th>parses</th>
              <th>visitors</th>
              <th>$</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.country}>
                <td>{r.country}</td>
                <td>{r.events}</td>
                <td>{r.unique_visitors}</td>
                <td>{Number(r.cost_usd).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RecentSection({ rows }: { rows: RecentRow[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>recent</h2>
      {rows.length === 0 ? (
        <p className={styles.empty}>no transcripts yet.</p>
      ) : (
        <ul className={styles.recent}>
          {rows.map((r, i) => (
            <li key={r.created_at + i} className={styles.recentItem}>
              <div className={styles.recentMeta}>
                {formatTime(r.created_at)}
                {' · '}
                {r.country ?? '?'}
                {r.city ? `, ${r.city.toLowerCase()}` : ''}
                {' · '}
                {r.success
                  ? `${r.parsed_row_count ?? 0} ${(r.parsed_row_count ?? 0) === 1 ? 'set' : 'sets'}`
                  : 'failed'}
              </div>
              <div className={styles.recentTranscript}>
                {r.transcript ? r.transcript : <em>(empty)</em>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}
