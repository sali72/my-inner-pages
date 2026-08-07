import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '@/utils/api';
import { SummaryCards } from './SummaryCards';
import { AcquisitionSection } from './AcquisitionSection';
import { EngagementSection } from './EngagementSection';

interface SummaryData {
  total_users: number;
  total_users_prev_7d: number;
  dau: number;
  dau_prev_7d: number;
  total_journals: number;
  total_journals_prev_7d: number;
  total_chats: number;
  total_chats_prev_7d: number;
}

interface DailySignup {
  date: string;
  count: number;
}

interface AcquisitionData {
  signups_today: number;
  signups_7d: number;
  signups_30d: number;
  google_oauth_count: number;
  email_password_count: number;
  verified_count: number;
  unverified_stale_count: number;
  daily_signups: DailySignup[];
}

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

interface AdminStatsResponse {
  summary: SummaryData;
  acquisition: AcquisitionData;
  engagement: EngagementData;
}

export const OverviewTab: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AdminStatsResponse>('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('Failed to load operational stats from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-secondary text-sm">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 text-red-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || 'No data available.'}</span>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 bg-surface text-primary border border-default rounded-md text-xs hover:bg-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* At a glance cards */}
      <SummaryCards data={stats.summary} />

      {/* Acquisition Section */}
      <AcquisitionSection data={stats.acquisition} totalUsers={stats.summary.total_users} />

      {/* Engagement Section */}
      <EngagementSection data={stats.engagement} totalUsers={stats.summary.total_users} />
    </div>
  );
};
