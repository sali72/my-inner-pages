import React, { useState } from 'react';
import { Save, X, Tag } from 'lucide-react';
import { ThemeType, FontType, FontSizeType } from '@/types';
import { THEMES } from '@constants/themes';
import { getFontClass, getFontSizeClass } from '@utils/fonts';
import { detectRTL } from '@utils/textDirection';

interface NewEntryPageProps {
  theme: ThemeType;
  font: FontType;
  fontSize: FontSizeType;
  dragOffset: number;
  isFlipping: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onSave: (title: string, content: string, tags: string[]) => void;
}

export const NewEntryPage: React.FC<NewEntryPageProps> = ({
  theme,
  font,
  fontSize,
  dragOffset,
  isFlipping,
  onDragStart,
  onDragMove,
  onDragEnd,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  const handleSave = () => {
    if (content.trim()) {
      onSave(title || 'Untitled', content, tags);
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setIsWriting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setIsWriting(false);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      e.preventDefault();
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const hasContent = title.trim() || content.trim() || tags.length > 0;

  return (
    <div
      className={`${themeConfig.paper} rounded-xl shadow-2xl border ${themeConfig.border} overflow-hidden ${
        !hasContent ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        minHeight: '600px',
        backgroundImage: isDark
          ? 'none'
          : 'linear-gradient(to bottom, rgba(255,250,240,0.9), rgba(254,243,199,0.5))',
        touchAction: 'none',
        transform: `translateX(${
          isFlipping ? (dragOffset > 0 ? '100%' : '-100%') : dragOffset * 0.5
        }px) rotateY(${
          isFlipping ? (dragOffset > 0 ? '180deg' : '-180deg') : dragOffset * 0.15
        }deg)`,
        transition: isFlipping ? 'transform 0.6s ease' : 'none',
        opacity: isFlipping ? 0 : Math.max(0.3, 1 - Math.abs(dragOffset) * 0.002),
        transformOrigin: dragOffset > 0 ? 'left center' : 'right center',
      }}
      onMouseDown={!hasContent ? onDragStart : undefined}
      onMouseMove={!hasContent ? onDragMove : undefined}
      onMouseUp={!hasContent ? onDragEnd : undefined}
      onMouseLeave={!hasContent ? onDragEnd : undefined}
      onTouchStart={!hasContent ? onDragStart : undefined}
      onTouchMove={!hasContent ? onDragMove : undefined}
      onTouchEnd={!hasContent ? onDragEnd : undefined}
    >
      <div className="p-8 md:p-12 overflow-y-auto" style={{ minHeight: '600px' }}>
        <div className="mb-6 flex justify-between items-start">
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>
              Today
            </p>
            <h2
              className={`text-2xl ${getFontClass(font)} font-bold ${
                themeConfig.accent
              } mt-2`}
            >
              New Entry
            </h2>
          </div>
          {isWriting && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleSave}
                className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-amber-100'}`}
                title="Save Entry"
              >
                <Save className={`w-5 h-5 ${themeConfig.accent}`} />
              </button>
              <button
                onClick={handleCancel}
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'
                }`}
                title="Cancel"
              >
                <X className={`w-5 h-5 ${themeConfig.accent}`} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsWriting(true);
            }}
            placeholder="Title..."
            className={`w-full text-xl ${getFontClass(font)} font-bold ${
              themeConfig.accent
            } bg-transparent border-b ${themeConfig.border} focus:outline-none pb-2`}
            style={{ direction: detectRTL(title) ? 'rtl' : 'ltr' }}
          />

          <div className={`flex flex-wrap gap-2 pb-2 border-b ${themeConfig.border}`}>
            <Tag
              className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-amber-500'} mt-1`}
            />
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tag}
                <button onClick={() => handleRemoveTag(i)} className="hover:text-red-500">
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setIsWriting(true);
              }}
              placeholder="Add tags (press Enter)..."
              className={`flex-1 text-sm bg-transparent focus:outline-none ${
                isDark ? 'text-slate-300 placeholder-slate-500' : 'text-amber-800 placeholder-amber-600/50'
              }`}
              onKeyDown={handleAddTag}
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsWriting(true);
            }}
            placeholder="Begin writing your story..."
            className={`w-full ${getFontClass(font)} ${getFontSizeClass(
              fontSize
            )} leading-relaxed resize-none focus:outline-none ${
              isDark ? 'text-slate-300 placeholder-slate-500' : 'text-slate-800 placeholder-amber-400/50'
            }`}
            style={{
              background: 'transparent',
              minHeight: '250px',
              unicodeBidi: 'plaintext',
            } as React.CSSProperties}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
