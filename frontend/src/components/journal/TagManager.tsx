import React, { useState, useEffect, useMemo } from 'react';
import { X, Pencil, Trash2, Palette, Tags, Hash, Search, ArrowUpDown } from 'lucide-react';
import { useAllTags, useRenameTag, useDeleteTag, useUpdateTagColor } from '@hooks/useTags';

const COLOR_PRESETS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#795548', '#607d8b',
];

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTagFilter?: (tag: string) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, onSelectTagFilter }) => {
  const { data: tags = [], refetch } = useAllTags();
  const renameTag = useRenameTag();
  const deleteTag = useDeleteTag();
  const updateTagColor = useUpdateTagColor();

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [colorPicker, setColorPicker] = useState<string | null>(null);
  const [showCloud, setShowCloud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'usage' | 'name'>('usage');

  const maxUsage = tags.length > 0 ? Math.max(...tags.map(t => t.usage_count)) : 1;

  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = tags.filter(t => !q || t.name.toLowerCase().includes(q));
    result = [...result].sort((a, b) => {
      if (sortBy === 'usage') {
        return b.usage_count - a.usage_count || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [tags, searchQuery, sortBy]);

  if (!isOpen) return null;

  const handleStartRename = (tagName: string) => {
    setEditingTag(tagName);
    setRenameValue(tagName);
    setColorPicker(null);
  };

  const handleRename = async () => {
    if (!editingTag || !renameValue.trim()) return;
    const normalizedNew = renameValue.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      await renameTag.mutateAsync({ oldName: editingTag, newName: normalizedNew });
      setEditingTag(null);
      setRenameValue('');
    } catch {}
  };

  const handleDelete = async (tagName: string) => {
    try {
      await deleteTag.mutateAsync(tagName);
      setConfirmDelete(null);
    } catch {}
  };

  const handleColorChange = async (tagName: string, color: string | null) => {
    try {
      await updateTagColor.mutateAsync({ name: tagName, color });
      setColorPicker(null);
    } catch {}
  };

  const handleTagClick = (tagName: string) => {
    if (onSelectTagFilter) {
      onSelectTagFilter(tagName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative card rounded-xl shadow-elevated max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-body">Manage Tags</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCloud(!showCloud)}
              className={`p-1.5 rounded-md transition-colors ${showCloud ? 'bg-accent-tint text-accent' : 'text-muted hover:text-body hover:bg-accent-tint/30'}`}
              aria-label={showCloud ? 'List view' : 'Cloud view'}
            >
              <Tags className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1 rounded-md text-muted hover:text-body hover:bg-accent-tint/30 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-border-default flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border input-field"
            />
          </div>
          <button
            onClick={() => setSortBy(prev => prev === 'usage' ? 'name' : 'usage')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-border-default text-muted hover:text-body transition-colors"
            title={`Sorting by ${sortBy === 'usage' ? 'Most Used' : 'Name'}`}
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === 'usage' ? 'Usage' : 'Name'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredTags.length === 0 && (
            <p className="text-sm text-muted text-center py-8">
              {searchQuery ? 'No tags match your search.' : 'No tags yet. Tags appear when you add them to your journal entries.'}
            </p>
          )}

          {showCloud ? (
            <div className="flex flex-wrap gap-2 justify-center py-4">
              {filteredTags.map((tag) => {
                const ratio = tag.usage_count / maxUsage;
                const size = Math.max(0.7, Math.min(1.8, 0.7 + ratio * 1.1));
                const color = tag.color;
                const bgStyle = color
                  ? { backgroundColor: `${color}20`, color }
                  : { backgroundColor: 'var(--accent-tint)', color: 'var(--accent)' };

                return (
                  <button
                    key={tag.name}
                    onClick={() => handleTagClick(tag.name)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full transition-transform hover:scale-110 cursor-pointer"
                    style={{
                      fontSize: `${size}rem`,
                      ...bgStyle,
                    }}
                  >
                    <Hash className="w-3 h-3" style={{ width: `${size * 0.6}rem`, height: `${size * 0.6}rem` }} />
                    {tag.name}
                    <span className="opacity-60 text-xs" style={{ fontSize: `${Math.max(0.6, size * 0.6)}rem` }}>
                      {tag.usage_count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tag) => (
                <div key={tag.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-tint/20 transition-colors group relative">
                  <button
                    onClick={() => setColorPicker(colorPicker === tag.name ? null : tag.name)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border border-border-default flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: tag.color || 'transparent' }}
                    aria-label={`Change color for ${tag.name}`}
                  >
                    {!tag.color && <Palette className="w-3 h-3 text-muted/50" />}
                  </button>

                  {colorPicker === tag.name && (
                    <div className="absolute z-10 top-full left-0 mt-1 p-2 card shadow-elevated rounded-lg flex gap-1">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(tag.name, tag.color === c ? null : c)}
                          className="w-6 h-6 rounded-full border border-border-default hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  )}

                  {editingTag === tag.name ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value.replace(/\s+/g, '-'))}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault();
                          setRenameValue(prev => prev + '-');
                        }
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') { setEditingTag(null); setRenameValue(''); }
                      }}
                      onBlur={handleRename}
                      className="flex-1 px-2 py-0.5 rounded text-sm input-field"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => handleTagClick(tag.name)}
                      className="flex-1 text-left text-sm text-body hover:text-accent transition-colors"
                    >
                      {tag.name}
                    </button>
                  )}

                  <span className="text-xs text-muted tabular-nums">{tag.usage_count}</span>

                  <button
                    onClick={() => handleStartRename(tag.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-accent transition-all"
                    aria-label={`Rename ${tag.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {confirmDelete === tag.name ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(tag.name)} className="px-2 py-0.5 rounded text-xs bg-red-500 text-white hover:bg-red-600 transition-colors">Confirm</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-0.5 rounded text-xs text-muted hover:text-body transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(tag.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-red-500 transition-all"
                      aria-label={`Delete ${tag.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
