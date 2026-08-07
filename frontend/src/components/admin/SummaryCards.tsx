import React from 'react';
import { Users, Activity, BookOpen, MessageSquare } from 'lucide-react';
import { StatCard } from './StatCard';

interface SummaryData {
  total_users: number;
  total_users_prev_period: number;
  active_users_period: number;
  active_users_prev_period: number;
  total_journals: number;
  total_journals_prev_period: number;
  total_chats: number;
  total_chats_prev_period: number;
}

interface SummaryCardsProps {
  data: SummaryData;
  periodDays: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, periodDays }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={data.total_users}
        currentValue={data.total_users}
        prevValue={data.total_users_prev_period}
        description={`vs prev ${periodDays}d`}
        icon={<Users className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title={`Active (${periodDays}d)`}
        value={data.active_users_period}
        currentValue={data.active_users_period}
        prevValue={data.active_users_prev_period}
        subValue="Active Users"
        description={`vs prev ${periodDays}d`}
        icon={<Activity className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title="Journal Entries"
        value={data.total_journals}
        currentValue={data.total_journals}
        prevValue={data.total_journals_prev_period}
        description={`vs prev ${periodDays}d`}
        icon={<BookOpen className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title="AI Chat Sessions"
        value={data.total_chats}
        currentValue={data.total_chats}
        prevValue={data.total_chats_prev_period}
        description={`vs prev ${periodDays}d`}
        icon={<MessageSquare className="w-5 h-5 text-accent" />}
      />
    </div>
  );
};
