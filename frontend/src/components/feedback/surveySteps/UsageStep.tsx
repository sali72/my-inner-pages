import { useState } from 'react';
import { Sun, CalendarDays, Calendar, Compass, Clock, HelpCircle, EyeOff, Frown, MoreHorizontal } from 'lucide-react';
import { VisualSelect } from './SurveyControls';

export function UsageStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  const [otherText, setOtherText] = useState('');
  const blocker = answers.journaling_blocker as string | undefined;

  return (
    <div className="space-y-4">
      <VisualSelect
        label="How often did you write during the test?"
        options={[
          { value: 'Daily', label: 'Daily', icon: Sun },
          { value: 'A few times a week', label: 'A few times a week', icon: CalendarDays },
          { value: 'Once or twice', label: 'Once or twice', icon: Calendar },
          { value: 'Just exploring', label: "Just exploring", icon: Compass },
        ]}
        value={answers.usage_frequency as string | undefined}
        onChange={v => setAnswer('usage_frequency', v)}
      />
      <VisualSelect
        label="What usually stops you from journaling more?"
        options={[
          { value: 'No time', label: 'No time', icon: Clock },
          { value: "Didn't know what to write", label: "Didn't know what to write", icon: HelpCircle },
          { value: 'Forgot the app existed', label: 'Forgot the app', icon: EyeOff },
          { value: 'No reason to come back', label: 'No reason to return', icon: Frown },
          { value: 'Other', label: 'Other', icon: MoreHorizontal },
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
