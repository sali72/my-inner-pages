import React from 'react';

interface DailyData {
  date: string;
  count: number;
}

interface SparklineProps {
  data: DailyData[];
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, height = 64 }) => {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barWidth = 14;
  const gap = 8;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-secondary">
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          Signups (Last 14 Days)
        </span>
        <span className="font-mono text-muted">
          {data[0]?.date} — {data[data.length - 1]?.date}
        </span>
      </div>

      <div className="relative overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${totalWidth} ${height}`} className="w-full max-h-16 overflow-visible">
          {data.map((d, idx) => {
            const barHeight = d.count > 0 ? Math.max((d.count / maxCount) * (height - 12), 4) : 2;
            const x = idx * (barWidth + gap);
            const y = height - barHeight;

            return (
              <g key={d.date} className="group cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  className={`${
                    d.count > 0 ? 'fill-accent hover:fill-accent-hover' : 'fill-muted/20'
                  } transition-colors`}
                />
                <title>{`${d.date}: ${d.count} signup${d.count === 1 ? '' : 's'}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
