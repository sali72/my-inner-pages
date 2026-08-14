import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Collaboration } from '@tiptap/extension-collaboration';
import { Placeholder } from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

import { sanitizeTag, parseHashTags, replaceHashtagInTiptapAst } from '@utils/tagUtils';
import { JournalEntry, FontStyle, ContentFontSize } from '@/types';
import { getFontClass, getFontSizeClass } from '@utils/fonts';
import { detectRTL } from '@utils/textDirection';
import { ConfirmModal } from './ConfirmModal';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { useJournalDoc } from '@hooks/useJournalDoc';
import { useJournalAutosave } from '@hooks/useJournalAutosave';
import { JournalHeader } from './JournalHeader';
import { JournalMetaBar } from './JournalMetaBar';
import { JournalTagBar } from './JournalTagBar';
import { JournalAutoTagDropdown } from './JournalAutoTagDropdown';

interface JournalPageProps {
  entry: JournalEntry;
  font: FontStyle;
  fontSize: ContentFontSize;
  isNew?: boolean;
  allAppTags?: string[];
  tagColorMap?: Record<string, string | null>;
  onUpdate?: (updates: Partial<JournalEntry>) => void;
  onUpdateById?: (id: string | number, updates: Partial<JournalEntry>) => Promise<void>;
  onCreate?: (title: string, content: string, tags: string[], created_at?: string, content_json?: any) => Promise<number | string>;
  onDelete: () => void;
  onChat: () => void;
  onBack: () => void;
  onSelectTagFilter?: (tag: string) => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  entry,
  font,
  fontSize,
  isNew = false,
  allAppTags = [],
  tagColorMap = {},
  onUpdate,
  onUpdateById,
  onCreate,
  onDelete,
  onChat,
  onBack,
  onSelectTagFilter,
}) => {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [explicitTags, setExplicitTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagAutoActiveIndex, setTagAutoActiveIndex] = useState(0);

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

  const formattedDate = useMemo(() => {
    const d = new Date(entryDate);
    return d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }, [entryDate]);

  const [showAuto, setShowAuto] = useState(false);
  const [autoQuery, setAutoQuery] = useState('');
  const [autoPos, setAutoPos] = useState({ top: 0, left: 0 });
  const autoTriggerPosRef = useRef(0);
  const [autoActiveIndex, setAutoActiveIndex] = useState(0);
  const isNavigatingBackRef = useRef(false);

  const docEntryId = useMemo(() => entry.id, [entry.id]);
  const { ydoc, isLoaded } = useJournalDoc(docEntryId, entry.title);

  const checkAutocomplete = useCallback((ed: any) => {
    const { from } = ed.state.selection;
    const $from = ed.state.selection.$from;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset);
    const match = textBefore.match(/(?:^|\s)(#([\p{L}\p{N}_-]*))$/u);

    if (match) {
      setAutoQuery(match[2]);
      setShowAuto(true);
      autoTriggerPosRef.current = from - match[1].length;
      
      const coords = ed.view.coordsAtPos(from);
      setAutoPos({
        top: coords.bottom + 4,
        left: coords.left,
      });
    } else {
      setShowAuto(false);
    }
  }, []);

  const [contentJson, setContentJson] = useState<any>(entry.content_json);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'text-accent underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Collaboration.configure({
      document: ydoc,
      field: 'content',
    }),
    Placeholder.configure({
      placeholder: isNew ? 'Begin writing your story...' : 'Begin writing...',
    }),
  ], [ydoc, isNew]);

  const checkAutocompleteRef = useRef(checkAutocomplete);
  useEffect(() => {
    checkAutocompleteRef.current = checkAutocomplete;
  }, [checkAutocomplete]);

  const handleEditorUpdate = useCallback(({ editor: ed }: { editor: any }) => {
    const json = ed.getJSON();
    setContentJson(json);
    setContent(ed.getText());
    checkAutocompleteRef.current(ed);
  }, []);

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[8rem] leading-relaxed text-body placeholder:text-muted/40 prose dark:prose-invert max-w-none',
        style: 'unicode-bidi: plaintext;',
      },
    },
    onUpdate: handleEditorUpdate,
    onSelectionUpdate: ({ editor: ed }) => {
      checkAutocomplete(ed);
    },
  }, [ydoc]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && isLoaded) {
      const contentFragment = ydoc.getXmlFragment('content');
      if (contentFragment.length === 0) {
        if (entry.content_json) {
          editor.commands.setContent(entry.content_json);
        } else if (entry.content) {
          editor.commands.setContent(entry.content);
        }
      }
    }
  }, [editor, isLoaded, entry.content_json, entry.content, ydoc]);

  useEffect(() => {
    if (isLoaded) {
      const localTitle = ydoc.getText('title').toString();
      if (localTitle) {
        setTitle(localTitle);
      }
    }
  }, [isLoaded, ydoc]);

  const entryTagsKey = (entry.tags || []).join(',');
  useEffect(() => {
    const fromContent = parseHashTags(entry.content || '');
    const orphaned = (entry.tags || []).filter(t => !fromContent.includes(t));
    setExplicitTags(prev => {
      if (prev.length === orphaned.length && prev.every((t, i) => t === orphaned[i])) {
        return prev;
      }
      return orphaned;
    });
  }, [entry.id, entryTagsKey, entry.content, entry.tags]);

  useEffect(() => {
    const handleTagUpdated = (e: Event) => {
      const { action, oldName, newName } = (e as CustomEvent).detail;
      if (!oldName) return;

      if (action === 'delete') {
        setExplicitTags(prev => prev.filter(t => t.toLowerCase() !== oldName.toLowerCase()));
        if (editor) {
          const currentJson = editor.getJSON();
          const updatedJson = replaceHashtagInTiptapAst(currentJson, oldName, null);
          editor.commands.setContent(updatedJson);
        }
      } else if (action === 'rename' && newName) {
        setExplicitTags(prev => prev.map(t => t.toLowerCase() === oldName.toLowerCase() ? newName.toLowerCase() : t));
        if (editor) {
          const currentJson = editor.getJSON();
          const updatedJson = replaceHashtagInTiptapAst(currentJson, oldName, newName);
          editor.commands.setContent(updatedJson);
        }
      }
    };
    window.addEventListener('journal:tag-updated', handleTagUpdated);
    return () => window.removeEventListener('journal:tag-updated', handleTagUpdated);
  }, [editor]);

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

  const filteredTagInputSuggestions = useMemo(() => {
    if (!showTagInput || !tagInputValue) return [];
    const q = tagInputValue.toLowerCase();
    return allAppTags.filter(t =>
      t.toLowerCase().includes(q) && !allTags.includes(t)
    );
  }, [showTagInput, tagInputValue, allAppTags, allTags]);

  const { saveStatus, save, handleRetry } = useJournalAutosave({
    entry,
    isNew,
    title,
    content,
    contentJson,
    editor,
    allTags,
    entryDate,
    onCreate,
    onUpdate,
    onUpdateById,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (isLoaded) {
      ydoc.transact(() => {
        const titleText = ydoc.getText('title');
        titleText.delete(0, titleText.length);
        titleText.insert(0, val);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (docEntryId === 'new') {
        const dbName = `my-inner-pages-journal-new`;
        indexedDB.deleteDatabase(dbName);
      }
    };
  }, [docEntryId]);

  const handleBack = useCallback(async () => {
    if (isNavigatingBackRef.current) return;
    isNavigatingBackRef.current = true;
    
    let finalTags = allTags;
    if (showTagInput && tagInputValue.trim()) {
      const t = sanitizeTag(tagInputValue);
      if (t && !explicitTags.includes(t)) {
        const updatedExplicit = [...explicitTags, t];
        setExplicitTags(updatedExplicit);
        finalTags = [...new Set([...updatedExplicit, ...parsedTags])];
      }
      setShowTagInput(false);
      setTagInputValue('');
    }

    try {
      await save(finalTags);
    } catch (err) {
      console.error("Save on back navigation failed:", err);
    } finally {
      onBack();
    }
  }, [showTagInput, tagInputValue, explicitTags, parsedTags, allTags, save, onBack]);

  const removeTag = (tag: string) => {
    setExplicitTags(prev => prev.filter(t => t !== tag));
    if (editor) {
      const currentJson = editor.getJSON();
      const updatedJson = replaceHashtagInTiptapAst(currentJson, tag, null);
      editor.commands.setContent(updatedJson);
    }
  };

  const addTagDirect = (name: string) => {
    const t = sanitizeTag(name);
    if (t && !allTags.includes(t)) {
      setExplicitTags(prev => [...prev, t]);
    }
    setShowTagInput(false);
    setTagInputValue('');
  };

  const selectAutoTag = useCallback((tag: string) => {
    if (!editor) return;
    const from = autoTriggerPosRef.current;
    const to = editor.state.selection.from;
    
    editor.chain()
      .focus()
      .insertContentAt({ from, to }, `#${tag} `)
      .run();
      
    setShowAuto(false);
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.view) return;
    const el = editor.view.dom;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAuto) return;
      if (e.key === 'Escape') {
        setShowAuto(false);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Enter') {
        if (filteredAutoTags.length > 0) {
          selectAutoTag(filteredAutoTags[autoActiveIndex]);
        } else if (autoQuery) {
          selectAutoTag(autoQuery);
        }
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowDown') {
        setAutoActiveIndex(i => Math.min(i + 1, filteredAutoTags.length - 1));
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowUp') {
        setAutoActiveIndex(i => Math.max(i - 1, 0));
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('keydown', handleKeyDown, true);
    return () => el.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, showAuto, filteredAutoTags, autoActiveIndex, autoQuery, selectAutoTag]);

  useEffect(() => {
    setAutoActiveIndex(0);
  }, [showAuto, autoQuery]);

  const copyToClipboard = async () => {
    const plainText = `${title.trim()}\n\n${editor ? editor.getText() : content}`;
    const htmlText = `<h1>${title.trim()}</h1>${editor ? editor.getHTML() : `<p>${content}</p>`}`;

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(plainText);
      } catch {}
    }
  };

  const shareEntry = async () => {
    const text = `${entry.title}\n\n${content}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.title, text });
      } else {
        await copyToClipboard();
      }
    } catch {}
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  if (!isLoaded) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative flex flex-col flex-1">
      <JournalHeader
        isNew={isNew}
        onBack={handleBack}
        onCopy={copyToClipboard}
        onShare={shareEntry}
        onChat={onChat}
        onDeleteClick={() => setShowDeleteConfirm(true)}
      />

      <JournalMetaBar
        entryDate={entryDate}
        formattedDate={formattedDate}
        saveStatus={saveStatus}
        onEntryDateChange={setEntryDate}
        onRetrySave={handleRetry}
      />

      <div
        className="flex flex-col flex-1 px-6 md:px-8 pt-4 pb-12"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={() => save()}
          placeholder="Title..."
          className={`w-full text-3xl md:text-4xl ${getFontClass(font)} font-bold text-body bg-transparent border-none focus:outline-none p-0 mb-4`}
          style={{ direction: detectRTL(title) ? 'rtl' : 'ltr' }}
          autoFocus={isNew}
        />

        <JournalTagBar
          allTags={allTags}
          tagColorMap={tagColorMap}
          showTagInput={showTagInput}
          tagInputValue={tagInputValue}
          filteredTagInputSuggestions={filteredTagInputSuggestions}
          tagAutoActiveIndex={tagAutoActiveIndex}
          onSelectTagFilter={onSelectTagFilter}
          onRemoveTag={removeTag}
          onShowTagInput={() => setShowTagInput(true)}
          onHideTagInput={() => { setShowTagInput(false); setTagInputValue(''); }}
          onTagInputValueChange={setTagInputValue}
          onTagAutoActiveIndexChange={setTagAutoActiveIndex}
          onAddTagDirect={addTagDirect}
        />

        <div className={`relative flex-1 flex flex-col w-full ${getFontClass(font)} ${getFontSizeClass(fontSize)}`}>
          <EditorBubbleMenu editor={editor} />
          <EditorContent editor={editor} className="w-full flex-1 min-h-[12rem] text-left" />

          <JournalAutoTagDropdown
            showAuto={showAuto}
            autoPos={autoPos}
            filteredAutoTags={filteredAutoTags}
            autoActiveIndex={autoActiveIndex}
            autoQuery={autoQuery}
            editor={editor}
            onSelectAutoTag={selectAutoTag}
            onAutoActiveIndexChange={setAutoActiveIndex}
            onCloseAuto={() => setShowAuto(false)}
          />
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
