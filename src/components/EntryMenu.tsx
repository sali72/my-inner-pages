import React from 'react';
import { MoreVertical, Edit2, Copy, Share2, Trash2 } from 'lucide-react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

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
  const themeConfig = THEMES[theme];

  return (
    <div className="relative ml-4">
      <button
        onClick={onToggle}
        className={`p-2 rounded-lg ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'
        } transition-all`}
      >
        <MoreVertical className={`w-5 h-5 ${themeConfig.accent}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle}></div>
          <div
            className={`absolute right-0 top-12 ${
              isDark ? 'bg-slate-800' : 'bg-white'
            } rounded-lg shadow-xl border ${themeConfig.border} py-2 min-w-[160px] z-20`}
          >
            <button
              onClick={onEdit}
              className={`w-full flex items-center gap-3 px-4 py-2 ${
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
              } transition-all`}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onCopy}
              className={`w-full flex items-center gap-3 px-4 py-2 ${
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
              } transition-all`}
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={onShare}
              className={`w-full flex items-center gap-3 px-4 py-2 ${
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'
              } transition-all`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-amber-200'} my-2`}></div>
            <button
              onClick={onDelete}
              className={`w-full flex items-center gap-3 px-4 py-2 ${
                isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
              } transition-all`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
