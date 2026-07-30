import React from 'react';
import { BookOpen, Sparkles, Brain, Lock, MessageCircle, Heart, Search, Lightbulb } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen landing-bg transition-colors duration-200">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <BookOpen className="w-16 h-16 landing-icon mx-auto mb-4 opacity-80" strokeWidth={1.5} />
          </div>

          <h1 className="text-5xl md:text-6xl font-serif landing-hero mb-6 leading-tight">
            Meet Yourself on the Page
          </h1>

          <p className="text-xl md:text-2xl landing-body mb-12 max-w-2xl mx-auto leading-relaxed">
            A private space to journal, reflect, and discover who you really are
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 landing-btn-primary text-lg font-medium shadow-lg hover:shadow-xl"
            >
              Start Writing
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 landing-btn-secondary text-lg font-medium"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 landing-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-serif landing-heading text-center mb-16">
            Three Simple Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 landing-icon-bg rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 landing-icon" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif landing-heading mb-4">Write Freely</h3>
              <p className="landing-body leading-relaxed">
                Pour your thoughts onto the page — whatever comes to mind. No judgment, no structure, just honest expression.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 landing-icon-bg rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 landing-icon" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif landing-heading mb-4">Reflect Together</h3>
              <p className="landing-body leading-relaxed">
                Talk through your thoughts with an AI that knows your writing. Chat naturally, get reflections, and uncover patterns.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 landing-icon-bg rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 landing-icon" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif landing-heading mb-4">Understand Deeply</h3>
              <p className="landing-body leading-relaxed">
                Discover your emotional patterns, beliefs, and blind spots. Turn vague feelings into real insight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Feature */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 mx-auto mb-6 landing-icon-bg rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 landing-icon" strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-serif landing-heading mb-6">
              Talk Through Your Thoughts
            </h2>
            <p className="text-xl landing-body max-w-3xl mx-auto leading-relaxed">
              Sometimes you don't know what you think until you say it out loud. Chat with an AI companion that knows your journal and helps you go deeper.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="landing-surface rounded-3xl p-8 hover:landing-surface-hover transition-all duration-300">
              <Search className="w-10 h-10 landing-icon mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif landing-heading mb-3">Rooted in Your Writing</h3>
              <p className="landing-body leading-relaxed">
                Every conversation draws on your actual journal entries. The AI reflects back what it's learned about your patterns and perspectives — making the chat uniquely personal.
              </p>
            </div>

            <div className="landing-surface rounded-3xl p-8 hover:landing-surface-hover transition-all duration-300">
              <Lightbulb className="w-10 h-10 landing-icon mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif landing-heading mb-3">From Surface to Depth</h3>
              <p className="landing-body leading-relaxed">
                When you get stuck in circular thinking, the AI gently steers you toward concrete grounding. It helps you move from abstract rumination to real understanding.
              </p>
            </div>

            <div className="landing-surface rounded-3xl p-8 hover:landing-surface-hover transition-all duration-300">
              <Heart className="w-10 h-10 landing-lens-rose mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif landing-heading mb-3">A Safe, Private Conversation</h3>
              <p className="landing-body leading-relaxed">
                No one reads your chats. No data shared. This is your space to be honest without fear of judgment — just you working through what matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mirror Feature (condensed) */}
      <section className="py-24 px-6 landing-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif landing-heading mb-6">
              Reflective Lenses
            </h2>
            <p className="text-xl landing-body max-w-2xl mx-auto leading-relaxed">
              When you want structured reflection, pick a lens and see your entry from a fresh angle.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="landing-elevated rounded-2xl p-6 text-center hover:landing-surface-hover transition-all duration-300">
              <Heart className="w-8 h-8 landing-lens-rose mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif landing-heading">Emotional</h3>
            </div>
            <div className="landing-elevated rounded-2xl p-6 text-center hover:landing-surface-hover transition-all duration-300">
              <Brain className="w-8 h-8 landing-lens-indigo mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif landing-heading">Cognitive</h3>
            </div>
            <div className="landing-elevated rounded-2xl p-6 text-center hover:landing-surface-hover transition-all duration-300">
              <Sparkles className="w-8 h-8 landing-lens-emerald mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif landing-heading">Behavioral</h3>
            </div>
            <div className="landing-elevated rounded-2xl p-6 text-center hover:landing-surface-hover transition-all duration-300">
              <MessageCircle className="w-8 h-8 landing-lens-amber mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif landing-heading">Relational</h3>
            </div>
          </div>
        </div>
      </section>

      {/* The Value of Self-Knowledge */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif landing-heading mb-12">
            Why Self-Knowledge Matters
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="landing-surface rounded-3xl p-8">
              <p className="landing-body leading-relaxed text-lg">
                "Knowing yourself is the beginning of all wisdom."
              </p>
              <p className="landing-muted mt-2 text-sm">— Aristotle</p>
            </div>
            <div className="landing-surface rounded-3xl p-8">
              <p className="landing-body leading-relaxed">
                Journaling is one of the oldest tools for self-discovery. By putting thoughts into words, you move from fuzzy feelings into clear understanding. Our inner patterns — the stories we tell ourselves, the emotions we avoid, the beliefs we never question — shape our lives. Bringing them into awareness is the first step toward real change.
              </p>
            </div>
            <div className="landing-surface rounded-3xl p-8">
              <p className="landing-body leading-relaxed">
                Self-knowledge isn't about fixing yourself. It's about meeting yourself — your real self, not the version you think you should be. From that meeting grows clarity, compassion, and the freedom to choose differently.
              </p>
            </div>
            <div className="landing-surface rounded-3xl p-8">
              <p className="landing-body leading-relaxed">
                This space gives you a regular practice of turning inward. Write when you need to process. Chat when you need to think out loud. Reflect when you're ready to see something new. Each session builds on the last, creating a living map of your inner world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Trust */}
      <section className="py-24 px-6 landing-surface">
        <div className="max-w-3xl mx-auto text-center">
          <Lock className="w-12 h-12 landing-icon mx-auto mb-6 opacity-80" strokeWidth={1.5} />
          <h2 className="text-4xl font-serif landing-heading mb-6">
            Your Sanctuary, Protected
          </h2>
          <p className="text-xl landing-body leading-relaxed mb-8">
            Your journal is private. Secure authentication keeps your entries safe.
            No public sharing. Just you and your inner pages.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif landing-heading text-center mb-12">
            For Deep Thinkers
          </h2>

          <div className="landing-surface rounded-3xl p-12">
            <ul className="space-y-4 text-lg landing-body">
              <li className="flex items-start">
                <span className="landing-icon mr-3">•</span>
                <span>Reflective souls seeking self-knowledge</span>
              </li>
              <li className="flex items-start">
                <span className="landing-icon mr-3">•</span>
                <span>People working on personal growth</span>
              </li>
              <li className="flex items-start">
                <span className="landing-icon mr-3">•</span>
                <span>Those using journaling alongside therapy</span>
              </li>
              <li className="flex items-start">
                <span className="landing-icon mr-3">•</span>
                <span>Overthinkers who want clarity</span>
              </li>
              <li className="flex items-start">
                <span className="landing-icon mr-3">•</span>
                <span>Anyone craving a quiet space for inner conversation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif landing-heading mb-8 leading-tight">
            Begin Your Inner Conversation
          </h2>
          <p className="text-xl landing-body mb-12 leading-relaxed">
            Your thoughts deserve a quiet place. Start writing today.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-5 landing-btn-primary text-xl font-medium shadow-lg hover:shadow-xl"
          >
            Start Writing Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 landing-surface text-center text-tertiary">
        <p className="text-sm">My Inner Pages &copy; 2026</p>
      </footer>
    </div>
  );
};
