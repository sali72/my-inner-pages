import React from 'react';
import { MoreVertical, Edit2, Copy, Share2, Trash2 } from 'lucide-react';
import { IconButton, DropdownMenu } from '@components/common';

interface EntryMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export const EntryMenu: React.FC<EntryMenuProps> = ({
  isOpen,
  onToggle,
  onEdit,
  onCopy,
  onShare,
  onDelete,
}) => {
  const handleEdit = () => { onEdit(); onToggle(); };
  const handleCopy = () => { onCopy(); onToggle(); };
  const handleShare = () => { onShare(); onToggle(); };
  const handleDelete = () => { onDelete(); onToggle(); };

  return (
    <div className="relative ml-4">
      <IconButton
        onClick={onToggle}
        ariaLabel="Entry options"
        icon={<MoreVertical className="w-5 h-5" />}
      />

      <DropdownMenu isOpen={isOpen} onClose={onToggle}>
        <button
          onClick={handleEdit}
          className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-surface-hover transition-all"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleCopy}
          className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-surface-hover transition-all"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={handleShare}
          className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-surface-hover transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <div className="h-px bg-border-default my-2"></div>
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </DropdownMenu>
    </div>
  );
};
