import React from 'react';
import { JourneyState } from '@/types/discoveries';
import { Compass } from 'lucide-react';

interface JourneySectionProps {
  journey: JourneyState;
}

export const JourneySection: React.FC<JourneySectionProps> = ({ journey }) => {
  const isStateActive = journey.status === 'active';

  const formatSpan = () => {
    if (!journey.firstEntryDate) return null;
    if (journey.firstEntryDate === journey.lastEntryDate || !journey.lastEntryDate) {
      return `since ${journey.firstEntryDate}`;
    }
    return `from ${journey.firstEntryDate} to ${journey.lastEntryDate}`;
  };

  const spanText = formatSpan();

  return (
    <section className="mb-10 rounded-2xl bg-surface/60 border border-default p-6 md:p-8 backdrop-blur-xs transition-colors">
      <div className="flex items-center gap-2.5 text-accent mb-3">
        <Compass className="w-5 h-5" />
        <h2 className="text-xs uppercase tracking-widest font-mono font-medium">Your Journey</h2>
      </div>

      <div className="max-w-2xl">
        {!isStateActive ? (
          <p className="text-xl md:text-2xl font-serif text-body leading-relaxed font-normal">
            As you write, the picture will start to form. There's no target — just your own pace.
          </p>
        ) : (
          <p className="text-xl md:text-2xl font-serif text-body leading-relaxed font-normal">
            Here is what your writing has shown so far.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-5 text-xs text-muted font-mono">
          <span>{journey.totalEntries} {journey.totalEntries === 1 ? 'entry' : 'entries'}</span>
          {journey.totalWords > 0 && (
            <>
              <span>•</span>
              <span>{journey.totalWords.toLocaleString()} words</span>
            </>
          )}
          {spanText && (
            <>
              <span>•</span>
              <span>{spanText}</span>
            </>
          )}
          {journey.lastModelUpdate && (
            <>
              <span>•</span>
              <span>last reading: {new Date(journey.lastModelUpdate).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
