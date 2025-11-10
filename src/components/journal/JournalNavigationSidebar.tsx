import React, { useState, useMemo } from 'react';
import { X, Search, Calendar, Filter } from 'lucide-react';
import { JournalEntry, ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface JournalNavigationSidebarProps {
    isOpen: boolean;
    entries: JournalEntry[];
    currentPageIndex: number;
    theme: ThemeType;
    onClose: () => void;
    onNavigateToEntry: (index: number) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

export const JournalNavigationSidebar: React.FC<JournalNavigationSidebarProps> = ({
    isOpen,
    entries,
    currentPageIndex,
    theme,
    onClose,
    onNavigateToEntry,
}) => {
    const isDark = theme === 'dark';
    const themeConfig = THEMES[theme];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [showFilters, setShowFilters] = useState(false);

    // Extract all unique tags from entries
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        entries.forEach(entry => {
            entry.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [entries]);

    // Filter and sort entries
    const filteredAndSortedEntries = useMemo(() => {
        let filtered = entries.filter(entry => {
            // Search filter
            const matchesSearch = searchQuery === '' ||
                entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.content.toLowerCase().includes(searchQuery.toLowerCase());

            // Tag filter
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.some(tag => entry.tags?.includes(tag));

            return matchesSearch && matchesTags;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
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
                className={`fixed right-0 top-0 h-full w-80 ${isDark ? 'bg-slate-800' : 'bg-white'
                    } border-l ${themeConfig.border} z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } flex flex-col`}
            >
                {/* Header */}
                <div className={`h-16 px-4 border-b ${themeConfig.border} flex items-center justify-between`}>
                    <h2 className={`text-xl font-serif font-bold ${themeConfig.accent}`}>
                        Journal Navigation
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className={`relative`}>
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search journals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark
                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                                : 'bg-amber-50 border-amber-200 text-amber-900 placeholder-amber-600/50'
                                } focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-slate-500' : 'focus:ring-amber-400'
                                }`}
                        />
                    </div>
                </div>

                {/* Filters & Sort */}
                <div className={`px-4 pb-3 border-b ${themeConfig.border}`}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-amber-700'
                            } hover:underline mb-2`}
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    {showFilters && (
                        <div className="space-y-3">
                            {/* Sort Options */}
                            <div>
                                <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                                    } mb-1 block`}>
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm ${isDark
                                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                        } focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-slate-500' : 'focus:ring-amber-400'
                                        }`}
                                >
                                    <option value="date-desc">Date (Newest First)</option>
                                    <option value="date-asc">Date (Oldest First)</option>
                                    <option value="title-asc">Title (A-Z)</option>
                                    <option value="title-desc">Title (Z-A)</option>
                                </select>
                            </div>

                            {/* Tag Filter */}
                            {allTags.length > 0 && (
                                <div>
                                    <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                                        } mb-1 block`}>
                                        Filter by Tags
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-2 py-1 rounded-full text-xs transition-colors ${selectedTags.includes(tag)
                                                    ? isDark
                                                        ? 'bg-slate-600 text-slate-100'
                                                        : 'bg-amber-500 text-white'
                                                    : isDark
                                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-amber-600'
                                                } hover:underline`}
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Entry List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredAndSortedEntries.length === 0 ? (
                        <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                            }`}>
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
                                    className={`w-full text-left p-3 rounded-lg transition-all ${isActive
                                        ? isDark
                                            ? 'bg-slate-700 ring-2 ring-slate-500'
                                            : 'bg-amber-100 ring-2 ring-amber-400'
                                        : isDark
                                            ? 'bg-slate-700/50 hover:bg-slate-700'
                                            : 'bg-amber-50 hover:bg-amber-100'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className={`font-medium text-sm line-clamp-1 ${isDark ? 'text-slate-100' : 'text-amber-900'
                                            }`}>
                                            {entry.title || 'Untitled'}
                                        </h3>
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                                        } mb-2`}>
                                        <Calendar className="w-3 h-3" />
                                        {entry.date}
                                    </div>
                                    {entry.tags && entry.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`px-1.5 py-0.5 rounded text-xs ${isDark
                                                        ? 'bg-slate-600 text-slate-300'
                                                        : 'bg-amber-200 text-amber-800'
                                                        }`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {entry.content && (
                                        <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-amber-700/70'
                                            }`}>
                                            {entry.content}
                                        </p>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Stats */}
                <div className={`p-4 border-t ${themeConfig.border} text-xs ${isDark ? 'text-slate-400' : 'text-amber-600/70'
                    }`}>
                    Showing {filteredAndSortedEntries.length} of {entries.length} journals
                </div>
            </aside>
        </>
    );
};
