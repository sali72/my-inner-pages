import React from 'react';

interface ProgressBarProps {
  label: string;
  percentage: number;
  valueLabel?: string;
  barColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  valueLabel,
  barColor = 'bg-accent',
}) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-primary">{label}</span>
        <span className="text-secondary">{valueLabel || `${clamped}%`}</span>
      </div>
      <div className="w-full bg-base rounded-full h-2.5 overflow-hidden border border-default">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
