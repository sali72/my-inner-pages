import { useState } from 'react';
import { VisualScale, VisualYesNo } from './SurveyControls';

export function UIUXStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  const [feltLostText, setFeltLostText] = useState('');

  return (
    <div className="space-y-4">
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
            className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}
