import React from 'react';

interface DropdownMenuItemProps {
  onClick: () => void;
  isActive?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  isActive = false,
  icon,
  children
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
        isActive
          ? 'bg-surface-active text-accent'
          : 'text-body hover:bg-surface-hover'
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-medium">{children}</span>
    </button>
  );
};
