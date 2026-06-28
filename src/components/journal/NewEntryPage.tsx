import React, { useState } from 'react';
import { Save, X, Tag } from 'lucide-react';
import { FontStyle, ContentFontSize } from '@/types';
import { getFontClass, getFontSizeClass } from '@utils/fonts';
import { detectRTL } from '@utils/textDirection';
import { getClickDirection } from '@utils/clickNavigation';

interface NewEntryPageProps {
  font: FontStyle;
  fontSize: ContentFontSize;
  dragOffset: number;
  isFlipping: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onSave: (title: string, content: string, tags: string[]) => void;
  onPageClick?: (direction: 'prev' | 'next') => void;
}

export const NewEntryPage: React.FC<NewEntryPageProps> = ({
  font,
  fontSize,
  dragOffset,
  isFlipping,
  onDragStart,
  onDragMove,
  onDragEnd,
  onSave,
  onPageClick,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isWriting, setIsWriting] = useState(false);

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

  const hasContent = title.trim() || content.trim() || tags.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasContent) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, [role="button"]')) return;
    const direction = getClickDirection(e);
    if (direction) onPageClick?.(direction);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`card overflow-hidden ${!hasContent ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        minHeight: 'calc(100vh - 12rem)',
        touchAction: 'none',
        transform: `translateX(${
          isFlipping ? (dragOffset > 0 ? '100%' : '-100%') : dragOffset * 0.5
        }px) rotateY(${
          isFlipping ? (dragOffset > 0 ? '180deg' : '-180deg') : dragOffset * 0.15
        }deg)`,
        transition: isFlipping ? 'transform 0.4s ease, opacity 0.4s ease' : 'none',
        opacity: Math.max(0.3, 1 - Math.abs(dragOffset) * 0.002),
        transformOrigin: dragOffset > 0 ? 'left center' : 'right center',
      }}
      onClick={!hasContent ? handleClick : undefined}
      onMouseDown={!hasContent ? onDragStart : undefined}
      onMouseMove={!hasContent ? onDragMove : undefined}
      onMouseUp={!hasContent ? onDragEnd : undefined}
      onMouseLeave={!hasContent ? onDragEnd : undefined}
      onTouchStart={!hasContent ? onDragStart : undefined}
      onTouchMove={!hasContent ? onDragMove : undefined}
      onTouchEnd={!hasContent ? onDragEnd : undefined}
    >
      <div className="p-8 md:p-12 overflow-y-auto" style={{ minHeight: 'calc(100vh - 12rem)' }}>
        <div className="mb-6 flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted">
              Today
            </p>
            <h2 className={`text-2xl ${getFontClass(font)} font-bold text-body mt-2`}>
              New Entry
            </h2>
          </div>
          {isWriting && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-accent-muted"
                title="Save Entry"
              >
                <Save className="w-5 h-5 text-accent" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg hover:bg-accent-tint"
                title="Cancel"
              >
                <X className="w-5 h-5 text-body" />
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
            className={`w-full text-xl ${getFontClass(font)} font-bold text-body bg-transparent border-b border-default focus:outline-none pb-2`}
            style={{ direction: detectRTL(title) ? 'rtl' : 'ltr' }}
          />

          <div className="flex flex-wrap gap-2 pb-2 border-b border-default">
            <Tag className="w-4 h-4 text-muted mt-1" />
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-accent-tint text-accent-tint`}
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
              className={`flex-1 text-sm bg-transparent focus:outline-none text-body placeholder:text-muted`}
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
            className={`w-full ${getFontClass(font)} ${getFontSizeClass(fontSize)} leading-relaxed resize-none focus:outline-none text-body placeholder:text-muted`}
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
