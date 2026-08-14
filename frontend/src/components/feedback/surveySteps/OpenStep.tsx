export function OpenStep({ answers, setAnswer }: { answers: Record<string, unknown>; setAnswer: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-primary mb-1">
          Anything that confused you, felt missing, or you wish worked differently?
        </p>
        <textarea
          value={(answers.confusion_or_missing as string) || ''}
          onChange={e => setAnswer('confusion_or_missing', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[80px]"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-primary mb-1">
          Any features you wish existed?
        </p>
        <textarea
          value={(answers.feature_wishlist as string) || ''}
          onChange={e => setAnswer('feature_wishlist', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent min-h-[80px]"
        />
      </div>
    </div>
  );
}
