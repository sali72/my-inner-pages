import React from 'react';
import { Users, Activity, BookOpen, MessageSquare } from 'lucide-react';
import { StatCard } from './StatCard';

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

interface SummaryCardsProps {
  data: SummaryData;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={data.total_users}
        currentValue={data.total_users}
        prevValue={data.total_users_prev_7d}
        description="registered accounts"
        icon={<Users className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title="Active (24h)"
        value={data.dau}
        currentValue={data.dau}
        prevValue={data.dau_prev_7d}
        subValue="DAU"
        description="active in last 24h"
        icon={<Activity className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title="Journal Entries"
        value={data.total_journals}
        currentValue={data.total_journals}
        prevValue={data.total_journals_prev_7d}
        description="total reflections"
        icon={<BookOpen className="w-5 h-5 text-accent" />}
      />

      <StatCard
        title="AI Chat Sessions"
        value={data.total_chats}
        currentValue={data.total_chats}
        prevValue={data.total_chats_prev_7d}
        description="conversations held"
        icon={<MessageSquare className="w-5 h-5 text-accent" />}
      />
    </div>
  );
};
