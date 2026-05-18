import { useState } from 'react';
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
 */

type Mode = 'voice' | 'manual';

export interface LogScreenProps {
  sessions: Session[];
  onSave: (date: string, exerciseName: string, family: Family, set: SetEntry) => void;
}

export function LogScreen({ sessions, onSave }: LogScreenProps) {
  const [mode, setMode] = useState<Mode>('voice');

  return (
    <div className={styles.log}>
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
        <VoiceLogScreen sessions={sessions} onSave={onSave} />
      ) : (
        <ManualLogScreen sessions={sessions} onSave={onSave} />
      )}
    </div>
  );
}

function formatToday(): string {
  return new Date()
    .toLocaleString('en-US', { month: 'short', day: 'numeric' })
    .toLowerCase();
}
