import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  editable?: boolean;
  onTagsChange?: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  editable = false,
  onTagsChange,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && onTagsChange) {
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
      setShowInput(false);
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (onTagsChange) {
      onTagsChange(tags.filter(t => t !== tag));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() && onTagsChange) {
      onTagsChange([...tags, inputValue.trim()]);
    }
    setInputValue('');
    setShowInput(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-accent-tint/50 text-accent-tint"
        >
          {tag}
          {editable && (
            <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}

      {editable && !showInput && (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted/40 hover:text-muted hover:bg-accent-tint/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Tag
        </button>
      )}

      {editable && showInput && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddTag}
          onBlur={handleBlur}
          placeholder="Tag name..."
          className="px-2.5 py-1 rounded text-xs input-field w-28"
        />
      )}
    </div>
  );
};
