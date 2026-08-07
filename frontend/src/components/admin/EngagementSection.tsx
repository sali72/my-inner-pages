import React from 'react';
import { Repeat, Layers, FileText } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface EngagementData {
  wau: number;
  mau: number;
  stickiness: number;
  returning_users: number;
  return_rate: number;
  engaged_users: number;
  avg_entries_per_active_user: number;
  avg_journal_length: number;
}

interface EngagementSectionProps {
  data: EngagementData;
  totalUsers: number;
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({ data, totalUsers }) => {
  const stickinessPercent = Math.round(data.stickiness * 100);
  const returnPercent = Math.round(data.return_rate * 100);
  const engagedPercent = totalUsers > 0 ? Math.round((data.engaged_users / totalUsers) * 100) : 0;

  return (
    <div className="card p-6 border-default bg-surface space-y-6">
      <div className="flex items-center justify-between border-b border-default pb-3">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
            <Repeat className="w-5 h-5 text-accent" />
            Engagement & Retention Metrics
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Standard rolling 30-day benchmarks & user retention health.
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-secondary">
            WAU (7d): <strong className="text-primary">{data.wau}</strong>
          </span>
          <span className="text-secondary">
            MAU (30d): <strong className="text-primary">{data.mau}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ratios & Stickiness */}
        <div className="space-y-4">
          <ProgressBar
            label="Product Stickiness (DAU 24h / MAU 30d)"
            percentage={stickinessPercent}
            valueLabel={`${data.stickiness.toFixed(2)} (${stickinessPercent}%)`}
            barColor="bg-indigo-500"
          />

          <ProgressBar
            label="Return Rate (Login > 1)"
            percentage={returnPercent}
            valueLabel={`${data.returning_users} of ${totalUsers} users (${returnPercent}%)`}
            barColor="bg-violet-500"
          />

          <ProgressBar
            label="Engaged Users (≥3 Entries)"
            percentage={engagedPercent}
            valueLabel={`${data.engaged_users} users (${engagedPercent}%)`}
            barColor="bg-purple-500"
          />
        </div>

        {/* Content & Activity depth cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-base p-4 rounded-lg border border-default flex flex-col justify-between">
            <div className="flex items-center gap-2 text-secondary text-xs font-semibold">
              <Layers className="w-4 h-4 text-accent" />
              <span>Avg Entries / Active User</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.avg_entries_per_active_user}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">entries per active user in period</span>
            </div>
          </div>

          <div className="bg-base p-4 rounded-lg border border-default flex flex-col justify-between">
            <div className="flex items-center gap-2 text-secondary text-xs font-semibold">
              <FileText className="w-4 h-4 text-accent" />
              <span>Avg Entry Length</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.avg_journal_length.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">characters per entry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
