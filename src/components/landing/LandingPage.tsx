import React from 'react';
import { BookOpen, Sparkles, Lock, Heart, Brain, Users, TrendingUp } from 'lucide-react';

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
            Meet Yourself on the Page
          </h1>
          
          <p className="text-xl md:text-2xl text-amber-800/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            An AI-powered journaling space for deep self-knowledge and inner clarity
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
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Write</h3>
              <p className="text-amber-800/80 leading-relaxed">
                Pour your thoughts onto the page. No judgment, no pressure. Just you and your words.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Reflect</h3>
              <p className="text-amber-800/80 leading-relaxed">
                AI reads your entries and offers gentle reflections, revealing patterns you might not see.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-amber-800" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-4">Understand</h3>
              <p className="text-amber-800/80 leading-relaxed">
                Gain clarity about yourself. See connections. Discover insights that lead to growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Mirror Feature */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-amber-900 mb-6">
              AI as Your Mirror
            </h2>
            <p className="text-xl text-amber-800/80 max-w-2xl mx-auto leading-relaxed">
              Not a chatbot. Not a therapist. A reflection tool that helps you see yourself more clearly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Heart className="w-10 h-10 text-rose-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif text-amber-900 mb-3">Emotional</h3>
              <p className="text-amber-800/80 leading-relaxed">
                What am I feeling? Understand the emotional currents beneath your words.
              </p>
            </div>
            
            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Brain className="w-10 h-10 text-indigo-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif text-amber-900 mb-3">Cognitive</h3>
              <p className="text-amber-800/80 leading-relaxed">
                What am I believing? Examine the thoughts and assumptions shaping your reality.
              </p>
            </div>
            
            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <TrendingUp className="w-10 h-10 text-emerald-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif text-amber-900 mb-3">Behavioral</h3>
              <p className="text-amber-800/80 leading-relaxed">
                What am I doing? Notice patterns in your actions and choices.
              </p>
            </div>
            
            <div className="bg-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all duration-300">
              <Users className="w-10 h-10 text-amber-700 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-serif text-amber-900 mb-3">Relational</h3>
              <p className="text-amber-800/80 leading-relaxed">
                How do I relate to others? Explore your connections and relationships.
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
            No public sharing. No data selling. Just you and your inner pages.
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
        <p className="text-sm">My Inner Pages © 2026</p>
      </footer>
    </div>
  );
};
