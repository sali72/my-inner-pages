import React from 'react';
import { Menu, List } from 'lucide-react';
import { ViewType, ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface HeaderProps {
  activeView: ViewType;
  theme: ThemeType;
  onMenuClick: () => void;
  onNavigationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  theme, 
  onMenuClick,
  onNavigationClick 
}) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  const getViewTitle = () => {
    switch (activeView) {
      case 'journal':
        return 'Your Journal';
      case 'mirror':
        return 'Mirror';
      case 'settings':
        return 'Settings';
      default:
        return 'Your Journal';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 ${
        isDark ? 'bg-slate-800/90' : 'bg-white/90'
      } backdrop-blur-lg border-b ${themeConfig.border} z-40 flex items-center justify-between px-4`}
    >
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'}`}
        >
          <Menu className={`w-6 h-6 ${themeConfig.accent}`} />
        </button>
        <h1 className={`ml-4 text-xl font-serif font-bold ${themeConfig.accent}`}>
          {getViewTitle()}
        </h1>
      </div>
      
      {activeView === 'journal' && onNavigationClick && (
        <button
          onClick={onNavigationClick}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'}`}
          title="Journal Navigation"
        >
          <List className={`w-6 h-6 ${themeConfig.accent}`} />
        </button>
      )}
    </header>
  );
};
