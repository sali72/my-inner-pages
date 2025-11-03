import React from 'react';
import { ThemeType } from '@/types';

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  theme: ThemeType;
  ariaLabel: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  icon,
  theme,
  ariaLabel,
  size = 'md'
}) => {
  const isDark = theme === 'dark';
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-lg transition-colors ${
        isDark 
          ? 'hover:bg-slate-700 text-slate-300' 
          : 'hover:bg-slate-200 text-slate-700'
      }`}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
};
