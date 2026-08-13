import React, { useState } from 'react';
import { PrivacyModal } from '@components/common';
import {
  BookOpen,
  Sparkles,
  Brain,
  Lock,
  MessageCircle,
  Heart,
  ShieldCheck,
  Compass,
  Feather,
  CheckCircle2,
  ArrowRight,
  Github,
  Layers,
  Eye,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'lenses' | 'grounding' | 'patterns'>('editor');
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen landing-bg transition-colors duration-200 text-primary">
      {/* Sticky Header Navigation */}
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium landing-body">
            <button onClick={() => scrollToSection('philosophy')} className="hover:opacity-80 transition-opacity">
              Philosophy
            </button>
            <button onClick={() => scrollToSection('sanctuary-demo')} className="hover:opacity-80 transition-opacity">
              The Ritual
            </button>
            <button onClick={() => scrollToSection('lenses')} className="hover:opacity-80 transition-opacity">
              Lenses
            </button>
            <button onClick={() => scrollToSection('privacy')} className="hover:opacity-80 transition-opacity">
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

      {/* Hero Section */}
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
              onClick={() => scrollToSection('sanctuary-demo')}
              className="w-full sm:w-auto px-8 py-4 landing-btn-secondary text-lg font-medium"
            >
              Explore the Ritual
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: The Bounded Ritual Thesis */}
      <section id="philosophy" className="py-24 px-6 landing-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase landing-muted mb-3 block">
              Our Core Distinction
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif landing-heading mb-6 leading-tight">
              Self-Knowledge Requires Stepping Out of Task-Mode
            </h2>
            <p className="text-lg sm:text-xl landing-body leading-relaxed">
              Modern tools optimize for productivity: checklists, ticket queues, and AI assistants trained to execute tasks. But understanding who you are requires a completely different state of mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="landing-elevated rounded-3xl p-8 sm:p-10 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/50 dark:bg-amber-950/40 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 landing-icon" />
              </div>
              <h3 className="text-2xl font-serif landing-heading mb-4">
                Not a Productivity App
              </h3>
              <p className="landing-body leading-relaxed mb-6">
                You don't need another place to manage tasks, track metrics, or optimize your output. Inner Pages is built specifically to be a sanctuary away from work, notifications, and performative demands.
              </p>
              <ul className="space-y-3 text-sm landing-body">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>No loss-states or artificial urgency mechanics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>No general assistant prompting or work execution</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>Purely focused on quiet, unhurried self-reflection</span>
                </li>
              </ul>
            </div>

            <div className="landing-elevated rounded-3xl p-8 sm:p-10 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/50 dark:bg-amber-950/40 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 landing-icon" />
              </div>
              <h3 className="text-2xl font-serif landing-heading mb-4">
                Patterns Across Time
              </h3>
              <p className="landing-body leading-relaxed mb-6">
                Months of journaling often sit unread because manual review takes hours. Inner Pages holds your entries together over time, highlighting recurring themes, emotional cycles, and blind spots.
              </p>
              <ul className="space-y-3 text-sm landing-body">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>Identifies repeating themes across months of writing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>Gently grounds circular overthinking into clarity</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 landing-icon shrink-0" />
                  <span>Surfaces insights for you to agree or push back on</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Sanctuary Showcase */}
      <section id="sanctuary-demo" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase landing-muted mb-3 block">
              The Sanctuary Experience
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif landing-heading mb-6">
              Inside the Bounded Ritual
            </h2>
            <p className="text-lg landing-body leading-relaxed">
              Explore how Inner Pages transforms scattered journaling into a living map of your inner life.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 mb-10 rounded-2xl landing-surface max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'editor' ? 'landing-tab-active shadow-sm' : 'landing-tab-inactive'
              }`}
            >
              1. Writing Sanctuary
            </button>
            <button
              onClick={() => setActiveTab('lenses')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'lenses' ? 'landing-tab-active shadow-sm' : 'landing-tab-inactive'
              }`}
            >
              2. Reflective Lenses
            </button>
            <button
              onClick={() => setActiveTab('grounding')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'grounding' ? 'landing-tab-active shadow-sm' : 'landing-tab-inactive'
              }`}
            >
              3. Rumination Pivot
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'patterns' ? 'landing-tab-active shadow-sm' : 'landing-tab-inactive'
              }`}
            >
              4. Pattern Synthesis (Preview)
            </button>
          </div>

          {/* Interactive Sanctuary Preview Card */}
          <div className="landing-elevated rounded-3xl p-6 sm:p-10 border shadow-lg transition-all duration-300">
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-subtle">
                  <div className="flex items-center gap-3">
                    <Feather className="w-5 h-5 landing-icon" />
                    <span className="font-serif text-lg font-medium landing-heading">Private Writing Canvas</span>
                  </div>
                  <span className="text-xs landing-muted">Focus Mode Enabled</span>
                </div>
                <div className="space-y-4 font-serif text-base sm:text-lg leading-relaxed landing-body italic opacity-90">
                  <p>
                    "I spent the morning feeling anxious about the decision, but as I sit here writing, I realize it wasn't about the project itself. It was the fear of disappointing people I respect..."
                  </p>
                </div>
                <div className="p-4 rounded-2xl landing-surface text-xs leading-relaxed landing-body flex items-start gap-3">
                  <BookOpen className="w-4 h-4 landing-icon shrink-0 mt-0.5" />
                  <span>A clean, calm canvas with no distractions, formatting pressure, or AI interference while you write.</span>
                </div>
              </div>
            )}

            {activeTab === 'lenses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-subtle">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 landing-icon" />
                    <span className="font-serif text-lg font-medium landing-heading">Reflective Lenses</span>
                  </div>
                  <span className="text-xs landing-muted">4 Angles of Reflection</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-2xl landing-surface border">
                    <div className="flex items-center gap-2 mb-2 font-serif font-medium landing-heading">
                      <Heart className="w-4 h-4 landing-lens-rose" />
                      <span>Emotional Lens</span>
                    </div>
                    <p className="landing-body text-xs leading-relaxed">
                      Highlights underlying feelings and emotional shifts present in your writing.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl landing-surface border">
                    <div className="flex items-center gap-2 mb-2 font-serif font-medium landing-heading">
                      <Brain className="w-4 h-4 landing-lens-indigo" />
                      <span>Cognitive Lens</span>
                    </div>
                    <p className="landing-body text-xs leading-relaxed">
                      Maps active thought patterns, assumptions, and implicit core beliefs.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl landing-surface border">
                    <div className="flex items-center gap-2 mb-2 font-serif font-medium landing-heading">
                      <Sparkles className="w-4 h-4 landing-lens-emerald" />
                      <span>Behavioral Lens</span>
                    </div>
                    <p className="landing-body text-xs leading-relaxed">
                      Connects stated intentions with actual choices and daily actions.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl landing-surface border">
                    <div className="flex items-center gap-2 mb-2 font-serif font-medium landing-heading">
                      <MessageCircle className="w-4 h-4 landing-lens-amber" />
                      <span>Relational Lens</span>
                    </div>
                    <p className="landing-body text-xs leading-relaxed">
                      Examines interpersonal dynamics, boundaries, and communication themes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grounding' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-subtle">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 landing-icon" />
                    <span className="font-serif text-lg font-medium landing-heading">Rumination Gate & Grounding</span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Loop Detection Active</span>
                </div>
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm leading-relaxed landing-body">
                  <div className="flex items-center gap-2 font-serif font-medium landing-heading mb-2">
                    <Sparkles className="w-4 h-4 landing-icon" />
                    <span>Grounding Pivot Interception</span>
                  </div>
                  <p className="mb-3">
                    "I notice we're exploring a familiar circular thought ('What if I'm not ready?'). Let's pause the abstract analysis for a moment:"
                  </p>
                  <p className="font-serif text-base italic landing-heading bg-surface p-3 rounded-xl border">
                    "What is one concrete action within your control in the next 24 hours?"
                  </p>
                </div>
                <p className="text-xs landing-muted">
                  Unlike AI assistants that validate endless overthinking, Inner Pages detects cognitive loops and gently guides you back to presence and agency.
                </p>
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-subtle">
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 landing-icon" />
                    <span className="font-serif text-lg font-medium landing-heading">Longitudinal Pattern Synthesis</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full landing-surface border landing-muted font-medium">
                    Feature Preview
                  </span>
                </div>
                <div className="p-3.5 rounded-xl landing-surface border text-xs landing-muted leading-relaxed">
                  💡 <strong>Longitudinal Preview:</strong> Pattern synthesis is built over time as you write and accumulate journal entries across weeks and months.
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl landing-surface border flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider landing-muted mb-1">
                        Recurring Theme • Multi-Entry Synthesis
                      </div>
                      <h4 className="font-serif text-base font-medium landing-heading">
                        Autonomy vs. Approval Tension
                      </h4>
                      <p className="text-xs landing-body mt-1 leading-relaxed">
                        Noticeable shift toward prioritizing internal standards over external validation over time.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 landing-icon shrink-0 mt-2" />
                  </div>
                  <div className="p-4 rounded-2xl landing-surface border flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider landing-muted mb-1">
                        Core Value • Lived Behavior Signal
                      </div>
                      <h4 className="font-serif text-base font-medium landing-heading">
                        Intellectual Honesty & Boundaries
                      </h4>
                      <p className="text-xs landing-body mt-1 leading-relaxed">
                        Consistent grounding when processing difficult choices in personal and professional relationships.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 landing-icon shrink-0 mt-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Epistemic Stance & Guardrails */}
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

      {/* Section 4: Privacy & Data Security Guarantee */}
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
            onClick={() => setShowPrivacyModal(true)}
            className="px-6 py-3 landing-btn-secondary text-sm font-medium inline-flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Read Full Privacy & Data Commitment</span>
          </button>
        </div>
      </section>

      {/* Section 5: Target Audience */}
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

      {/* Section 6: Final CTA */}
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

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-subtle landing-surface text-xs landing-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 landing-icon" />
            <span className="font-serif text-sm font-semibold landing-heading">My Inner Pages</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setShowPrivacyModal(true)} className="hover:underline">
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

      {/* Shared Privacy Policy Modal ([T-49]) */}
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
