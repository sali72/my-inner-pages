import React from 'react';
import { PatternCard, PatternExcerpt } from '@/types/discoveries';
import { Sparkles, MessageSquare, Quote } from 'lucide-react';

interface EmergingSectionProps {
  patterns: PatternCard[];
  activeThemes: string[];
  onStartChat: (insight: string, excerpts?: PatternExcerpt[]) => void;
}

export const EmergingSection: React.FC<EmergingSectionProps> = ({
  patterns,
  activeThemes,
  onStartChat,
}) => {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-accent">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-xs uppercase tracking-widest font-mono font-medium">What's Emerging</h2>
        </div>
      </div>

      {activeThemes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted font-mono mr-1">Recurring themes:</span>
          {activeThemes.map((theme, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-accent-tint text-accent border border-accent/20"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {patterns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default bg-surface/30 p-8 text-center max-w-xl mx-auto">
          <p className="text-sm md:text-base font-serif text-secondary italic leading-relaxed">
            "As you write, patterns will begin to surface here — not because we're looking for them, but because they're already in you."
          </p>
          <p className="text-xs text-muted font-mono mt-3">
            A thread will appear once recurring observations have taken shape.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="flex flex-col justify-between rounded-2xl bg-surface border border-default p-6 hover:border-accent/40 transition-all shadow-xs"
            >
              <div>
                <p className="text-base md:text-lg font-serif text-body leading-snug mb-3">
                  {pattern.description}
                </p>

                {pattern.evidence && (
                  <p className="text-xs text-muted font-sans mb-4">
                    {pattern.evidence}
                  </p>
                )}

                {pattern.excerpts && pattern.excerpts.length > 0 && (
                  <div className="space-y-2 mb-6 pt-2 border-t border-default/50">
                    {pattern.excerpts.map((exc, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-secondary italic bg-base/60 p-3 rounded-lg border border-default/40"
                      >
                        <Quote className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <span>"{exc.quote}"</span>
                          {exc.entryDate && (
                            <span className="block text-[10px] text-muted not-italic font-mono mt-1">
                              — {exc.entryDate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-default/40 mt-auto">
                <button
                  onClick={() => onStartChat(pattern.description, pattern.excerpts)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-accent-tint text-accent hover:bg-accent hover:text-white transition-all shadow-xs group"
                >
                  <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Explore in chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

