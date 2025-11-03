import React from 'react';
import { BookOpen, Sparkles, Settings } from 'lucide-react';
import { ViewType, ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewType;
  theme: ThemeType;
  onClose: () => void;
  onViewChange: (view: ViewType) => void;
}

const MENU_ITEMS: { view: ViewType; icon: typeof BookOpen; label: string }[] = [
  { view: 'journal', icon: BookOpen, label: 'Journal' },
  { view: 'mirror', icon: Sparkles, label: 'Mirror' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  theme,
  onClose,
  onViewChange,
}) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

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
        className={`fixed left-0 top-0 h-full w-64 ${
          isDark ? 'bg-slate-800' : 'bg-white'
        } border-r ${themeConfig.border} p-6 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 mt-4">
          <h1
            className={`text-2xl font-serif font-bold ${themeConfig.accent} flex items-center gap-2`}
          >
            <BookOpen className="w-7 h-7" />
            My Inner Pages
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-amber-600/70'}`}>
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
                  ? isDark
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-amber-100 text-amber-900'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-700/50'
                  : 'text-amber-700 hover:bg-amber-50'
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
