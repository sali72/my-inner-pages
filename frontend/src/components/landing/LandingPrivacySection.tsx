import React from 'react';
import { Lock, ShieldCheck, Compass } from 'lucide-react';

interface LandingPrivacySectionProps {
  onShowPrivacyModal: () => void;
}

export const LandingPrivacySection: React.FC<LandingPrivacySectionProps> = ({ onShowPrivacyModal }) => {
  return (
    <section id="privacy" className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl landing-icon-bg flex items-center justify-center">
          <Lock className="w-8 h-8 landing-icon" strokeWidth={1.75} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif landing-heading mb-6">
          Your Inner World Remains Yours
        </h2>
        <p className="text-lg sm:text-xl landing-body max-w-2xl mx-auto leading-relaxed mb-10">
          A reflection space is built on trust. We maintain strict user access controls and non-retention policies.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 text-left mb-10">
          <div className="p-6 rounded-2xl landing-surface border">
            <ShieldCheck className="w-6 h-6 landing-icon mb-3" />
            <h3 className="font-serif text-lg font-medium landing-heading mb-2">Zero AI Training</h3>
            <p className="text-xs landing-body leading-relaxed">
              Your entries and chats are never used to train public or foundation AI models.
            </p>
          </div>

          <div className="p-6 rounded-2xl landing-surface border">
            <Lock className="w-6 h-6 landing-icon mb-3" />
            <h3 className="font-serif text-lg font-medium landing-heading mb-2">Private & Confidential</h3>
            <p className="text-xs landing-body leading-relaxed">
              Strict user-level access controls ensure only you can access your journal.
            </p>
          </div>

          <div className="p-6 rounded-2xl landing-surface border">
            <Compass className="w-6 h-6 landing-icon mb-3" />
            <h3 className="font-serif text-lg font-medium landing-heading mb-2">No Public Exposure</h3>
            <p className="text-xs landing-body leading-relaxed">
              No social feeds, no public profiles, no sharing features. Your sanctuary is private by default.
            </p>
          </div>
        </div>

        <button
          onClick={onShowPrivacyModal}
          className="px-6 py-3 landing-btn-secondary text-sm font-medium inline-flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>Read Full Privacy & Data Commitment</span>
        </button>
      </div>
    </section>
  );
};
