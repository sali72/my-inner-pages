import React, { useEffect, useRef, useState } from 'react';
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Check,
  X,
} from 'lucide-react';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (!editor || !menuRef.current) return;

    const pluginKey = 'editorBubbleMenu';
    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuRef.current,
      shouldShow: ({ editor: ed, state }) => {
        const { selection } = state;
        const { empty } = selection;
        if (empty) return false;
        if (ed.isActive('codeBlock')) return false;
        return true;
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(pluginKey);
    };
  }, [editor]);

  // Auto-focus the URL text input when link input opens
  useEffect(() => {
    if (isEditingLink && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingLink]);

  if (!editor) return null;

  const handleOpenLinkInput = () => {
    const existingUrl = editor.getAttributes('link').href || '';
    setLinkUrl(existingUrl);
    setIsEditingLink(true);
  };

  const handleApplyLink = () => {
    const trimmed = linkUrl.trim();
    if (trimmed) {
      const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().setLink({ href: formatted }).focus().run();
    } else {
      editor.chain().unsetLink().focus().run();
    }
    setIsEditingLink(false);
  };

  const handleCancelLink = () => {
    setIsEditingLink(false);
    editor.chain().focus().run();
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-0 left-0 flex items-center gap-0.5 rounded-xl border border-border/50 bg-surface/95 dark:bg-zinc-800/95 p-1 shadow-lg backdrop-blur-md transition-all z-50 pointer-events-auto"
      style={{ visibility: 'hidden' }}
    >
      {isEditingLink ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyLink();
          }}
          className="flex items-center gap-1.5 px-1 py-0.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelLink();
              }
            }}
            placeholder="Paste URL (e.g. https://...)"
            className="w-48 px-2 py-1 text-xs rounded-lg bg-base border border-border/60 text-body focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-400/20"
            title="Apply Link"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancelLink}
            className="p-1 rounded-md text-secondary hover:bg-muted/50"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : (
        <>
          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleBold().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('bold')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleItalic().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('italic')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleStrike().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('strike')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Strikethrough (Ctrl+Shift+X)"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          {/* Code */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleCode().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('code')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>

          {/* Link / Unlink */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (editor.isActive('link')) {
                editor.chain().unsetLink().focus().run();
              } else {
                handleOpenLinkInput();
              }
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('link')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
          >
            {editor.isActive('link') ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          </button>

          <div className="mx-1 h-4 w-px bg-border/60" />

          {/* Heading 1 */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleHeading({ level: 1 }).focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Heading 1 (# )"
          >
            <Heading1 className="h-4 w-4" />
          </button>

          {/* Heading 2 */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleHeading({ level: 2 }).focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Heading 2 (## )"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleBlockquote().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Quote (> )"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border/60" />

          {/* Bullet List */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleBulletList().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Bullet List (- )"
          >
            <List className="h-4 w-4" />
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().toggleOrderedList().focus().run();
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-primary/15 text-primary dark:bg-primary/25 font-semibold'
                : 'text-secondary hover:bg-muted/50 hover:text-main'
            }`}
            title="Numbered List (1. )"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border/60" />

          {/* Clear Formatting */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().unsetAllMarks().clearNodes().focus().run();
            }}
            className="rounded-lg p-1.5 transition-colors text-secondary hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-400/20"
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};
