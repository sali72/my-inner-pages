import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  prevValue?: number;
  currentValue?: number;
  icon?: React.ReactNode;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  prevValue,
  currentValue,
  icon,
  description,
}) => {
  let deltaPercent: number | null = null;
  if (typeof prevValue === 'number' && typeof currentValue === 'number') {
    if (prevValue === 0) {
      deltaPercent = currentValue > 0 ? 100 : 0;
    } else {
      deltaPercent = Math.round(((currentValue - prevValue) / prevValue) * 100);
    }
  }

  return (
    <div className="card p-5 border-default bg-surface hover:border-hover transition-all flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {title}
        </span>
        {icon && <div className="p-2 rounded-lg bg-base text-accent">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold font-serif text-primary">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {deltaPercent !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              deltaPercent > 0
                ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                : deltaPercent < 0
                ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                : 'bg-base text-secondary'
            }`}
          >
            {deltaPercent > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : deltaPercent < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
          </span>
        )}
      </div>

      {(subValue || description) && (
        <div className="text-xs text-muted">
          {subValue && <span className="font-medium text-secondary">{subValue}</span>}
          {subValue && description && <span> · </span>}
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  );
};
