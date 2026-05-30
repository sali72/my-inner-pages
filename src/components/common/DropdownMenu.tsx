import React from 'react';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  children,
  align = 'right'
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 min-w-[12rem] rounded-lg shadow-card-lg z-20 card`}
      >
        <div className="py-1">
          {children}
        </div>
      </div>
    </>
  );
};
