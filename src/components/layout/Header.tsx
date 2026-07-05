import React from 'react';
import { Menu, List } from 'lucide-react';
import { ViewType } from '@/types';

interface HeaderProps {
  activeView: ViewType;
  onMenuClick: () => void;
  onNavigationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onMenuClick,
  onNavigationClick,
}) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'journal': return 'Your Journal';
      case 'mirror': return 'Mirror';
      case 'chat': return 'Chat';
      case 'settings': return 'Settings';
      default: return 'Your Journal';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-b border-default z-40 flex items-center justify-between px-4`}
    >
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-accent-tint"
        >
          <Menu className="w-6 h-6 text-body" />
        </button>
        <h1 className="ml-4 text-xl font-serif font-bold text-body">
          {getViewTitle()}
        </h1>
      </div>

      {(activeView === 'journal' || activeView === 'chat') && onNavigationClick && (
        <button
          onClick={onNavigationClick}
          className="p-2 rounded-lg hover:bg-accent-tint"
          title={activeView === 'journal' ? 'Journal Navigation' : 'Chat History'}
        >
          <List className="w-6 h-6 text-body" />
        </button>
      )}
    </header>
  );
};
