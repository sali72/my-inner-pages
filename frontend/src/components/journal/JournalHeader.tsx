import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Copy, Share2, MessageCircle, Trash2 } from 'lucide-react';

interface JournalHeaderProps {
  isNew: boolean;
  onBack: () => void;
  onCopy: () => void;
  onShare: () => void;
  onChat: () => void;
  onDeleteClick: () => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  isNew,
  onBack,
  onCopy,
  onShare,
  onChat,
  onDeleteClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div
      className="sticky top-0 z-20 pt-4 pb-2 px-6 md:px-8"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <div className="flex items-start justify-between h-8">
        <button
          onClick={onBack}
          className="p-1 rounded-md text-muted/50 hover:text-muted transition-colors"
          aria-label="Back to journal"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {!isNew && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-muted/50 hover:text-muted transition-colors"
              aria-label="Entry options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 min-w-[12rem] rounded-lg shadow-card-lg z-20 card py-1">
                <button
                  onClick={() => { onCopy(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all"
                >
                  <Copy className="w-4 h-4" />Copy
                </button>
                <button
                  onClick={() => { onShare(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all"
                >
                  <Share2 className="w-4 h-4" />Share
                </button>
                <button
                  onClick={() => { onChat(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all"
                >
                  <MessageCircle className="w-4 h-4" />Chat
                </button>
                <div className="h-px bg-border-default my-2" />
                <button
                  onClick={() => { onDeleteClick(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
