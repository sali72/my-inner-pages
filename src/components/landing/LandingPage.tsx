import React from 'react';
import { BookOpen, Sparkles, Brain, Lock, MessageCircle, Heart, Search, Lightbulb } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <BookOpen className="w-16 h-16 text-amber-700 mx-auto mb-4 opacity-80" strokeWidth={1.5} />
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-amber-900 mb-6 leading-tight">
            Know Yourself. Grow Yourself.
          </h1>

          <p className="text-xl md:text-2xl text-amber-800/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            A private space to journal, reflect, and discover who you really are
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-amber-800 text-amber-50 rounded-2xl text-lg font-medium hover:bg-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Writing
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/60 text-amber-900 rounded-2xl text-lg font-medium hover:bg-white/80 transition-all duration-300"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-serif text-amber-900 text-center mb-16">
            Three Simple Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Write Freely</h3>
              <p className="text-amber-800/80 leading-relaxed">
                Pour your thoughts onto the page — whatever comes to mind. No judgment, no structure, just honest expression.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Reflect Together</h3>
              <p className="text-amber-800/80 leading-relaxed">
                Talk through your thoughts with an AI that knows your writing. Chat naturally, get reflections, and uncover patterns.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Understand Deeply</h3>
              <p className="text-amber-800/80 leading-relaxed">
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
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-serif text-amber-900 mb-6">
              Talk Through Your Thoughts
            </h2>
            <p className="text-xl text-amber-800/80 max-w-3xl mx-auto leading-relaxed">
              Sometimes you don't know what you think until you say it out loud. Chat with an AI companion that knows your journal and helps you go deeper.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Search className="w-10 h-10 text-amber-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif text-amber-900 mb-3">Rooted in Your Writing</h3>
              <p className="text-amber-800/80 leading-relaxed">
                Every conversation draws on your actual journal entries. The AI reflects back what it's learned about your patterns and perspectives — making the chat uniquely personal.
              </p>
            </div>

            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Lightbulb className="w-10 h-10 text-amber-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif text-amber-900 mb-3">From Surface to Depth</h3>
              <p className="text-amber-800/80 leading-relaxed">
                When you get stuck in circular thinking, the AI gently steers you toward concrete grounding. It helps you move from abstract rumination to real understanding.
              </p>
            </div>

            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Heart className="w-10 h-10 text-rose-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif text-amber-900 mb-3">A Safe, Private Conversation</h3>
              <p className="text-amber-800/80 leading-relaxed">
                No one reads your chats. No data shared. This is your space to be honest without fear of judgment — just you working through what matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mirror Feature (condensed) */}
      <section className="py-24 px-6 bg-white/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-amber-900 mb-6">
              Reflective Lenses
            </h2>
            <p className="text-xl text-amber-800/80 max-w-2xl mx-auto leading-relaxed">
              When you want structured reflection, pick a lens and see your entry from a fresh angle.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all duration-300">
              <Heart className="w-8 h-8 text-rose-700 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif text-amber-900">Emotional</h3>
            </div>
            <div className="bg-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all duration-300">
              <Brain className="w-8 h-8 text-indigo-700 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif text-amber-900">Cognitive</h3>
            </div>
            <div className="bg-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all duration-300">
              <Sparkles className="w-8 h-8 text-emerald-700 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif text-amber-900">Behavioral</h3>
            </div>
            <div className="bg-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all duration-300">
              <MessageCircle className="w-8 h-8 text-amber-700 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-serif text-amber-900">Relational</h3>
            </div>
          </div>
        </div>
      </section>

      {/* The Value of Self-Knowledge */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-amber-900 mb-12">
            Why Self-Knowledge Matters
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white/60 rounded-3xl p-8">
              <p className="text-amber-800/90 leading-relaxed text-lg">
                "Knowing yourself is the beginning of all wisdom."
              </p>
              <p className="text-amber-700/60 mt-2 text-sm">— Aristotle</p>
            </div>
            <div className="bg-white/60 rounded-3xl p-8">
              <p className="text-amber-800/90 leading-relaxed">
                Journaling is one of the oldest tools for self-discovery. By putting thoughts into words, you move from fuzzy feelings into clear understanding. Our inner patterns — the stories we tell ourselves, the emotions we avoid, the beliefs we never question — shape our lives. Bringing them into awareness is the first step toward real change.
              </p>
            </div>
            <div className="bg-white/60 rounded-3xl p-8">
              <p className="text-amber-800/90 leading-relaxed">
                Self-knowledge isn't about fixing yourself. It's about meeting yourself — your real self, not the version you think you should be. From that meeting grows clarity, compassion, and the freedom to choose differently.
              </p>
            </div>
            <div className="bg-white/60 rounded-3xl p-8">
              <p className="text-amber-800/90 leading-relaxed">
                This space gives you a regular practice of turning inward. Write when you need to process. Chat when you need to think out loud. Reflect when you're ready to see something new. Each session builds on the last, creating a living map of your inner world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Trust */}
      <section className="py-24 px-6 bg-white/40">
        <div className="max-w-3xl mx-auto text-center">
          <Lock className="w-12 h-12 text-amber-800 mx-auto mb-6 opacity-80" strokeWidth={1.5} />
          <h2 className="text-4xl font-serif text-amber-900 mb-6">
            Your Sanctuary, Protected
          </h2>
          <p className="text-xl text-amber-800/80 leading-relaxed mb-8">
            Your journal is private. Secure authentication keeps your entries safe.
            No public sharing. Just you and your inner pages.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif text-amber-900 text-center mb-12">
            For Deep Thinkers
          </h2>

          <div className="bg-white/60 rounded-3xl p-12">
            <ul className="space-y-4 text-lg text-amber-800/80">
              <li className="flex items-start">
                <span className="text-amber-700 mr-3">•</span>
                <span>Reflective souls seeking self-knowledge</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-700 mr-3">•</span>
                <span>People working on personal growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-700 mr-3">•</span>
                <span>Those using journaling alongside therapy</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-700 mr-3">•</span>
                <span>Overthinkers who want clarity</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-700 mr-3">•</span>
                <span>Anyone craving a quiet space for inner conversation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-amber-900 mb-8 leading-tight">
            Begin Your Inner Conversation
          </h2>
          <p className="text-xl text-amber-800/80 mb-12 leading-relaxed">
            Your thoughts deserve a quiet place. Start writing today.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-5 bg-amber-800 text-amber-50 rounded-2xl text-xl font-medium hover:bg-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Start Writing Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white/40 text-center text-amber-800/60">
        <p className="text-sm">My Inner Pages &copy; 2026</p>
      </footer>
    </div>
  );
};
