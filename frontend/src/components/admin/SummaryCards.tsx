import React from 'react';
import { Users, Activity, BookOpen, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { StatCard } from './StatCard';

interface LifetimeStats {
  total_users: number;
  total_journals: number;
  total_chats: number;
  verified_users: number;
}

interface SummaryData {
  lifetime: LifetimeStats;
  signups_current_period: number;
  signups_prev_period: number;
  active_users_period: number;
  active_users_prev_period: number;
  journals_current_period: number;
  journals_prev_period: number;
  chats_current_period: number;
  chats_prev_period: number;
}

interface SummaryCardsProps {
  data: SummaryData;
  periodDays: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, periodDays }) => {
  return (
    <div className="space-y-6">
      {/* Lifetime Scale Cards (Fixed Totals) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            Platform Lifetime Scale (All-Time Totals)
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-base p-4 rounded-xl border border-default flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Total Users</span>
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.lifetime.total_users.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">registered accounts</span>
            </div>
          </div>

          <div className="bg-base p-4 rounded-xl border border-default flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Total Journals</span>
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.lifetime.total_journals.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">all-time reflections</span>
            </div>
          </div>

          <div className="bg-base p-4 rounded-xl border border-default flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Total AI Chats</span>
              <MessageSquare className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.lifetime.total_chats.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">conversations held</span>
            </div>
          </div>

          <div className="bg-base p-4 rounded-xl border border-default flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Verified Accounts</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-serif text-primary">
                {data.lifetime.verified_users.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">email confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Activity Velocity Cards (Filtered with Deltas) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Period Activity ({periodDays}-Day Velocity & Deltas)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`New Signups (${periodDays}d)`}
            value={data.signups_current_period}
            currentValue={data.signups_current_period}
            prevValue={data.signups_prev_period}
            description={`vs prev ${periodDays}d`}
            icon={<Users className="w-5 h-5 text-accent" />}
          />

          <StatCard
            title={`Active Users (${periodDays}d)`}
            value={data.active_users_period}
            currentValue={data.active_users_period}
            prevValue={data.active_users_prev_period}
            description={`vs prev ${periodDays}d`}
            icon={<Activity className="w-5 h-5 text-accent" />}
          />

          <StatCard
            title={`New Journals (${periodDays}d)`}
            value={data.journals_current_period}
            currentValue={data.journals_current_period}
            prevValue={data.journals_prev_period}
            description={`vs prev ${periodDays}d`}
            icon={<BookOpen className="w-5 h-5 text-accent" />}
          />

          <StatCard
            title={`New AI Chats (${periodDays}d)`}
            value={data.chats_current_period}
            currentValue={data.chats_current_period}
            prevValue={data.chats_prev_period}
            description={`vs prev ${periodDays}d`}
            icon={<MessageSquare className="w-5 h-5 text-accent" />}
          />
        </div>
      </div>
    </div>
  );
};
