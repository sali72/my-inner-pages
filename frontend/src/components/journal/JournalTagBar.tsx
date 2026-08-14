import React, { useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface JournalTagBarProps {
  allTags: string[];
  tagColorMap: Record<string, string | null>;
  showTagInput: boolean;
  tagInputValue: string;
  filteredTagInputSuggestions: string[];
  tagAutoActiveIndex: number;
  onSelectTagFilter?: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onShowTagInput: () => void;
  onHideTagInput: () => void;
  onTagInputValueChange: (val: string) => void;
  onTagAutoActiveIndexChange: (idx: number | ((i: number) => number)) => void;
  onAddTagDirect: (tag: string) => void;
}

export const JournalTagBar: React.FC<JournalTagBarProps> = ({
  allTags,
  tagColorMap,
  showTagInput,
  tagInputValue,
  filteredTagInputSuggestions,
  tagAutoActiveIndex,
  onSelectTagFilter,
  onRemoveTag,
  onShowTagInput,
  onHideTagInput,
  onTagInputValueChange,
  onTagAutoActiveIndexChange,
  onAddTagDirect,
}) => {
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-6 min-h-[1.5rem]">
      {allTags.map((tag) => {
        const color = tagColorMap[tag];
        return color ? (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs group cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: `${color}20`, color }}
            onClick={() => onSelectTagFilter?.(tag)}
          >
            #{tag}
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveTag(tag); }}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-red-500 transition-colors p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ) : (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-accent-tint/50 text-accent-tint group cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onSelectTagFilter?.(tag)}
          >
            #{tag}
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveTag(tag); }}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-red-500 transition-colors p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {!showTagInput && (
        <button
          onClick={onShowTagInput}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs text-muted/30 hover:text-muted hover:bg-accent-tint/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}

      {showTagInput && (
        <div className="relative inline-block">
          <input
            ref={tagInputRef}
            type="text"
            value={tagInputValue}
            onChange={(e) => {
              onTagInputValueChange(e.target.value.replace(/\s+/g, '-'));
              onTagAutoActiveIndexChange(0);
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                onTagInputValueChange(tagInputValue + '-');
              }
              if (e.key === 'Enter') {
                if (filteredTagInputSuggestions.length > 0) {
                  onAddTagDirect(filteredTagInputSuggestions[tagAutoActiveIndex]);
                } else {
                  onAddTagDirect(tagInputValue);
                }
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                onHideTagInput();
              }
              if (e.key === 'ArrowDown') {
                onTagAutoActiveIndexChange(i => Math.min(i + 1, filteredTagInputSuggestions.length - 1));
                e.preventDefault();
              }
              if (e.key === 'ArrowUp') {
                onTagAutoActiveIndexChange(i => Math.max(i - 1, 0));
                e.preventDefault();
              }
            }}
            onBlur={() => {
              if (tagInputValue.trim()) {
                onAddTagDirect(tagInputValue);
              } else {
                onHideTagInput();
              }
            }}
            placeholder="Tag"
            className="px-2 py-0.5 rounded text-xs input-field w-28"
          />
          {filteredTagInputSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 card py-1 shadow-elevated min-w-[8rem] max-h-40 overflow-y-auto">
              {filteredTagInputSuggestions.map((tag, i) => {
                const color = tagColorMap[tag];
                return (
                  <button
                    key={tag}
                    onMouseDown={(e) => { e.preventDefault(); onAddTagDirect(tag); }}
                    onMouseEnter={() => onTagAutoActiveIndexChange(i)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      i === tagAutoActiveIndex ? 'bg-accent-tint text-accent' : 'text-body hover:bg-accent-tint'
                    }`}
                  >
                    {color && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />}
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
