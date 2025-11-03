import React from 'react';
import { ThemeType } from '@/types';

interface DropdownMenuItemProps {
  onClick: () => void;
  theme: ThemeType;
  isActive?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  theme,
  isActive = false,
  icon,
  children
}) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
        isActive
          ? `${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`
          : `${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-medium">{children}</span>
    </button>
  );
};
