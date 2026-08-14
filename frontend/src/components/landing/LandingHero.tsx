import React from 'react';
import { Feather, ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onGetStarted: () => void;
  onExplore: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted, onExplore }) => {
  return (
    <section className="pt-20 pb-24 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full landing-surface border text-xs font-medium landing-muted mb-8 shadow-sm">
          <Feather className="w-3.5 h-3.5 landing-icon" />
          <span>A Quiet Sanctuary for Self-Knowledge</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif landing-hero mb-8 leading-[1.1] tracking-tight">
          Meet Yourself on the Page
        </h1>

        <p className="text-xl sm:text-2xl landing-body mb-10 max-w-3xl mx-auto leading-relaxed font-normal">
          A private journaling ritual designed for self-discovery—helping you spot recurring patterns, ground your thinking, and see yourself clearly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-9 py-4 landing-btn-primary text-lg font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <span>Start Writing Today</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 landing-btn-secondary text-lg font-medium"
          >
            Explore the Ritual
          </button>
        </div>
      </div>
    </section>
  );
};
