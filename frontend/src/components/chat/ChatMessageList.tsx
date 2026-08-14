import React from 'react';
import { Pencil, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CopyButton } from './CopyButton';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isDark: boolean;
  isStreaming: boolean;
  isContextLoaded: boolean;
  lastUserIdx: number;
  editingId: string | null;
  editContent: string;
  copiedId: string | null;
  expandedMessages: Set<string>;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setEditContent: (val: string) => void;
  setEditingId: (id: string | null) => void;
  sendEdit: (content: string, lastUserIdx: number) => void;
  handleCopy: (id: string, content: string) => void;
  toggleExpand: (id: string) => void;
  regenerate: () => void;
}

const COLLAPSE_THRESHOLD = 280;

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isDark,
  isStreaming,
  isContextLoaded,
  lastUserIdx,
  editingId,
  editContent,
  copiedId,
  expandedMessages,
  editInputRef,
  messagesEndRef,
  setEditContent,
  setEditingId,
  sendEdit,
  handleCopy,
  toggleExpand,
  regenerate,
}) => {
  return (
    <div className="p-4 space-y-6 pb-28 min-h-[calc(100dvh-6rem)]">
      {isContextLoaded && messages.length > 1 && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-accent-tint text-accent-tint">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Journals loaded
          </span>
        </div>
      )}
      {messages.map((msg, idx) => {
        const isLastUserMsg = idx === lastUserIdx;
        const isLastAssistant = idx === messages.length - 1 && msg.role === 'assistant' && lastUserIdx !== -1;
        return (
          <div
            key={msg.id}
            className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className={`flex flex-col items-end gap-1 ${editingId === msg.id ? 'max-w-full w-full' : 'max-w-[90%] sm:max-w-[85%]'}`}>
                {editingId === msg.id ? (
                  <div className="rounded-2xl p-2 bg-accent w-full">
                    <textarea
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendEdit(editContent, lastUserIdx);
                          setEditingId(null);
                          setEditContent('');
                        }
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditContent('');
                        }
                      }}
                      className="w-full resize-none bg-transparent outline-none text-white placeholder:text-white/50 scrollbar-theme"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => { setEditingId(null); setEditContent(''); }}
                        className="text-xs text-white/70 hover:text-white transition-colors px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          sendEdit(editContent, lastUserIdx);
                          setEditingId(null);
                          setEditContent('');
                        }}
                        className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl px-4 py-2.5 bg-accent text-white relative">
                    <div className={`content-typography chat-typography !text-white [&_*]:!text-white whitespace-pre-wrap ${msg.content === '' ? 'animate-pulse' : ''} ${!expandedMessages.has(msg.id) && msg.content.length > COLLAPSE_THRESHOLD ? 'max-h-32 overflow-hidden' : ''}`}>
                      {msg.content || '▊'}
                    </div>

                    {msg.content.length > COLLAPSE_THRESHOLD && (
                      <button
                        onClick={() => toggleExpand(msg.id)}
                        className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors mt-1"
                      >
                        {expandedMessages.has(msg.id) ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show more</>}
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-0.5">
                  {editingId !== msg.id && (
                    <CopyButton messageId={msg.id} content={msg.content} copiedId={copiedId} onCopy={handleCopy} />
                  )}
                  {isLastUserMsg && !editingId && !isStreaming && (
                    <button
                      onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                      className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1 max-w-[90%] sm:max-w-[85%]">
                <div className="min-w-0">
                  {msg.content ? (
                    <MarkdownRenderer content={msg.content} isDark={isDark} />
                  ) : msg.id === 'streaming' && isStreaming ? (
                    <p className="text-sm leading-relaxed text-muted animate-pulse">
                      Generating<span className="dots-animation" />
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed animate-pulse">▊</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <CopyButton messageId={msg.id} content={msg.content} copiedId={copiedId} onCopy={handleCopy} />
                  {isLastAssistant && !isStreaming && (
                    <button
                      onClick={regenerate}
                      className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
                      title="Regenerate"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
