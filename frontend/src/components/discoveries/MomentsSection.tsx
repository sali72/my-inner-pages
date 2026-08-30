import React from 'react';
import { MomentItem } from '@/types/discoveries';
import { Clock } from 'lucide-react';

interface MomentsSectionProps {
  moments: MomentItem[];
}

export const MomentsSection: React.FC<MomentsSectionProps> = ({ moments }) => {
  if (moments.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2.5 text-accent mb-6">
        <Clock className="w-5 h-5" />
        <h2 className="text-xs uppercase tracking-widest font-mono font-medium">Moments</h2>
      </div>

      <div className="relative pl-6 border-l border-default space-y-6">
        {moments.map((moment) => (
          <div key={moment.id} className="relative group">
            {/* Timeline bullet dot */}
            <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-border group-hover:bg-accent transition-colors" />

            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-muted">{moment.date}</span>
              <h3 className="text-sm font-serif font-medium text-body mt-0.5">{moment.title}</h3>
              {moment.description && (
                <p className="text-xs text-secondary mt-1 max-w-lg leading-relaxed">
                  {moment.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
