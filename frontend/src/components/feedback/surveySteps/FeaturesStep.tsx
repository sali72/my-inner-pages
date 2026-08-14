import { FileText, Sparkles, MessageCircle, Minus, Meh, Bot, EyeOff, ThumbsUp } from 'lucide-react';
import { VisualSelect, VisualMultiSelect } from './SurveyControls';

export function FeaturesStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <VisualMultiSelect
        label="Which of these did you try?"
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
        options={[
          { value: 'Specific to me', label: 'Specific to me', icon: Sparkles },
          { value: 'Somewhat personal', label: 'Somewhat personal', icon: Meh },
          { value: 'Generic boilerplate', label: 'Generic', icon: Bot },
          { value: "Didn't try AI", label: "Didn't try AI", icon: EyeOff },
        ]}
        value={answers.ai_personalization as string | undefined}
        onChange={v => setAnswer('ai_personalization', v)}
      />
      <VisualSelect
        label="Did the Mirror Reflections feel accurate or generic?"
        options={[
          { value: 'Accurate', label: 'Accurate', icon: ThumbsUp },
          { value: 'A bit generic', label: 'A bit generic', icon: Meh },
          { value: "Didn't try it", label: "Didn't try it", icon: EyeOff },
        ]}
        value={answers.mirror_accuracy as string | undefined}
        onChange={v => setAnswer('mirror_accuracy', v)}
      />
      <VisualSelect
        label="Did the AI chat feel like a real conversation or more like a scripted bot?"
        options={[
          { value: 'Real conversation', label: 'Real convo', icon: MessageCircle },
          { value: 'Somewhere in between', label: 'In between', icon: Meh },
          { value: 'Scripted', label: 'Scripted', icon: Bot },
          { value: "Didn't try it", label: "Didn't try it", icon: EyeOff },
        ]}
        value={answers.chat_realism as string | undefined}
        onChange={v => setAnswer('chat_realism', v)}
      />
    </div>
  );
}
