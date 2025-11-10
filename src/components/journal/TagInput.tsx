import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface TagInputProps {
  tags: string[];
  theme: ThemeType;
  editable?: boolean;
  onTagsChange?: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  theme,
  editable = false,
  onTagsChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && onTagsChange) {
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
      e.preventDefault();
    }
  };

  const handleRemoveTag = (index: number) => {
    if (onTagsChange) {
      onTagsChange(tags.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {!editable && tags.length > 0 && <Tag className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-amber-500'} mt-1`} />}
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
            isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {!editable && <Tag className="w-3 h-3" />}
          {tag}
          {editable && (
            <button onClick={() => handleRemoveTag(i)} className="hover:text-red-500">
              ×
            </button>
          )}
        </span>
      ))}
      {editable && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag..."
          className={`px-3 py-1 rounded-full text-xs ${
            isDark ? 'bg-slate-700 text-slate-300 placeholder-slate-500' : 'bg-amber-50 text-amber-800 placeholder-amber-600/50'
          } border ${themeConfig.border} focus:outline-none`}
        />
      )}
    </div>
  );
};
