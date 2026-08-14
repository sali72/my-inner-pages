import React from 'react';
import { Layers, Brain, CheckCircle2 } from 'lucide-react';

export const LandingPhilosophy: React.FC = () => {
  return (
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
  );
};
