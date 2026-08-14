import React, { useRef } from 'react';
import { Calendar, AlertCircle, CloudOff, RefreshCw } from 'lucide-react';
import { SaveStatus } from '@hooks/useJournalAutosave';

interface JournalMetaBarProps {
  entryDate: string;
  formattedDate: string;
  saveStatus: SaveStatus;
  onEntryDateChange: (val: string) => void;
  onRetrySave: () => void;
}

const SaveIndicator: React.FC<{ status: SaveStatus; onRetry?: () => void }> = ({ status, onRetry }) => {
  if (!status) return null;
  const styles: Record<string, { icon: React.ReactNode; text: string; cls: string }> = {
    error: { icon: <AlertCircle className="w-3 h-3" />, text: 'Couldn\'t save', cls: 'text-red-500' },
    unsynced: { icon: <CloudOff className="w-3 h-3" />, text: 'Unsynced (Saved locally)', cls: 'text-amber-500' },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${s.cls}`}>
      {s.icon}{s.text}
      {onRetry && (
        <button onClick={onRetry} className="ml-1 p-0.5 rounded hover:bg-accent-tint transition-colors" aria-label="Retry save">
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export const JournalMetaBar: React.FC<JournalMetaBarProps> = ({
  entryDate,
  formattedDate,
  saveStatus,
  onEntryDateChange,
  onRetrySave,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center gap-3 px-6 md:px-8"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <button
        onClick={() => dateInputRef.current?.showPicker?.()}
        className="inline-flex items-center gap-1.5 text-xs text-muted/50 hover:text-muted transition-colors text-left"
        aria-label={`Edit date: ${formattedDate}`}
      >
        <Calendar className="w-3 h-3" />
        {formattedDate}
      </button>
      <input
        ref={dateInputRef}
        type="datetime-local"
        value={entryDate}
        onChange={(e) => onEntryDateChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dateInputRef.current?.showPicker?.();
          }
        }}
        className="sr-only"
        tabIndex={0}
      />
      <SaveIndicator status={saveStatus} onRetry={saveStatus ? onRetrySave : undefined} />
    </div>
  );
};
