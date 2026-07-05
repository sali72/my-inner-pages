import React from 'react';
import { Edit2 } from 'lucide-react';
import { JournalEntry, FontStyle, ContentFontSize } from '@/types';
import { JournalPage } from './JournalPage';
import { NewEntryPage } from './NewEntryPage';
import { JournalNavigationSidebar } from './JournalNavigationSidebar';

interface JournalViewProps {
  entries: JournalEntry[];
  currentPageIndex: number;
  font: FontStyle;
  fontSize: ContentFontSize;
  dragOffset: number;
  isFlipping: boolean;
  navigationSidebarOpen: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onUpdateEntry: (id: number | string, updates: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: number | string) => void;
  onSaveNewEntry: (title: string, content: string, tags: string[]) => void;
  onGoToNewEntry: () => void;
  onToggleNavigationSidebar: () => void;
  onNavigateToEntry: (index: number) => void;
  onStartChat: (entry: JournalEntry) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  currentPageIndex,
  font,
  fontSize,
  dragOffset,
  isFlipping,
  navigationSidebarOpen,
  onDragStart,
  onDragMove,
  onDragEnd,
  onUpdateEntry,
  onDeleteEntry,
  onSaveNewEntry,
  onGoToNewEntry,
  onToggleNavigationSidebar,
  onNavigateToEntry,
  onStartChat,
}) => {
  const pages = [...entries, { id: 'new', date: 'Today', title: '', tags: [], content: '', isNew: true }];
  const currentPage = pages[currentPageIndex];

  const handlePageClick = (direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? currentPageIndex - 1 : currentPageIndex + 1;
    if (targetIndex >= 0 && targetIndex < pages.length) {
      onNavigateToEntry(targetIndex);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center px-4 pt-2 pb-6 relative min-h-[calc(100vh-5rem)]">
        <div className="max-w-4xl w-full mx-auto" style={{ perspective: '1500px' }}>
          {currentPage.isNew ? (
            <NewEntryPage
              font={font}
              fontSize={fontSize}
              dragOffset={dragOffset}
              isFlipping={isFlipping}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onSave={onSaveNewEntry}
              onPageClick={handlePageClick}
            />
          ) : (
            <JournalPage
              entry={currentPage}
              font={font}
              fontSize={fontSize}
              dragOffset={dragOffset}
              isFlipping={isFlipping}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onUpdate={(updates) => onUpdateEntry(currentPage.id, updates)}
              onDelete={() => onDeleteEntry(currentPage.id)}
              onChat={() => onStartChat(currentPage)}
              onPageClick={handlePageClick}
            />
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Page {currentPageIndex + 1} of {pages.length}
            </p>
          </div>
        </div>

        {currentPageIndex < pages.length - 1 && (
          <button
            onClick={onGoToNewEntry}
            className={`fixed bottom-8 right-8 btn-primary px-6 py-3 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 z-30`}
          >
            <Edit2 className="w-5 h-5" />
            <span>New Entry</span>
          </button>
        )}
      </div>

      <JournalNavigationSidebar
        isOpen={navigationSidebarOpen}
        entries={entries}
        currentPageIndex={currentPageIndex}
        onClose={onToggleNavigationSidebar}
        onNavigateToEntry={onNavigateToEntry}
      />
    </>
  );
};
