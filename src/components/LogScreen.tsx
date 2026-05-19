import { useState } from 'react';
import { Link } from 'wouter';
import type { Family, Session, SetEntry } from '../lib/types';
import { ManualLogScreen } from './ManualLogScreen';
import { VoiceLogScreen } from './VoiceLogScreen';
import styles from './LogScreen.module.css';

/**
 * LogScreen — page chrome + mode switch.
 *
 * Two modes share the page chrome (header, close, rule lines):
 *   - voice (default): speak or type → parse → confirm → save.
 *   - manual: the original form-based entry path.
 *
 * Mode is not persisted — every visit defaults to voice so the AI-native
 * path is the one users walk into. Switching is one tap.
 *
 * The settings gear sits just inside the close affordance (which lives
 * one layer up in App). Settings is reachable from here because the
 * log screen is where someone first realizes "this is the only copy of
 * my data" — that's the natural moment to wire up sync.
 */

type Mode = 'voice' | 'manual';

export interface LogScreenProps {
  sessions: Session[];
  syncConfigured: boolean;
  onSave: (date: string, exerciseName: string, family: Family, set: SetEntry) => void;
}

export function LogScreen({ sessions, syncConfigured, onSave }: LogScreenProps) {
  const [mode, setMode] = useState<Mode>('voice');

  return (
    <div className={styles.log}>
      <Link
        href="/settings"
        aria-label="settings"
        className={styles.logGear}
      >
        <GearIcon />
      </Link>

      <div className={styles.logTop}>
        <span className={styles.logIssue}>log / {formatToday()}</span>
      </div>
      <div className={styles.logRule} />
      <div className={styles.logRuleThin} />

      <div className={styles.logModeRow} role="tablist" aria-label="log mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'voice'}
          className={`${styles.logModeBtn} ${
            mode === 'voice' ? styles.logModeBtnActive : ''
          }`}
          onClick={() => setMode('voice')}
        >
          voice
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manual'}
          className={`${styles.logModeBtn} ${
            mode === 'manual' ? styles.logModeBtnActive : ''
          }`}
          onClick={() => setMode('manual')}
        >
          manual
        </button>
      </div>

      {mode === 'voice' ? (
        <VoiceLogScreen
          sessions={sessions}
          syncConfigured={syncConfigured}
          onSave={onSave}
        />
      ) : (
        <ManualLogScreen
          sessions={sessions}
          syncConfigured={syncConfigured}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function formatToday(): string {
  return new Date()
    .toLocaleString('en-US', { month: 'short', day: 'numeric' })
    .toLowerCase();
}

/* Inline gear — small, mono-flavored, takes its color from currentColor.
   The path is the standard Feather "settings" cog. Kept inline to avoid
   adding an icon dependency for one glyph. */
function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
