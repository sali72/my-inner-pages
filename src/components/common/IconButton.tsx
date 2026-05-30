import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  icon,
  ariaLabel,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-lg transition-colors hover:bg-surface-hover text-body`}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
};
