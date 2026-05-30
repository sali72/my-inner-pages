import React from 'react';
import { BookOpen, Sparkles, MessageCircle, Settings } from 'lucide-react';
import { ViewType } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewType;
  onClose: () => void;
  onViewChange: (view: ViewType) => void;
}

const MENU_ITEMS: { view: ViewType; icon: typeof BookOpen; label: string }[] = [
  { view: 'journal', icon: BookOpen, label: 'Journal' },
  { view: 'mirror', icon: Sparkles, label: 'Mirror' },
  { view: 'chat', icon: MessageCircle, label: 'Chat' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onClose,
  onViewChange,
}) => {
  const handleViewClick = (view: ViewType) => {
    onViewChange(view);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface border-r border-default p-6 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-serif font-bold text-body flex items-center gap-2">
            <BookOpen className="w-7 h-7" />
            My Inner Pages
          </h1>
          <p className="text-sm mt-1 text-muted">
            Your story, page by page
          </p>
        </div>

        <nav className="space-y-2">
          {MENU_ITEMS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleViewClick(view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === view
                  ? 'bg-accent-muted text-accent'
                  : 'text-muted hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
