import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { JournalEntry, FontStyle, ContentFontSize } from '@/types';
import { getFontClass, getFontSizeClass } from '@utils/fonts';
import { detectRTL, renderTextWithLineDirection } from '@utils/textDirection';
import { EntryMenu } from './EntryMenu';
import { TagInput } from './TagInput';

interface JournalPageProps {
  entry: JournalEntry;
  font: FontStyle;
  fontSize: ContentFontSize;
  dragOffset: number;
  isFlipping: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onUpdate: (updates: Partial<JournalEntry>) => void;
  onDelete: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  entry,
  font,
  fontSize,
  dragOffset,
  isFlipping,
  onDragStart,
  onDragMove,
  onDragEnd,
  onUpdate,
  onDelete,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const startEditing = () => {
    setEditingContent(entry.content);
    setEditingTitle(entry.title);
    setEditingTags(entry.tags || []);
    setEditMode(true);
    setShowMenu(false);
  };

  const saveEdit = () => {
    onUpdate({
      content: editingContent,
      title: editingTitle,
      tags: editingTags,
    });
    setEditMode(false);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const copyToClipboard = () => {
    const text = `${entry.title}\n\n${entry.content}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
      setShowMenu(false);
    });
  };

  const shareEntry = () => {
    const text = `${entry.title}\n\n${entry.content}`;
    if (navigator.share) {
      navigator.share({ title: entry.title, text: text });
    } else {
      copyToClipboard();
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this entry?')) {
      onDelete();
      setShowMenu(false);
    }
  };

  return (
    <div
      className={`card overflow-hidden ${!editMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        minHeight: '600px',
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
      onMouseDown={!editMode ? onDragStart : undefined}
      onMouseMove={!editMode ? onDragMove : undefined}
      onMouseUp={!editMode ? onDragEnd : undefined}
      onMouseLeave={!editMode ? onDragEnd : undefined}
      onTouchStart={!editMode ? onDragStart : undefined}
      onTouchMove={!editMode ? onDragMove : undefined}
      onTouchEnd={!editMode ? onDragEnd : undefined}
    >
      <div className="p-8 md:p-12 overflow-y-auto" style={{ minHeight: '600px' }}>
        <div className="mb-6 flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted">
              {entry.date}
            </p>
            {editMode ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className={`text-2xl ${getFontClass(font)} font-bold text-body mt-2 w-full bg-transparent border-b border-default focus:outline-none`}
                style={{ direction: detectRTL(editingTitle) ? 'rtl' : 'ltr' }}
              />
            ) : (
              <h2
                className={`text-2xl ${getFontClass(font)} font-bold text-body mt-2`}
                style={{ direction: detectRTL(entry.title) ? 'rtl' : 'ltr' }}
              >
                {entry.title || 'Untitled'}
              </h2>
            )}
            <div className="mt-3">
              <TagInput
                tags={editMode ? editingTags : entry.tags}
                editable={editMode}
                onTagsChange={editMode ? setEditingTags : undefined}
              />
            </div>
          </div>
          {!editMode && (
            <EntryMenu
              isOpen={showMenu}
              onToggle={() => setShowMenu(!showMenu)}
              onEdit={startEditing}
              onCopy={copyToClipboard}
              onShare={shareEntry}
              onDelete={handleDelete}
            />
          )}
          {editMode && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={saveEdit}
                className="btn-primary p-2 rounded-lg"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={cancelEdit}
                className={`p-2 rounded-lg hover:bg-accent-tint`}
              >
                <X className="w-5 h-5 text-body" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 mb-4" style={{ minHeight: '400px' }}>
          {editMode ? (
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className={`w-full h-full ${getFontClass(font)} ${getFontSizeClass(fontSize)} leading-relaxed resize-none focus:outline-none text-body`}
              style={{
                background: 'transparent',
                minHeight: '400px',
                unicodeBidi: 'plaintext',
              } as React.CSSProperties}
            />
          ) : (
            <div
              className={`${getFontClass(font)} ${getFontSizeClass(fontSize)} leading-relaxed whitespace-pre-line text-body`}
            >
              {renderTextWithLineDirection(entry.content)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
