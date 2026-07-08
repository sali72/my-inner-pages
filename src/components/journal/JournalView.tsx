import React, { useState, useMemo, useCallback, useRef } from 'react';
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

function makeDraftEntry(): JournalEntry {
  const now = new Date();
  return {
    id: 'new',
    date: now.toLocaleString('en-US', {
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
}

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

  const navigatedAwayRef = useRef(false);
  const localEntryRef = useRef<Map<string | number, JournalEntry>>(new Map());

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    localEntryRef.current.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const allEntries = [...localEntryRef.current.values(), ...entries];
    let filtered = allEntries.filter(entry => {
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
    const fromLocal = localEntryRef.current.get(selectedEntryId);
    if (fromLocal) return fromLocal;
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
    navigatedAwayRef.current = true;
    setSelectedEntryId(null);
    setIsNewEntry(false);
  }, []);

  const handleCreateEntry = useCallback(async (title: string, content: string, tags: string[], created_at?: string) => {
    const id = await onSaveNewEntry(title, content, tags, created_at);
    if (navigatedAwayRef.current) return id;
    localEntryRef.current.set(id, {
      id,
      title,
      content,
      tags,
      date: created_at
        ? new Date(created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      created_at,
    });
    setSelectedEntryId(id);
    setIsNewEntry(false);
    return id;
  }, [onSaveNewEntry]);

  const handleDeleteEntry = useCallback((id: number | string) => {
    localEntryRef.current.delete(id);
    onDeleteEntry(id);
    setSelectedEntryId(null);
  }, [onDeleteEntry]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
  }, []);

  const displayEntry = isNewEntry ? makeDraftEntry() : currentEntry;

  if (displayEntry) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-5rem)]">
          <JournalPage
            key={isNewEntry ? 'new' : String(selectedEntryId)}
            entry={displayEntry}
            font={font}
            fontSize={fontSize}
            isNew={isNewEntry}
            allAppTags={allTags}
            onUpdateById={onUpdateEntry}
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
