import React from 'react';
import { Edit2 } from 'lucide-react';
import { JournalEntry, ThemeType, FontType, FontSizeType } from '@/types';
import { JournalPage } from './JournalPage';
import { NewEntryPage } from './NewEntryPage';

interface JournalViewProps {
  entries: JournalEntry[];
  currentPageIndex: number;
  theme: ThemeType;
  font: FontType;
  fontSize: FontSizeType;
  dragOffset: number;
  isFlipping: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onUpdateEntry: (id: number | string, updates: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: number | string) => void;
  onSaveNewEntry: (title: string, content: string, tags: string[]) => void;
  onGoToNewEntry: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  currentPageIndex,
  theme,
  font,
  fontSize,
  dragOffset,
  isFlipping,
  onDragStart,
  onDragMove,
  onDragEnd,
  onUpdateEntry,
  onDeleteEntry,
  onSaveNewEntry,
  onGoToNewEntry,
}) => {
  const isDark = theme === 'dark';
  const pages = [...entries, { id: 'new', date: 'Today', title: '', tags: [], content: '', isNew: true }];
  const currentPage = pages[currentPageIndex];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="max-w-4xl w-full mx-auto" style={{ perspective: '1500px' }}>
        {currentPage.isNew ? (
          <NewEntryPage
            theme={theme}
            font={font}
            fontSize={fontSize}
            dragOffset={dragOffset}
            isFlipping={isFlipping}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onSave={onSaveNewEntry}
          />
        ) : (
          <JournalPage
            entry={currentPage}
            theme={theme}
            font={font}
            fontSize={fontSize}
            dragOffset={dragOffset}
            isFlipping={isFlipping}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onUpdate={(updates) => onUpdateEntry(currentPage.id, updates)}
            onDelete={() => onDeleteEntry(currentPage.id)}
          />
        )}

        <div className="mt-6 text-center">
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-amber-500/70'}`}>
            Page {currentPageIndex + 1} of {pages.length}
          </p>
        </div>
      </div>

      {currentPageIndex < pages.length - 1 && (
        <button
          onClick={onGoToNewEntry}
          className={`fixed bottom-8 right-8 ${
            isDark ? 'bg-slate-700' : 'bg-gradient-to-r from-amber-500 to-orange-500'
          } text-white px-6 py-3 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 z-30`}
        >
          <Edit2 className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      )}
    </div>
  );
};
