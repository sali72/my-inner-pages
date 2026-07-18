import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Send, X,
  Sun, CalendarDays, Calendar, Compass,
  Clock, HelpCircle, EyeOff, Frown, MoreHorizontal,
  FileText, Sparkles, MessageCircle, Minus,
  ThumbsUp, Meh, Bot,
  ThumbsDown,
} from 'lucide-react';
import { api } from '@/utils/api';

const STEPS = [
  { id: 'usage', title: 'Usage Pattern', section: 1 },
  { id: 'features', title: 'Features Tried', section: 2 },
  { id: 'ui-ux', title: 'UI & Experience', section: 3 },
  { id: 'retention', title: 'Retention', section: 4 },
  { id: 'open', title: 'Open Feedback', section: 5 },
];

interface FullSurveyProps {
  onClose: () => void;
}

export const FullSurvey: React.FC<FullSurveyProps> = ({ onClose }) => {
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
        context: {},
      });
      setSubmitted(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-4 pt-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <Send className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Thank You!</h2>
          <p className="text-secondary mb-8">
            Your feedback helps us make the app better for everyone.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-all"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-primary">Help us improve</h1>
        <button
          onClick={onClose}
          className="p-2 text-muted hover:text-primary rounded-lg hover:bg-hover transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-secondary mb-4">
        All questions are optional — share what you're comfortable with.
      </p>

      <div className="w-full h-1.5 bg-base rounded-full mb-6">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted mb-6 text-center">
        Step {step + 1} of {STEPS.length} — {STEPS[step].title}
      </p>

      <div className="space-y-6">
        {step === 0 && <UsageStep answers={answers} setAnswer={setAnswer} />}
        {step === 1 && <FeaturesStep answers={answers} setAnswer={setAnswer} />}
        {step === 2 && <UIUXStep answers={answers} setAnswer={setAnswer} />}
        {step === 3 && <RetentionStep answers={answers} setAnswer={setAnswer} />}
        {step === 4 && <OpenStep answers={answers} setAnswer={setAnswer} />}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-default">
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

type IconComponent = React.FC<{ className?: string }>;

function VisualSelect({ label, options, value, onChange, columns }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent; desc?: string }[];
  value?: string;
  onChange: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className={`grid ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
                value === opt.value
                  ? 'border-accent bg-accent-tint ring-1 ring-accent'
                  : 'border-default text-secondary hover:border-hover hover:bg-hover'
              }`}
            >
              <Icon className={`w-6 h-6 ${value === opt.value ? 'text-accent' : 'text-muted'}`} />
              <span className={`text-xs leading-tight ${value === opt.value ? 'text-accent font-medium' : ''}`}>
                {opt.label}
              </span>
              {opt.desc && (
                <span className="text-[10px] text-muted leading-tight">{opt.desc}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisualMultiSelect({ label, options, value, onChange, columns }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent }[];
  value?: string[];
  onChange: (v: string[]) => void;
  columns?: 1 | 2;
}) {
  const selected = value || [];
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className={`grid ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-accent bg-accent-tint ring-1 ring-accent'
                  : 'border-default text-secondary hover:border-hover hover:bg-hover'
              }`}
            >
              <Icon className={`w-6 h-6 ${isSelected ? 'text-accent' : 'text-muted'}`} />
              <span className={`text-xs leading-tight ${isSelected ? 'text-accent font-medium' : ''}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisualScale({ label, low, high, value, onChange }: {
  label: string;
  low: string;
  high: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  const labels = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="flex items-center gap-1.5 justify-center">
        <span className="text-[10px] text-muted w-14 text-right leading-tight">{low}</span>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border transition-all min-w-0 flex-1 ${
              value === n
                ? 'border-accent bg-accent-tint ring-1 ring-accent'
                : 'border-default text-secondary hover:border-hover hover:bg-hover'
            }`}
          >
            <span className={`text-sm font-bold ${value === n ? 'text-accent' : ''}`}>{n}</span>
            <span className={`text-[9px] leading-tight ${value === n ? 'text-accent' : 'text-muted'}`}>
              {labels[n]}
            </span>
          </button>
        ))}
        <span className="text-[10px] text-muted w-14 leading-tight">{high}</span>
      </div>
    </div>
  );
}

function VisualYesNo({ label, value, onChange, yesLabel, noLabel }: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange('Yes')}
          className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
            value === 'Yes'
              ? 'border-accent bg-accent-tint ring-1 ring-accent'
              : 'border-default text-secondary hover:border-hover hover:bg-hover'
          }`}
        >
          <ThumbsUp className={`w-6 h-6 ${value === 'Yes' ? 'text-accent' : 'text-muted'}`} />
          <span className={`text-xs ${value === 'Yes' ? 'text-accent font-medium' : ''}`}>{yesLabel || 'Yes'}</span>
        </button>
        <button
          onClick={() => onChange('No')}
          className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
            value === 'No'
              ? 'border-accent bg-accent-tint ring-1 ring-accent'
              : 'border-default text-secondary hover:border-hover hover:bg-hover'
          }`}
        >
          <ThumbsDown className={`w-6 h-6 ${value === 'No' ? 'text-accent' : 'text-muted'}`} />
          <span className={`text-xs ${value === 'No' ? 'text-accent font-medium' : ''}`}>{noLabel || 'No'}</span>
        </button>
      </div>
    </div>
  );
}

function VisualTernary({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                value === opt.value
                  ? 'border-accent bg-accent-tint ring-1 ring-accent'
                  : 'border-default text-secondary hover:border-hover hover:bg-hover'
              }`}
            >
              <Icon className={`w-5 h-5 ${value === opt.value ? 'text-accent' : 'text-muted'}`} />
              <span className={`text-[11px] leading-tight ${value === opt.value ? 'text-accent font-medium' : ''}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Step 1: Usage Pattern ---- */
function UsageStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  const [otherText, setOtherText] = useState('');
  const blocker = answers.journaling_blocker as string | undefined;

  return (
    <div className="space-y-5">
      <VisualSelect
        label="How often did you write during the test?"
        columns={2}
        options={[
          { value: 'Daily', label: 'Daily', icon: Sun, desc: 'Every single day' },
          { value: 'A few times a week', label: 'A few times a week', icon: CalendarDays, desc: '2–5 times' },
          { value: 'Once or twice', label: 'Once or twice', icon: Calendar, desc: 'Just a couple' },
          { value: 'Just exploring', label: "Just exploring", icon: Compass, desc: "Didn't really journal" },
        ]}
        value={answers.usage_frequency as string | undefined}
        onChange={v => setAnswer('usage_frequency', v)}
      />
      <VisualSelect
        label="What usually stops you from journaling more?"
        columns={2}
        options={[
          { value: 'No time', label: 'No time', icon: Clock, desc: 'Too busy' },
          { value: "Didn't know what to write", label: "Didn't know what to write", icon: HelpCircle, desc: 'Writer\'s block' },
          { value: 'Forgot the app existed', label: 'Forgot the app', icon: EyeOff, desc: 'Out of sight' },
          { value: 'No reason to come back', label: 'No reason to return', icon: Frown, desc: 'Missing motivation' },
          { value: 'Other', label: 'Other', icon: MoreHorizontal, desc: 'Something else' },
        ]}
        value={blocker}
        onChange={v => { setAnswer('journaling_blocker', v); if (v !== 'Other') setOtherText(''); }}
      />
      {blocker === 'Other' && (
        <div>
          <p className="text-xs font-medium text-secondary mb-1">Please specify:</p>
          <input
            type="text"
            value={otherText}
            onChange={e => { setOtherText(e.target.value); setAnswer('journaling_blocker_other', e.target.value); }}
            className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}

/* ---- Step 2: Features Tried ---- */
function FeaturesStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <VisualMultiSelect
        label="Which of these did you try?"
        columns={2}
        options={[
          { value: 'Writing entries', label: 'Writing entries', icon: FileText },
          { value: 'Mirror Reflections', label: 'Mirror Reflections', icon: Sparkles },
          { value: 'Chat', label: 'Chat', icon: MessageCircle },
          { value: 'None beyond journaling', label: 'None beyond', icon: Minus },
        ]}
        value={answers.features_tried as string[] | undefined}
        onChange={v => setAnswer('features_tried', v)}
      />
      <VisualSelect
        label="Of the ones you tried, which felt most useful?"
        columns={2}
        options={[
          { value: 'Writing entries', label: 'Writing entries', icon: FileText },
          { value: 'Mirror Reflections', label: 'Mirror Reflections', icon: Sparkles },
          { value: 'Chat', label: 'Chat', icon: MessageCircle },
          { value: 'None beyond journaling', label: 'None beyond', icon: Minus },
        ]}
        value={answers.features_most_useful as string | undefined}
        onChange={v => setAnswer('features_most_useful', v)}
      />
      <VisualSelect
        label="Did the AI's responses feel specific to you or generic?"
        columns={2}
        options={[
          { value: 'Specific to me', label: 'Specific to me', icon: Sparkles, desc: 'Felt personal' },
          { value: 'Somewhat personal', label: 'Somewhat personal', icon: Meh, desc: 'Kinda tailored' },
          { value: 'Generic boilerplate', label: 'Generic', icon: Bot, desc: 'Felt copy-pasted' },
          { value: "Didn't try AI", label: "Didn't try AI", icon: EyeOff, desc: 'Skipped AI features' },
        ]}
        value={answers.ai_personalization as string | undefined}
        onChange={v => setAnswer('ai_personalization', v)}
      />
      <VisualSelect
        label="Did the Mirror Reflections feel accurate or generic?"
        columns={2}
        options={[
          { value: 'Accurate', label: 'Accurate', icon: ThumbsUp, desc: 'Felt personal' },
          { value: 'A bit generic', label: 'A bit generic', icon: Meh, desc: 'Somewhat vague' },
          { value: "Didn't try it", label: "Didn't try it", icon: EyeOff, desc: 'Skipped this' },
        ]}
        value={answers.mirror_accuracy as string | undefined}
        onChange={v => setAnswer('mirror_accuracy', v)}
      />
      <VisualSelect
        label="Did the AI chat feel like a real conversation or more like a scripted bot?"
        columns={2}
        options={[
          { value: 'Real conversation', label: 'Real convo', icon: MessageCircle, desc: 'Felt natural' },
          { value: 'Somewhere in between', label: 'In between', icon: Meh, desc: 'Mixed' },
          { value: 'Scripted', label: 'Scripted', icon: Bot, desc: 'Felt robotic' },
          { value: "Didn't try it", label: "Didn't try it", icon: EyeOff, desc: 'Skipped this' },
        ]}
        value={answers.chat_realism as string | undefined}
        onChange={v => setAnswer('chat_realism', v)}
      />
    </div>
  );
}

/* ---- Step 3: UI/UX ---- */
function UIUXStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  const [feltLostText, setFeltLostText] = useState('');

  return (
    <div className="space-y-5">
      <VisualScale
        label="Overall, how did the app feel to use?"
        low="Confusing"
        high="Smooth"
        value={answers.overall_feel as number | undefined}
        onChange={v => setAnswer('overall_feel', v)}
      />
      <VisualScale
        label="Did the app help you understand yourself better?"
        low="Not really"
        high="Absolutely"
        value={answers.self_understanding as number | undefined}
        onChange={v => setAnswer('self_understanding', v)}
      />
      <VisualYesNo
        label="Was there a moment you felt lost or unsure what to do next?"
        value={answers.felt_lost as string | undefined}
        onChange={v => { setAnswer('felt_lost', v); if (v !== 'Yes') setFeltLostText(''); }}
      />
      {answers.felt_lost === 'Yes' && (
        <div>
          <p className="text-xs font-medium text-secondary mb-1">What happened?</p>
          <textarea
            value={feltLostText}
            onChange={e => { setFeltLostText(e.target.value); setAnswer('felt_lost_detail', e.target.value); }}
            className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}

/* ---- Step 4: Retention & Pricing ---- */
function RetentionStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <VisualTernary
        label="Would you keep using this if it were free?"
        options={[
          { value: 'Yes', label: 'Yes', icon: ThumbsUp },
          { value: 'Maybe', label: 'Maybe', icon: Meh },
          { value: 'No', label: 'No', icon: ThumbsDown },
        ]}
        value={answers.would_use_free as string | undefined}
        onChange={v => setAnswer('would_use_free', v)}
      />
      <VisualTernary
        label="Would you pay for it?"
        options={[
          { value: 'Yes', label: 'Yes', icon: ThumbsUp },
          { value: 'Maybe, depends on price', label: 'Depends', icon: Meh },
          { value: 'No', label: 'No', icon: ThumbsDown },
        ]}
        value={answers.would_pay as string | undefined}
        onChange={v => setAnswer('would_pay', v)}
      />
    </div>
  );
}

/* ---- Step 5: Open Feedback ---- */
function OpenStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary mb-1.5">
          Anything that confused you, felt missing, or you wish worked differently?
        </p>
        <textarea
          value={(answers.confusion_or_missing as string) || ''}
          onChange={e => setAnswer('confusion_or_missing', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[100px]"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-primary mb-1.5">
          Any features you wish existed?
        </p>
        <textarea
          value={(answers.feature_wishlist as string) || ''}
          onChange={e => setAnswer('feature_wishlist', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[100px]"
        />
      </div>
    </div>
  );
}
