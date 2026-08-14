import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Calendar } from 'lucide-react';
import { api } from '@/utils/api';
import { SummaryCards } from './SummaryCards';
import { AcquisitionSection } from './AcquisitionSection';
import { EngagementSection } from './EngagementSection';

import type { AdminStatsResponse } from '@/types';

type PeriodType = '7d' | '14d' | '30d' | '90d';

export const OverviewTab: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('14d');
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (selectedPeriod: PeriodType) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AdminStatsResponse>(`/admin/stats?period=${selectedPeriod}`);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('Failed to load operational stats from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-default pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Operational Overview</h1>
          <p className="text-xs text-secondary mt-0.5">
            Real-time analytics, user growth, and platform activity metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-base p-1 rounded-lg border border-default">
          <Calendar className="w-4 h-4 text-accent ml-2" />
          <div className="flex gap-1">
            {(['7d', '14d', '30d', '90d'] as PeriodType[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  period === p
                    ? 'bg-surface text-primary shadow-sm border border-default'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-secondary text-sm">Loading platform analytics...</p>
          </div>
        </div>
      ) : error || !stats ? (
        <div className="p-6 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error || 'No data available.'}</span>
          </div>
          <button
            onClick={() => fetchStats(period)}
            className="px-3 py-1.5 bg-surface text-primary border border-default rounded-md text-xs hover:bg-hover"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary section (Lifetime + Period Velocity Cards) */}
          <SummaryCards data={stats.summary} periodDays={stats.period_days} />

          {/* Acquisition Section */}
          <AcquisitionSection
            data={stats.acquisition}
            totalUsers={stats.summary.lifetime.total_users}
            periodDays={stats.period_days}
          />

          {/* Engagement Section */}
          <EngagementSection data={stats.engagement} totalUsers={stats.summary.lifetime.total_users} />
        </div>
      )}
    </div>
  );
};
