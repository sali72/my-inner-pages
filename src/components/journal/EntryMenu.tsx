import React from 'react';
import { MoreVertical, Edit2, Copy, Share2, Trash2 } from 'lucide-react';
import { ThemeType } from '@/types';
import { IconButton, DropdownMenu } from '@components/common';

interface EntryMenuProps {
  theme: ThemeType;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export const EntryMenu: React.FC<EntryMenuProps> = ({
  theme,
  isOpen,
  onToggle,
  onEdit,
  onCopy,
  onShare,
  onDelete,
}) => {
  const isDark = theme === 'dark';

  const handleEdit = () => {
    onEdit();
    onToggle();
  };

  const handleCopy = () => {
    onCopy();
    onToggle();
  };

  const handleShare = () => {
    onShare();
    onToggle();
  };

  const handleDelete = () => {
    onDelete();
    onToggle();
  };

  return (
    <div className="relative ml-4">
      <IconButton
        onClick={onToggle}
        theme={theme}
        ariaLabel="Entry options"
        icon={<MoreVertical className="w-5 h-5" />}
      />

      <DropdownMenu isOpen={isOpen} onClose={onToggle} theme={theme}>
        <button
          onClick={handleEdit}
          className={`w-full flex items-center gap-3 px-4 py-2 ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
          } transition-all`}
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleCopy}
          className={`w-full flex items-center gap-3 px-4 py-2 ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
          } transition-all`}
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={handleShare}
          className={`w-full flex items-center gap-3 px-4 py-2 ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
          } transition-all`}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-amber-200'} my-2`}></div>
        <button
          onClick={handleDelete}
          className={`w-full flex items-center gap-3 px-4 py-2 ${
            isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
          } transition-all`}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </DropdownMenu>
    </div>
  );
};
