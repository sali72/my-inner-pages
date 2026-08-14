import React from 'react';
import { BookOpen, Github } from 'lucide-react';

interface LandingFooterProps {
  onShowPrivacyModal: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onShowPrivacyModal }) => {
  return (
    <footer className="py-12 px-6 border-t border-subtle landing-surface text-xs landing-muted">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 landing-icon" />
          <span className="font-serif text-sm font-semibold landing-heading">My Inner Pages</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={onShowPrivacyModal} className="hover:underline">
            Privacy Policy
          </button>
          <a
            href="https://github.com/sali72/my-inner-pages"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
