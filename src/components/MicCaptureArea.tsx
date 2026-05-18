import { useState } from 'react';
import { parseWorkout, type ParsedRow } from '../lib/parseWorkout';
import { useSpeechRecognition } from '../lib/speechRecognition';
import styles from './MicCaptureArea.module.css';

/**
 * MicCaptureArea — mic button + transcript textarea + parse button.
 *
 * Owns the speech-recognition + parse request. On a successful parse,
 * hands the flat row list off to the parent via `onParse` and stops
 * rendering itself (parent decides whether to swap in the EditLedger).
 */

export interface MicCaptureAreaProps {
  onParse: (rows: ParsedRow[]) => void;
}

export function MicCaptureArea({ onParse }: MicCaptureAreaProps) {
  const speech = useSpeechRecognition();
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    const transcript = speech.transcript.trim();
    if (!transcript) return;
    setParsing(true);
    setError(null);
    try {
      const result = await parseWorkout(transcript);
      if (result.rows.length === 0) {
        setError("didn't catch any sets in that. add detail and try again.");
        return;
      }
      onParse(result.rows);
      // Clear the transcript so a follow-up parse doesn't double-add.
      speech.setTranscript('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error.';
      setError(`couldn't parse. ${msg}`);
    } finally {
      setParsing(false);
    }
  }

  const hasTranscript = speech.transcript.trim().length > 0;

  return (
    <div className={styles.mic}>
      <div className={styles.micRow}>
        <button
          type="button"
          className={`${styles.micBtn} ${
            speech.listening ? styles.micBtnListening : ''
          }`}
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
          disabled={!speech.supported}
          aria-pressed={speech.listening}
          aria-label={speech.listening ? 'stop recording' : 'start recording'}
        >
          <span className={styles.micDot} aria-hidden="true" />
          {speech.listening ? 'stop' : 'record'}
        </button>
        <span className={styles.micHint}>
          {speech.listening
            ? 'listening.'
            : speech.supported
              ? 'tap to record.'
              : 'voice not supported in this browser. type instead.'}
        </span>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>transcript</span>
        <textarea
          className={styles.transcript}
          value={speech.transcript}
          onChange={(e) => speech.setTranscript(e.target.value)}
          placeholder="or type. e.g. bench 185, 3 sets of 5."
          rows={4}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {(error || speech.error) && (
        <p className={styles.error}>{error ?? speech.error}</p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={handleParse}
          disabled={!hasTranscript || parsing}
        >
          {parsing ? 'thinking…' : 'parse'}
        </button>
      </div>
    </div>
  );
}
