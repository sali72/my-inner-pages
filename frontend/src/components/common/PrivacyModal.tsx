import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="landing-elevated rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border shadow-2xl relative text-primary">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface landing-muted hover:landing-heading transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl landing-icon-bg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 landing-icon" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-medium landing-heading">Privacy & Data Policy</h3>
            <p className="text-xs landing-muted">Data Handling & Confidentiality Details</p>
          </div>
        </div>

        <div className="space-y-5 text-sm landing-body leading-relaxed">
          <div className="p-4 rounded-2xl landing-surface border">
            <h4 className="font-serif text-base font-medium landing-heading mb-1">1. Zero AI Model Training</h4>
            <p className="text-xs">
              We use third-party AI inference providers (via OpenRouter) that enforce zero-data-retention and zero-training policies. Your journals are processed strictly in-memory to generate reflections and insights, and are never used to train public AI models.
            </p>
          </div>

          <div className="p-4 rounded-2xl landing-surface border">
            <h4 className="font-serif text-base font-medium landing-heading mb-1">2. Private Data Access</h4>
            <p className="text-xs">
              All user entries are stored on our application server with strict account-level access controls. We do not read, mine, sell, or monetize your journal data.
            </p>
          </div>

          <div className="p-4 rounded-2xl landing-surface border">
            <h4 className="font-serif text-base font-medium landing-heading mb-1">3. Server Storage Transparency</h4>
            <p className="text-xs">
              Data is stored centrally on our application server to provide cross-device synchronization and fast search/synthesis. It is protected by standard authentication and database access controls. (Note: server processing requires plaintext evaluation by AI models; we do not claim end-to-end encryption).
            </p>
          </div>

          <div className="p-4 rounded-2xl landing-surface border">
            <h4 className="font-serif text-base font-medium landing-heading mb-1">4. Open Source Transparency</h4>
            <p className="text-xs">
              My Inner Pages is open source software. You can inspect the full backend and frontend codebase directly on{' '}
              <a
                href="https://github.com/sali72/my-inner-pages"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium text-accent"
              >
                GitHub
              </a>.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 landing-btn-primary text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
