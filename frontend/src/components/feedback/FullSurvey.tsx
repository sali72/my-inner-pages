import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Send, X } from 'lucide-react';
import { api } from '@/utils/api';
import { UsageStep } from './surveySteps/UsageStep';
import { FeaturesStep } from './surveySteps/FeaturesStep';
import { UIUXStep } from './surveySteps/UIUXStep';
import { RetentionStep } from './surveySteps/RetentionStep';
import { OpenStep } from './surveySteps/OpenStep';

const STEPS = [
  { id: 'usage', title: 'Usage Pattern', section: 1 },
  { id: 'features', title: 'Features Tried', section: 2 },
  { id: 'ui-ux', title: 'UI & Experience', section: 3 },
  { id: 'retention', title: 'Retention', section: 4 },
  { id: 'open', title: 'Open Feedback', section: 5 },
];

interface FullSurveyProps {
  onClose: () => void;
  sessionEntryCount?: number;
}

export const FullSurvey: React.FC<FullSurveyProps> = ({ onClose, sessionEntryCount = 0 }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const setAnswer = (key: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canAdvance = () => true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        variant: 'full',
        trigger: 'button',
        answers,
        questionnaire_version: '1.0',
        context: {
          locale: navigator.language,
          session_entry_count: sessionEntryCount,
        },
      });
      setSubmitted(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-4 pt-4">
        <div className="card p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <Send className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Thank You!</h2>
          <p className="text-sm text-secondary mb-6">
            Your feedback helps us make the app better for everyone.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-all"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-lg mx-auto p-4 pt-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-primary">Help us improve</h1>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-primary rounded-lg hover:bg-hover transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-secondary mb-3">
          All questions are optional — share what you're comfortable with.
        </p>

        <div className="w-full h-1 bg-base rounded-full mb-4">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted mb-3 text-center">
          Step {step + 1} of {STEPS.length} — {STEPS[step].title}
        </p>

        <div className="space-y-4">
          {step === 0 && <UsageStep answers={answers} setAnswer={setAnswer} />}
          {step === 1 && <FeaturesStep answers={answers} setAnswer={setAnswer} />}
          {step === 2 && <UIUXStep answers={answers} setAnswer={setAnswer} />}
          {step === 3 && <RetentionStep answers={answers} setAnswer={setAnswer} />}
          {step === 4 && <OpenStep answers={answers} setAnswer={setAnswer} />}
        </div>

        <div className="flex justify-between mt-6 pt-3 border-t border-default">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-all disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
