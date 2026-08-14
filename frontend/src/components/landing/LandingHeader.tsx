import React from 'react';
import { BookOpen, Github } from 'lucide-react';

interface LandingHeaderProps {
  onGetStarted: () => void;
  onScrollTo: (id: string) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onGetStarted, onScrollTo }) => {
  return (
    <header className="sticky top-0 z-40 landing-header transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl landing-icon-bg flex items-center justify-center transition-transform group-hover:scale-105">
            <BookOpen className="w-5 h-5 landing-icon" strokeWidth={1.75} />
          </div>
          <span className="font-serif text-xl tracking-tight landing-heading font-semibold">
            My Inner Pages
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium landing-body">
          <button onClick={() => onScrollTo('philosophy')} className="hover:opacity-80 transition-opacity">
            Philosophy
          </button>
          <button onClick={() => onScrollTo('sanctuary-demo')} className="hover:opacity-80 transition-opacity">
            The Ritual
          </button>
          <button onClick={() => onScrollTo('lenses')} className="hover:opacity-80 transition-opacity">
            Lenses
          </button>
          <button onClick={() => onScrollTo('privacy')} className="hover:opacity-80 transition-opacity">
            Privacy
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/sali72/my-inner-pages"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors"
            title="GitHub Source Code"
          >
            <Github className="w-5 h-5" />
          </a>

          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 landing-btn-primary text-sm font-medium shadow-sm hover:shadow transition-all"
          >
            Start Writing
          </button>
        </div>
      </div>
    </header>
  );
};
