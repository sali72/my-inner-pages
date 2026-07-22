import React from 'react';
import { BookOpen, Sparkles, MessageCircle, Settings, Shield, HeartHandshake } from 'lucide-react';
import { ViewType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewType;
  onClose: () => void;
  onViewChange: (view: ViewType) => void;
}

const MAIN_ITEMS: { view: ViewType; icon: typeof BookOpen; label: string }[] = [
  { view: 'journal', icon: BookOpen, label: 'Journal' },
  { view: 'mirror', icon: Sparkles, label: 'Mirror' },
  { view: 'chat', icon: MessageCircle, label: 'Chat' },
];

const BOTTOM_ITEMS: { view: ViewType; icon: typeof BookOpen; label: string }[] = [
  { view: 'settings', icon: Settings, label: 'Settings' },
  { view: 'admin', icon: Shield, label: 'Admin' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onClose,
  onViewChange,
}) => {
  const { user } = useAuth();

  const handleViewClick = (view: ViewType) => {
    onViewChange(view);
    onClose();
  };

  const showAdmin = user?.role === 'admin';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface border-r border-default p-6 z-50 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 mt-4">
          <h1 className="text-2xl font-serif font-bold text-body flex items-center gap-2">
            <BookOpen className="w-7 h-7" />
            My Inner Pages
            <span className="text-[10px] font-medium text-accent bg-accent-tint px-1.5 py-0.5 rounded uppercase">Alpha</span>
          </h1>
          <p className="text-sm mt-1 text-muted">
            Your story, page by page
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {MAIN_ITEMS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleViewClick(view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === view
                  ? 'bg-accent-muted text-accent'
                  : 'text-muted hover:bg-accent-tint'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        <hr className="border-default mb-2" />

        <div className="space-y-1">
          {BOTTOM_ITEMS.map(({ view, icon: Icon, label }) => {
            if (view === 'admin' && !showAdmin) return null;
            return (
              <button
                key={view}
                onClick={() => handleViewClick(view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === view
                    ? 'bg-accent-muted text-accent'
                    : 'text-muted hover:bg-accent-tint'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handleViewClick('feedback')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mt-2 ${
            activeView === 'feedback'
              ? 'bg-accent-muted text-accent'
              : 'text-muted hover:bg-accent-tint'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          Help us improve
        </button>
      </aside>
    </>
  );
};
