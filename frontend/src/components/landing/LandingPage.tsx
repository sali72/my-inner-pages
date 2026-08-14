import React, { useState, useCallback } from 'react';
import { PrivacyModal } from '@components/common';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingPhilosophy } from './LandingPhilosophy';
import { LandingSanctuaryDemo } from './LandingSanctuaryDemo';
import { LandingPrivacySection } from './LandingPrivacySection';
import { LandingFooter } from './LandingFooter';
import { BookOpen, Brain, Heart, Compass } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen landing-bg transition-colors duration-200 text-primary">
      <LandingHeader onGetStarted={onGetStarted} onScrollTo={scrollToSection} />

      <LandingHero
        onGetStarted={onGetStarted}
        onExplore={() => scrollToSection('sanctuary-demo')}
      />

      <LandingPhilosophy />

      <LandingSanctuaryDemo />

      {/* Epistemic Stance & Guardrails */}
      <section id="lenses" className="py-24 px-6 landing-surface">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase landing-muted mb-3 block">
                Epistemic Humility
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif landing-heading mb-6 leading-tight">
                Seeing Yourself Without Being Labeled
              </h2>
              <p className="landing-body leading-relaxed mb-6">
                You are not a fixed personality quiz score or a clinical diagnosis. Personality is an input to self-knowledge—not the destination.
              </p>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl landing-elevated border">
                  <h4 className="font-serif text-lg font-medium landing-heading mb-1">
                    Invitations, Not Diagnoses
                  </h4>
                  <p className="text-sm landing-body leading-relaxed">
                    Every surfaced pattern comes with evidence from your writing, framed so you can explicitly agree or push back.
                  </p>
                </div>
                <div className="p-5 rounded-2xl landing-elevated border">
                  <h4 className="font-serif text-lg font-medium landing-heading mb-1">
                    Holding What You Omit
                  </h4>
                  <p className="text-sm landing-body leading-relaxed">
                    True self-reflection acknowledges that what you don't write about is as important as what you do.
                  </p>
                </div>
              </div>
            </div>

            <div className="landing-elevated rounded-3xl p-8 border">
              <blockquote className="space-y-4">
                <p className="font-serif text-xl sm:text-2xl leading-relaxed landing-heading italic">
                  "You have patterns you didn't fully choose — and you have the freedom to see them clearly."
                </p>
                <footer className="text-xs font-medium uppercase tracking-wider landing-muted pt-4 border-t border-subtle">
                  — The Inner Pages Philosophy
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <LandingPrivacySection onShowPrivacyModal={() => setShowPrivacyModal(true)} />

      {/* Target Audience */}
      <section className="py-24 px-6 landing-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif landing-heading mb-4">
              Designed for Intentional Reflectors
            </h2>
            <p className="text-lg landing-body max-w-2xl mx-auto">
              Inner Pages is tailored for people who value self-understanding over volume or noise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl landing-elevated border flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl landing-icon-bg flex items-center justify-center shrink-0 mt-1">
                <BookOpen className="w-4 h-4 landing-icon" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium landing-heading mb-1">Time-Poor Self-Developers</h3>
                <p className="text-xs landing-body leading-relaxed">
                  Have months of journal entries but zero time to re-read them. Want accurate, non-judgmental pattern synthesis.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl landing-elevated border flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl landing-icon-bg flex items-center justify-center shrink-0 mt-1">
                <Brain className="w-4 h-4 landing-icon" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium landing-heading mb-1">Overthinkers Seeking Clarity</h3>
                <p className="text-xs landing-body leading-relaxed">
                  Brain-dump writing leaves them scattered. Want gentle grounding to turn circular rumination into insight.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl landing-elevated border flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl landing-icon-bg flex items-center justify-center shrink-0 mt-1">
                <Heart className="w-4 h-4 landing-icon" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium landing-heading mb-1">Therapy-Goers</h3>
                <p className="text-xs landing-body leading-relaxed">
                  Actively working on growth and looking for a private space to track recurring weekly triggers and progress.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl landing-elevated border flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl landing-icon-bg flex items-center justify-center shrink-0 mt-1">
                <Compass className="w-4 h-4 landing-icon" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium landing-heading mb-1">Deep Reflective Writers</h3>
                <p className="text-xs landing-body leading-relaxed">
                  Want a tranquil, unhurried digital journal that treats their inner life with dignity and privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-serif landing-hero mb-6 leading-tight">
            Begin Your Inner Conversation
          </h2>
          <p className="text-xl landing-body mb-10 leading-relaxed max-w-2xl mx-auto">
            Your thoughts deserve a quiet room. Step into your private reflection sanctuary today.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-5 landing-btn-primary text-xl font-medium shadow-xl hover:shadow-2xl transition-all"
          >
            Start Writing Today
          </button>
        </div>
      </section>

      <LandingFooter onShowPrivacyModal={() => setShowPrivacyModal(true)} />

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
