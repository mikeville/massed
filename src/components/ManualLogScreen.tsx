import type { Family, Session, SetEntry } from '../lib/types';
import { EditLedger } from './EditLedger';

/**
 * ManualLogScreen — thin wrapper. Manual mode is just the EditLedger
 * rendered directly, no prelude. All entry/typeahead/preview/save
 * logic lives in EditLedger so the manual and voice ledgers stay
 * visually and behaviorally identical from row 1 onward.
 */

export interface ManualLogScreenProps {
  sessions: Session[];
  onSave: (date: string, exerciseName: string, family: Family, set: SetEntry) => void;
}

export function ManualLogScreen({ sessions, onSave }: ManualLogScreenProps) {
  return <EditLedger sessions={sessions} onSave={onSave} />;
}
