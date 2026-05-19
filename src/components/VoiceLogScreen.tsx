import { useState } from 'react';
import type { Family, Session, SetEntry } from '../lib/types';
import type { ParsedRow } from '../lib/parseWorkout';
import { MicCaptureArea } from './MicCaptureArea';
import { EditLedger } from './EditLedger';

/**
 * VoiceLogScreen — composes the mic capture step with the shared
 * EditLedger. Once a parse returns rows, the mic UI hides and the
 * ledger takes over, pre-populated with the parsed rows as drafts.
 *
 * From the user's view, post-parse voice mode is identical to manual
 * mode: same row layout, same typeahead, same save button, same bar
 * preview. The only difference upstream is how the drafts got there.
 */

export interface VoiceLogScreenProps {
  sessions: Session[];
  syncConfigured: boolean;
  onSave: (date: string, exerciseName: string, family: Family, set: SetEntry) => void;
}

export function VoiceLogScreen({
  sessions,
  syncConfigured,
  onSave,
}: VoiceLogScreenProps) {
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);

  if (parsed === null) {
    return <MicCaptureArea onParse={(rows) => setParsed(rows)} />;
  }

  return (
    <EditLedger
      sessions={sessions}
      syncConfigured={syncConfigured}
      onSave={onSave}
      initialDrafts={parsed.map((r) => ({
        exercise: r.name,
        family: r.family,
        reps: r.reps,
        weight: r.weight,
      }))}
      secondary={{ label: 'back to mic', onClick: () => setParsed(null) }}
    />
  );
}
