import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Copy, Share2, Plus, X,
  MessageCircle, Trash2, MoreVertical, AlertCircle, CloudOff, CheckCircle2, Loader2
} from 'lucide-react';
import { JournalEntry, FontStyle, ContentFontSize } from '@/types';
import { getFontClass, getFontSizeClass } from '@utils/fonts';
import { detectRTL } from '@utils/textDirection';
import { ConfirmModal } from './ConfirmModal';
import { isEntryUnsynced, saveUnsyncedEntry, removeUnsyncedEntry } from '@utils/offlineStorage';

interface JournalPageProps {
  entry: JournalEntry;
  font: FontStyle;
  fontSize: ContentFontSize;
  isNew?: boolean;
  allAppTags?: string[];
  onUpdate?: (updates: Partial<JournalEntry>) => void;
  onUpdateById?: (id: string | number, updates: Partial<JournalEntry>) => Promise<void>;
  onCreate?: (title: string, content: string, tags: string[], created_at?: string) => Promise<number | string>;
  onDelete: () => void;
  onChat: () => void;
  onBack: () => void;
}

type SaveStatus = 'saving' | 'saved' | 'error' | 'unsynced' | null;

const SaveIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (!status) return null;
  const styles: Record<string, { icon: React.ReactNode; text: string; cls: string }> = {
    saving: { icon: <Loader2 className="w-3 h-3 animate-spin" />, text: 'Saving...', cls: 'text-muted' },
    saved: { icon: <CheckCircle2 className="w-3 h-3" />, text: 'Saved', cls: 'text-green-500' },
    error: { icon: <AlertCircle className="w-3 h-3" />, text: 'Couldn\'t save', cls: 'text-red-500' },
    unsynced: { icon: <CloudOff className="w-3 h-3" />, text: 'Unsynced (Saved locally)', cls: 'text-amber-500' },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs transition-opacity ${s.cls}`}>
      {s.icon}{s.text}
    </span>
  );
};

function parseHashTags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))];
}

function stripHashTag(text: string, tag: string): string {
  return text.replace(new RegExp(`#${tag}\\b`, 'g'), '').replace(/\s+/g, ' ').trim();
}

function isRealId(v: string | number | null): v is string | number {
  return v !== null && v !== 'pending';
}

function getCursorPixelPos(textarea: HTMLTextAreaElement): { top: number; left: number } | null {
  const mirror = document.createElement('div');
  try {
    const style = window.getComputedStyle(textarea);
    const props = [
      'font', 'fontSize', 'fontFamily', 'lineHeight', 'letterSpacing',
      'padding', 'border', 'boxSizing',
    ] as const;
    const css = [
      ...props.map(p => {
        const k = p.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${k}: ${style[p as unknown as number]}`;
      }),
      `width: ${textarea.clientWidth}px`,
      'white-space: pre-wrap',
      'word-wrap: break-word',
      'overflow-wrap: break-word',
      'position: absolute',
      'top: -9999px',
      'left: 0',
      'visibility: hidden',
    ].join('; ');
    mirror.style.cssText = css;

    const textBefore = textarea.value.slice(0, textarea.selectionStart);
    mirror.appendChild(document.createTextNode(textBefore));

    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);

    document.body.appendChild(mirror);
    const markerRect = marker.getBoundingClientRect();

    return { top: markerRect.top, left: markerRect.left };
  } finally {
    if (mirror.parentNode) mirror.parentNode.removeChild(mirror);
  }
}

export const JournalPage: React.FC<JournalPageProps> = ({
  entry,
  font,
  fontSize,
  isNew = false,
  allAppTags = [],
  onUpdate,
  onUpdateById,
  onCreate,
  onDelete,
  onChat,
  onBack,
}) => {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [explicitTags, setExplicitTags] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => {
    return isEntryUnsynced(entry.id) ? 'unsynced' : null;
  });
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  const [entryDate, setEntryDate] = useState(() => {
    if (entry.created_at) {
      const d = new Date(entry.created_at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day}T${hours}:${mins}`;
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = now.getDate();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}T${hours}:${mins}`;
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = useMemo(() => {
    const d = new Date(entryDate);
    return d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }, [entryDate]);

  const [showAuto, setShowAuto] = useState(false);
  const [autoQuery, setAutoQuery] = useState('');
  const [autoPos, setAutoPos] = useState({ top: 0, left: 0 });
  const autoTriggerPosRef = useRef(0);
  const [autoActiveIndex, setAutoActiveIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryIdRef = useRef<string | number | null>(null);
  const creationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSaveStatus = useCallback(() => {
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus(null), 1000);
  }, []);

  useEffect(() => {
    const fromContent = parseHashTags(entry.content || '');
    const orphaned = (entry.tags || []).filter(t => !fromContent.includes(t));
    setExplicitTags(orphaned);
  }, [entry.id]);

  const parsedTags = useMemo(() => parseHashTags(content), [content]);

  const allTags = useMemo(() => {
    return [...new Set([...explicitTags, ...parsedTags])];
  }, [explicitTags, parsedTags]);

  const filteredAutoTags = useMemo(() => {
    if (!showAuto) return [];
    return allAppTags.filter(t =>
      t.toLowerCase().includes(autoQuery.toLowerCase())
    );
  }, [showAuto, autoQuery, allAppTags]);

  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => { autoResizeTextarea(); }, [content, autoResizeTextarea]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  useEffect(() => {
    if (saveStatus === 'unsynced' && !isEntryUnsynced(entry.id)) {
      setSaveStatus('saved');
      clearSaveStatus();
    }
  }, [entry.id, saveStatus, clearSaveStatus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    if (!showAuto) return;
    const handleClick = (e: MouseEvent) => {
      if (autoRef.current && !autoRef.current.contains(e.target as Node) &&
          textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowAuto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAuto]);

  const checkAutocomplete = useCallback((el: HTMLTextAreaElement) => {
    const pos = el.selectionStart;
    const textBefore = el.value.slice(0, pos);
    const match = textBefore.match(/(?:^|\s)(#(\w*))$/);

    if (match) {
      setAutoQuery(match[2]);
      setShowAuto(true);
      autoTriggerPosRef.current = pos - match[1].length;
      const cursorPos = getCursorPixelPos(el);
      if (cursorPos) setAutoPos(cursorPos);
    } else {
      setShowAuto(false);
    }
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onInput = () => checkAutocomplete(el);
    el.addEventListener('input', onInput);
    return () => el.removeEventListener('input', onInput);
  }, [checkAutocomplete]);



  const save = useCallback(async () => {
    const isoDate = entryDate ? new Date(entryDate).toISOString() : undefined;

    if (isNew && !isRealId(entryIdRef.current) && (title.trim() || content.trim() || allTags.length > 0)) {
      entryIdRef.current = 'pending';
      setSaveStatus('saving');
      try {
        const id = await onCreate!(title, content, allTags, isoDate);
        entryIdRef.current = id;
      } catch {
        entryIdRef.current = null;
        setSaveStatus('error');
      }
      return;
    }

    if (isNew && isRealId(entryIdRef.current)) {
      setSaveStatus('saving');
      try {
        await onUpdateById!(entryIdRef.current, { title: title.trim(), content: content.trim(), tags: allTags, created_at: isoDate });
        setSaveStatus('saved');
        clearSaveStatus();
        removeUnsyncedEntry(entryIdRef.current);
      } catch {
        const updatedEntry: JournalEntry = {
          id: entryIdRef.current,
          title: title.trim(),
          content: content.trim(),
          tags: allTags,
          created_at: isoDate,
          date: entryDate || new Date().toLocaleString(),
        };
        saveUnsyncedEntry(updatedEntry);
        setSaveStatus('unsynced');
      }
      return;
    }

    if (isNew) return;

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const dateChanged = isoDate
      ? !entry.created_at || Math.abs(new Date(isoDate).getTime() - new Date(entry.created_at).getTime()) > 1000
      : false;
    if (
      trimmedTitle !== entry.title ||
      trimmedContent !== entry.content ||
      JSON.stringify(allTags) !== JSON.stringify(entry.tags) ||
      dateChanged
    ) {
      setSaveStatus('saving');
      try {
        await onUpdate!({ title: trimmedTitle, content: trimmedContent, tags: allTags, created_at: isoDate });
        setSaveStatus('saved');
        clearSaveStatus();
        removeUnsyncedEntry(entry.id);
      } catch (error) {
        const updatedEntry: JournalEntry = {
          ...entry,
          title: trimmedTitle,
          content: trimmedContent,
          tags: allTags,
          created_at: isoDate || entry.created_at,
          date: entryDate || entry.date,
        };
        saveUnsyncedEntry(updatedEntry);
        setSaveStatus('unsynced');
      }
    }
  }, [isNew, title, content, allTags, entryDate, entry, onCreate, onUpdate, onUpdateById, clearSaveStatus]);

  // Synchronously persist the current editor state to localStorage. Unlike save()
  // (which is async and awaits the network), this completes during beforeunload
  // so edits are never lost when the tab closes mid-autosave. The background
  // sync in App.tsx flushes the local record to the backend later.
  const persistLocally = useCallback(() => {
    const id = isNew ? entryIdRef.current : entry.id;
    if (!isRealId(id)) return;

    const isoDate = entryDate ? new Date(entryDate).toISOString() : undefined;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const dateChanged = !isNew && isoDate
      ? !entry.created_at || Math.abs(new Date(isoDate).getTime() - new Date(entry.created_at).getTime()) > 1000
      : false;
    const hasChanges = isNew
      ? trimmedTitle !== '' || trimmedContent !== '' || allTags.length > 0
      : trimmedTitle !== entry.title ||
        trimmedContent !== entry.content ||
        JSON.stringify(allTags) !== JSON.stringify(entry.tags) ||
        dateChanged;
    if (!hasChanges) return;

    saveUnsyncedEntry({
      ...(isNew ? {} : entry),
      id,
      title: trimmedTitle,
      content: trimmedContent,
      tags: allTags,
      created_at: isoDate || entry.created_at,
      date: entryDate || entry.date,
    });
  }, [isNew, title, content, allTags, entryDate, entry]);

  useEffect(() => {
    if (isNew) return;
    const timer = setTimeout(() => save(), 1500);
    return () => clearTimeout(timer);
  }, [title, content, allTags, isNew, save]);

  useEffect(() => {
    if (!isNew || entryIdRef.current !== null) return;
    if (title.trim() || content.trim() || allTags.length > 0) {
      if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
      creationTimerRef.current = setTimeout(() => save(), 600);
    }
    return () => {
      if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
    };
  }, [title, content, allTags, isNew, save]);

  useEffect(() => {
    const handleBeforeUnload = () => { persistLocally(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persistLocally]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
    };
  }, []);

  const handleBack = useCallback(async () => {
    await save();
    onBack();
  }, [save, onBack]);

  const removeTag = (tag: string) => {
    setExplicitTags(prev => prev.filter(t => t !== tag));
    setContent(prev => stripHashTag(prev, tag));
  };

  const addTagDirect = (name: string) => {
    const t = name.trim();
    if (t && !allTags.includes(t)) {
      setExplicitTags(prev => [...prev, t]);
    }
    setShowTagInput(false);
    setTagInputValue('');
  };

  const selectAutoTag = (tag: string) => {
    const pos = textareaRef.current?.selectionStart ?? content.length;
    const from = autoTriggerPosRef.current;
    const needSpace = pos < content.length && content.charAt(pos) !== ' ';
    const suffix = needSpace ? ' ' : '';
    const newContent = content.slice(0, from) + `#${tag}${suffix}` + content.slice(pos);
    setContent(newContent);
    setShowAuto(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const newPos = from + tag.length + 1 + suffix.length;
        el.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAuto) {
      if (e.key === 'Escape') {
        setShowAuto(false);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (filteredAutoTags.length > 0) {
          selectAutoTag(filteredAutoTags[autoActiveIndex]);
        } else if (autoQuery) {
          selectAutoTag(autoQuery);
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setAutoActiveIndex(i => Math.min(i + 1, filteredAutoTags.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setAutoActiveIndex(i => Math.max(i - 1, 0));
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    setAutoActiveIndex(0);
  }, [showAuto, autoQuery]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${entry.title}\n\n${entry.content}`);
    } catch {}
    setShowMenu(false);
  };

  const shareEntry = async () => {
    const text = `${entry.title}\n\n${entry.content}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.title, text });
      } else {
        await copyToClipboard();
      }
    } catch {}
    setShowMenu(false);
  };

  const handleDeleteClick = () => { setShowDeleteConfirm(true); setShowMenu(false); };
  const handleConfirmDelete = () => { onDelete(); setShowDeleteConfirm(false); };

  return (
    <div className="w-full max-w-2xl mx-auto relative flex flex-col flex-1">
      <div
        className="sticky top-0 z-20 pt-4 pb-2 px-6 md:px-8"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="flex items-start justify-between h-8">
          <button
            onClick={handleBack}
            className="p-1 rounded-md text-muted/50 hover:text-muted transition-colors"
            aria-label="Back to journal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {!isNew && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md text-muted/50 hover:text-muted transition-colors"
                aria-label="Entry options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 min-w-[12rem] rounded-lg shadow-card-lg z-20 card py-1">
                  <button onClick={() => { copyToClipboard(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all">
                    <Copy className="w-4 h-4" />Copy
                  </button>
                  <button onClick={() => { shareEntry(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all">
                    <Share2 className="w-4 h-4" />Share
                  </button>
                  <button onClick={() => { onChat(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-body hover:bg-accent-tint transition-all">
                    <MessageCircle className="w-4 h-4" />Chat
                  </button>
                  <div className="h-px bg-border-default my-2" />
                  <button onClick={handleDeleteClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-6 md:px-8"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <button
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="text-xs text-muted/50 hover:text-muted transition-colors text-left"
          aria-label={`Edit date: ${formattedDate}`}
        >
          {formattedDate}
        </button>
        <input
          ref={dateInputRef}
          type="datetime-local"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dateInputRef.current?.showPicker?.();
            }
          }}
          className="sr-only"
          tabIndex={0}
        />
        <SaveIndicator status={saveStatus} />
      </div>

      <div
        className="flex flex-col flex-1 px-6 md:px-8 pt-4 pb-12"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => save()}
          placeholder="Title..."
          className={`w-full text-3xl md:text-4xl ${getFontClass(font)} font-bold text-body bg-transparent border-none focus:outline-none p-0 mb-4`}
          style={{ direction: detectRTL(title) ? 'rtl' : 'ltr' }}
          autoFocus={isNew}
        />

        <div className="flex flex-wrap items-center gap-1.5 mb-6 min-h-[1.5rem]">
          {allTags.map((tag) => (
            <span key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-accent-tint/50 text-accent-tint group"
            >
              #{tag}
              <button onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 hover:text-red-500 transition-all">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {!showTagInput && (
            <button onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs text-muted/30 hover:text-muted hover:bg-accent-tint/30 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          )}
          {showTagInput && (
            <input
              ref={tagInputRef}
              type="text"
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { addTagDirect(tagInputValue); e.preventDefault(); }
                if (e.key === 'Escape') { setShowTagInput(false); setTagInputValue(''); }
              }}
              onBlur={() => addTagDirect(tagInputValue)}
              placeholder="Tag"
              className="px-2 py-0.5 rounded text-xs input-field w-20"
            />
          )}
        </div>

        <div className="relative flex-1 flex">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoResizeTextarea();
            }}
            onKeyDown={handleTextareaKeyDown}
            onBlur={() => save()}
            placeholder={isNew ? 'Begin writing your story...' : 'Begin writing...'}
            className={`w-full flex-1 ${getFontClass(font)} ${getFontSizeClass(fontSize)} leading-relaxed resize-none focus:outline-none text-body placeholder:text-muted/40`}
            style={{
              background: 'transparent',
              minHeight: '8rem',
              overflow: 'hidden',
              unicodeBidi: 'plaintext',
            } as React.CSSProperties}
          />

          {showAuto && (
            <div
              ref={autoRef}
              className="fixed z-50 card py-1 shadow-elevated min-w-[10rem] max-h-48 overflow-y-auto"
              style={{
                top: Math.min(autoPos.top, window.innerHeight - 250) + 'px',
                left: Math.min(autoPos.left, window.innerWidth - 200) + 'px',
              }}
            >
              {filteredAutoTags.length > 0 ? (
                filteredAutoTags.map((tag, i) => (
                  <button key={tag}
                    onMouseDown={(e) => { e.preventDefault(); selectAutoTag(tag); }}
                    onMouseEnter={() => setAutoActiveIndex(i)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      i === autoActiveIndex ? 'bg-accent-tint text-accent' : 'text-body hover:bg-accent-tint'
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              ) : autoQuery ? (
                <button
                  onMouseDown={(e) => { e.preventDefault(); selectAutoTag(autoQuery); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-muted hover:bg-accent-tint transition-colors"
                >
                  Create "#{autoQuery}"
                </button>
              ) : (
                <div className="px-3 py-2 text-xs text-muted">No tags yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
