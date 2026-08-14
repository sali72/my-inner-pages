import React, { useState } from 'react';
import { 
  BarChart2,
  Users,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import { AdminFeedbackView } from '@components/feedback';
import { OverviewTab } from './OverviewTab';
import { UsersTab } from './UsersTab';
import { LlmTab } from './LlmTab';

export const AdminView: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'llm' | 'feedback'>('overview');

  return (
    <div className="max-w-4xl mx-auto p-4 pt-6 space-y-6">
      {/* Admin Tabs */}
      <div className="flex gap-1 bg-base rounded-lg p-1 border border-default w-fit">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            adminTab === 'overview' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            adminTab === 'users' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
        <button
          onClick={() => setAdminTab('llm')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            adminTab === 'llm' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <Cpu className="w-4 h-4" />
          LLM Providers
        </button>
        <button
          onClick={() => setAdminTab('feedback')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            adminTab === 'feedback' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>

      {adminTab === 'overview' && <OverviewTab />}
      {adminTab === 'users' && <UsersTab />}
      {adminTab === 'llm' && <LlmTab />}
      {adminTab === 'feedback' && <AdminFeedbackView />}
    </div>
  );
};
