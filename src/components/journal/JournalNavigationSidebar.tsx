import React, { useState, useMemo } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { JournalEntry } from '@/types';

interface JournalNavigationSidebarProps {
    isOpen: boolean;
    entries: JournalEntry[];
    currentPageIndex: number;
    onClose: () => void;
    onNavigateToEntry: (index: number) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

export const JournalNavigationSidebar: React.FC<JournalNavigationSidebarProps> = ({
    isOpen,
    entries,
    currentPageIndex,
    onClose,
    onNavigateToEntry,
}) => {
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

    const filteredAndSortedEntries = useMemo(() => {
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
                case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'title-asc': return a.title.localeCompare(b.title);
                case 'title-desc': return b.title.localeCompare(a.title);
                default: return 0;
            }
        });

        return filtered;
    }, [entries, searchQuery, selectedTags, sortBy]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleEntryClick = (entry: JournalEntry) => {
        const index = entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
            onNavigateToEntry(index);
            onClose();
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed right-0 top-0 h-full w-80 bg-surface border-l border-default z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
            >
                <div className="h-16 px-4 border-b border-default flex items-center">
                    <h2 className="text-xl font-serif font-bold text-body">
                        Journal Navigation
                    </h2>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search journals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-body placeholder:text-muted input-field`}
                        />
                    </div>
                </div>

                <div className="px-4 pb-3 border-b border-default">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-sm text-muted hover:underline mb-2"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    {showFilters && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted mb-1 block">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm input-field`}
                                >
                                    <option value="date-desc">Date (Newest First)</option>
                                    <option value="date-asc">Date (Oldest First)</option>
                                    <option value="title-asc">Title (A-Z)</option>
                                    <option value="title-desc">Title (Z-A)</option>
                                </select>
                            </div>

                            {allTags.length > 0 && (
                                <div>
                                    <label className="text-xs font-medium text-muted mb-1 block">
                                        Filter by Tags
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-accent text-white'
                                                        : 'bg-surface-hover text-muted hover:text-accent'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="text-xs mt-2 text-muted hover:underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-theme">
                    {filteredAndSortedEntries.length === 0 ? (
                        <p className="text-sm text-center py-8 text-muted">
                            No journals found
                        </p>
                    ) : (
                        filteredAndSortedEntries.map((entry) => {
                            const entryIndex = entries.findIndex(e => e.id === entry.id);
                            const isActive = entryIndex === currentPageIndex;

                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => handleEntryClick(entry)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-accent-muted ring-2 ring-accent'
                                            : 'bg-surface-hover/50 hover:bg-surface-hover'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-medium text-sm line-clamp-1 text-body">
                                            {entry.title || 'Untitled'}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted mb-2">
                                        <Calendar className="w-3 h-3" />
                                        {entry.date}
                                    </div>
                                    {entry.tags && entry.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="px-1.5 py-0.5 rounded text-xs bg-accent-tint text-accent-tint"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {entry.content && (
                                        <p className="text-xs mt-2 line-clamp-2 text-muted">
                                            {entry.content}
                                        </p>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-default text-xs text-muted">
                    Showing {filteredAndSortedEntries.length} of {entries.length} journals
                </div>
            </aside>
        </>
    );
};
