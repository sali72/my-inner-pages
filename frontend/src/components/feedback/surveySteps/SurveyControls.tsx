import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export type IconComponent = React.FC<{ className?: string }>;

export function VisualSelect({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                value === opt.value
                  ? 'border-accent bg-accent-tint ring-1 ring-accent'
                  : 'border-default text-secondary hover:border-hover hover:bg-hover'
              }`}
            >
              <Icon className={`w-5 h-5 ${value === opt.value ? 'text-accent' : 'text-muted'}`} />
              <span className={`text-xs leading-tight ${value === opt.value ? 'text-accent font-medium' : ''}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VisualMultiSelect({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent }[];
  value?: string[];
  onChange: (v: string[]) => void;
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
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-accent bg-accent-tint ring-1 ring-accent'
                  : 'border-default text-secondary hover:border-hover hover:bg-hover'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-muted'}`} />
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

export function VisualScale({ label, low, high, value, onChange }: {
  label: string;
  low: string;
  high: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  const labels = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="flex items-center gap-1 justify-center">
        <span className="text-[10px] text-muted w-12 text-right leading-tight">{low}</span>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl border transition-all min-w-0 flex-1 ${
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
        <span className="text-[10px] text-muted w-12 leading-tight">{high}</span>
      </div>
    </div>
  );
}

export function VisualYesNo({ label, value, onChange, yesLabel, noLabel }: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onChange('Yes')}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
            value === 'Yes'
              ? 'border-accent bg-accent-tint ring-1 ring-accent'
              : 'border-default text-secondary hover:border-hover hover:bg-hover'
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${value === 'Yes' ? 'text-accent' : 'text-muted'}`} />
          <span className={`text-xs ${value === 'Yes' ? 'text-accent font-medium' : ''}`}>{yesLabel || 'Yes'}</span>
        </button>
        <button
          onClick={() => onChange('No')}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
            value === 'No'
              ? 'border-accent bg-accent-tint ring-1 ring-accent'
              : 'border-default text-secondary hover:border-hover hover:bg-hover'
          }`}
        >
          <ThumbsDown className={`w-5 h-5 ${value === 'No' ? 'text-accent' : 'text-muted'}`} />
          <span className={`text-xs ${value === 'No' ? 'text-accent font-medium' : ''}`}>{noLabel || 'No'}</span>
        </button>
      </div>
    </div>
  );
}

export function VisualTernary({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string; icon: IconComponent }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
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
