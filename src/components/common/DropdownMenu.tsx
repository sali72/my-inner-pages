import React from 'react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeType;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  theme,
  children,
  align = 'right'
}) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div 
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 min-w-[12rem] rounded-lg shadow-lg z-20 ${
          themeConfig.paper
        } ${themeConfig.border} border`}
      >
        <div className="py-1">
          {children}
        </div>
      </div>
    </>
  );
};
