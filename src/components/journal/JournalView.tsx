import React, { useState, useMemo, useCallback } from 'react';
import { Edit2 } from 'lucide-react';
import { JournalEntry, FontStyle, ContentFontSize } from '@/types';
import { JournalTimeline } from './JournalTimeline';
import { JournalPage } from './JournalPage';

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

interface JournalViewProps {
  entries: JournalEntry[];
  font: FontStyle;
  fontSize: ContentFontSize;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onUpdateEntry: (id: number | string, updates: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: number | string) => void;
  onSaveNewEntry: (title: string, content: string, tags: string[], created_at?: string) => Promise<number | string>;
  onStartChat: (entry: JournalEntry) => void;
}

const draftEntry: JournalEntry = {
  id: 'new',
  date: new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  title: '',
  content: '',
  tags: [],
};

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  font,
  fontSize,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onUpdateEntry,
  onDeleteEntry,
  onSaveNewEntry,
  onStartChat,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<number | string | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => entry.tags?.includes(tag));
      return matchesSearch && matchesTags;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'date-asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [entries, searchQuery, selectedTags, sortBy]);

  const currentEntry = useMemo(() => {
    if (selectedEntryId === null) return null;
    return entries.find(e => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  const handleSelectEntry = useCallback((id: number | string) => {
    setSelectedEntryId(id);
    setIsNewEntry(false);
  }, []);

  const handleNewEntry = useCallback(() => {
    setSelectedEntryId('new');
    setIsNewEntry(true);
  }, []);

  const handleBackToTimeline = useCallback(() => {
    setSelectedEntryId(null);
    setIsNewEntry(false);
  }, []);

  const handleCreateEntry = useCallback(async (title: string, content: string, tags: string[], created_at?: string) => {
    const id = await onSaveNewEntry(title, content, tags, created_at);
    setSelectedEntryId(id);
    setIsNewEntry(false);
    return id;
  }, [onSaveNewEntry]);

  const handleDeleteEntry = useCallback((id: number | string) => {
    onDeleteEntry(id);
    setSelectedEntryId(null);
  }, [onDeleteEntry]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
  }, []);

  const displayEntry = isNewEntry ? draftEntry : currentEntry;

  if (displayEntry) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-5rem)]">
          <JournalPage
            key={displayEntry.id}
            entry={displayEntry}
            font={font}
            fontSize={fontSize}
            isNew={isNewEntry}
            allAppTags={allTags}
            onUpdate={(updates) => onUpdateEntry(displayEntry.id, updates)}
            onCreate={isNewEntry ? handleCreateEntry : undefined}
            onDelete={() => handleDeleteEntry(displayEntry.id)}
            onChat={() => onStartChat(displayEntry)}
            onBack={handleBackToTimeline}
          />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 relative min-h-[calc(100vh-5rem)]">
      <JournalTimeline
        entries={filteredEntries}
        allTags={allTags}
        font={font}
        fontSize={fontSize}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        sortBy={sortBy}
        showFilters={showFilters}
        onSearchChange={setSearchQuery}
        onTagToggle={(tag) =>
          setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
          )
        }
        onSortByChange={setSortBy}
        onFilterToggle={() => setShowFilters(prev => !prev)}
        onClearFilters={handleClearFilters}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        onStartChat={onStartChat}
        onDeleteEntry={(id) => handleDeleteEntry(id)}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
      <button
        onClick={handleNewEntry}
        className="fixed bottom-6 right-6 btn-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all z-30"
        aria-label="New entry"
      >
        <Edit2 className="w-6 h-6" />
      </button>
    </div>
  );
};
