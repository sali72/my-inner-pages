import React from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { ProgressBar } from './ProgressBar';

import type { AcquisitionStats } from '@/types';

interface AcquisitionSectionProps {
  data: AcquisitionStats;
  totalUsers: number;
  periodDays: number;
}

export const AcquisitionSection: React.FC<AcquisitionSectionProps> = ({
  data,
  totalUsers,
  periodDays,
}) => {
  const verifiedPercent = totalUsers > 0 ? Math.round((data.verified_count / totalUsers) * 100) : 0;
  const googlePercent = totalUsers > 0 ? Math.round((data.google_oauth_count / totalUsers) * 100) : 0;
  const emailPercent = totalUsers > 0 ? Math.round((data.email_password_count / totalUsers) * 100) : 0;

  return (
    <div className="card p-6 border-default bg-surface space-y-6">
      <div className="flex items-center justify-between border-b border-default pb-3">
        <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-accent" />
          User Acquisition & Onboarding
        </h2>
        <div className="flex gap-4 text-xs">
          <span className="text-secondary">
            Today: <strong className="text-primary">{data.signups_today}</strong>
          </span>
          <span className="text-secondary">
            Selected Period ({periodDays}d): <strong className="text-primary">{data.signups_period}</strong>
          </span>
        </div>
      </div>

      {/* Sparkline chart */}
      <Sparkline data={data.daily_signups} periodDays={periodDays} />

      {/* Ratios & Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-4">
          <ProgressBar
            label="Authentication Provider"
            percentage={googlePercent}
            valueLabel={`Google (${googlePercent}%) · Email (${emailPercent}%)`}
            barColor="bg-sky-500"
          />

          <ProgressBar
            label="Email Verification Rate"
            percentage={verifiedPercent}
            valueLabel={`${data.verified_count} of ${totalUsers} verified (${verifiedPercent}%)`}
            barColor="bg-emerald-500"
          />
        </div>

        <div className="bg-base p-4 rounded-lg border border-default flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                Pending / Stale Verifications
              </h4>
              <p className="text-xs text-secondary mt-0.5">
                Accounts created &gt;24h ago that have not completed email verification.
              </p>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-default/50">
            <span className="text-xs text-muted">Unverified (&gt;24h)</span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {data.unverified_stale_count} accounts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
