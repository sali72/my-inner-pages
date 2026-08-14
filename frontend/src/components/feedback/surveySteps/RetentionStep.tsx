import { ThumbsUp, Meh, ThumbsDown } from 'lucide-react';
import { VisualTernary } from './SurveyControls';

export function RetentionStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
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
