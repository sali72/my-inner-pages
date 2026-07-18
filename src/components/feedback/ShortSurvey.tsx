import React, { useState } from 'react';
import { X, Send, Clock, HelpCircle, EyeOff, Frown } from 'lucide-react';
import { api } from '@/utils/api';

interface ShortSurveyProps {
  trigger: 'session_nudge' | 'exit_intent';
  onClose: () => void;
}

export const ShortSurvey: React.FC<ShortSurveyProps> = ({ trigger, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (key: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleDismiss = async () => {
    try {
      await api.post('/feedback/dismiss', { trigger });
    } catch {}
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        variant: 'short',
        trigger,
        answers,
        context: {},
      });
      await api.post('/feedback/dismiss', { trigger });
    } catch {}
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="card p-6 max-w-sm w-full text-center shadow-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <Send className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-1">Thanks!</h3>
          <p className="text-sm text-secondary mb-4">
            Want to share more? Tap 'Help us improve' anytime in the sidebar.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Quick feedback</h3>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-hover transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Q1: overall_feel */}
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-primary">How's it going so far?</p>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-[10px] text-muted w-10 text-right leading-tight">Poor</span>
              {[1, 2, 3, 4, 5].map(n => {
                const labels = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];
                return (
                  <button
                    key={n}
                    onClick={() => setAnswer('overall_feel', n)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all min-w-0 flex-1 ${
                      answers.overall_feel === n
                        ? 'border-accent bg-accent-tint ring-1 ring-accent'
                        : 'border-default text-secondary hover:border-hover hover:bg-hover'
                    }`}
                  >
                    <span className={`text-sm font-bold ${answers.overall_feel === n ? 'text-accent' : ''}`}>{n}</span>
                    <span className={`text-[8px] leading-tight ${answers.overall_feel === n ? 'text-accent' : 'text-muted'}`}>
                      {labels[n]}
                    </span>
                  </button>
                );
              })}
              <span className="text-[10px] text-muted w-10 leading-tight">Great</span>
            </div>
          </div>

          {/* Q2: journaling_blocker (exit_intent only) */}
          {trigger === 'exit_intent' && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-primary">What stopped you from writing more today?</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'No time', label: 'No time', icon: Clock },
                  { value: "Didn't know what", label: "Didn't know what", icon: HelpCircle },
                  { value: "Didn't feel like it", label: "Didn't feel like it", icon: Frown },
                  { value: 'Just exploring', label: 'Just exploring', icon: EyeOff },
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = answers.journaling_blocker === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer('journaling_blocker', opt.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-accent bg-accent-tint ring-1 ring-accent'
                          : 'border-default text-secondary hover:border-hover hover:bg-hover'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                      <span className={`text-[10px] leading-tight ${isSelected ? 'text-accent font-medium' : ''}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Q3: open_note */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-primary">Anything you want to tell us?</p>
            <textarea
              value={(answers.open_note as string) || ''}
              onChange={e => setAnswer('open_note', e.target.value)}
              placeholder="Optional..."
              className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-3 border-t border-default">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 rounded-lg border border-default text-sm text-secondary hover:text-primary hover:bg-hover transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
