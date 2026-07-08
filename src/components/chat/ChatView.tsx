import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Send, Square, Loader2, AlertCircle, Copy, Check, RotateCw, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatWebSocket } from '@hooks/useChatWebSocket';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { api, chatListResponseSchema } from '@utils/api';
import type { ChatSummary } from '@/types/chat';

const MAX_TEXTAREA_ROWS = 10;
const LINE_HEIGHT = 22;
const INPUT_VERTICAL_PADDING = 24;

interface ChatViewProps {
  isDark: boolean;
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
  chatHistoryOpen: boolean;
  onToggleChatHistory: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ isDark, initialMessage, onInitialMessageSent, chatHistoryOpen, onToggleChatHistory }) => {
  const {
    chatId,
    messages,
    isConnected,
    isStreaming,
    isContextLoaded,
    error,
    sendMessage,
    stopStreaming,
    regenerate,
    editMessage,
    reconnect,
    startNewChat,
    loadChat,
  } = useChatWebSocket();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [chatList, setChatList] = useState<ChatSummary[]>([]);
  const COLLAPSE_THRESHOLD = 280;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const initialRender = useRef(true);
  const userScrolledUp = useRef(false);
  const processedMessageRef = useRef<string>('');
  const pendingMessageRef = useRef<string | null>(null);
  const prevStreaming = useRef(isStreaming);
  const titleRefreshed = useRef(false);

  const loadChatList = useCallback(async () => {
    try {
      const data = await api.get('/chats', chatListResponseSchema);
      if (data?.items) {
        setChatList(data.items);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadChatList();
  }, [loadChatList]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      loadChatList();
    }
  }, [chatId, loadChatList]);

  useEffect(() => {
    if (!titleRefreshed.current && messages.length >= 2 && chatId) {
      titleRefreshed.current = true;
      const title = messages[0].content.replace(/\n/g, ' ').slice(0, 100).trim() || 'New chat';
      setChatList(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
    }
  }, [messages.length, chatId]);

  useEffect(() => {
    if (prevStreaming.current && !isStreaming && messages.length > 0) {
      loadChatList();
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming, messages.length, loadChatList]);

  useEffect(() => {
    if (initialMessage && initialMessage !== processedMessageRef.current) {
      processedMessageRef.current = initialMessage;
      pendingMessageRef.current = initialMessage;
      startNewChat();
    }
  }, [initialMessage, startNewChat]);

  useEffect(() => {
    if (isConnected && pendingMessageRef.current) {
      sendMessage(pendingMessageRef.current);
      pendingMessageRef.current = null;
      onInitialMessageSent?.();
    }
  }, [isConnected, sendMessage, onInitialMessageSent]);

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
      userScrolledUp.current = !isAtBottom;
      setShowScrollButton(!isAtBottom && messages.length > 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [messages.length]);

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const maxHeight = MAX_TEXTAREA_ROWS * LINE_HEIGHT;
    const minHeight = LINE_HEIGHT + INPUT_VERTICAL_PADDING;
    el.style.height = '0px';
    el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight))}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected || isStreaming) return;
    userScrolledUp.current = false;
    sendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isConnected && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isConnected, isStreaming]);

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const editAutoResize = useCallback(() => {
    const el = editInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = 'hidden';
  }, []);

  useEffect(() => {
    editAutoResize();
  }, [editContent, editAutoResize]);

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    userScrolledUp.current = false;
    setShowScrollButton(false);
  };

  const lastUserIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return i;
    }
    return -1;
  }, [messages]);

  const handleSelectChat = (id: string) => {
    loadChat(id);
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChatList(prev => prev.filter(c => c.id !== id));
      if (chatId === id) {
        startNewChat();
      }
    } catch {
      // silently fail
    }
  };

  const handleNewChat = () => {
    titleRefreshed.current = false;
    startNewChat();
    setTimeout(() => loadChatList(), 500);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <div className="flex-1 min-w-0">
      <div className="px-4 pt-2 pb-0">
        <div className="w-full max-w-4xl mx-auto">
          <div className="rounded-2xl bg-elevated border border-default">
            {messages.length === 0 ? (
              <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-lg">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-body mb-2">
                  {isContextLoaded ? 'Ask me anything' : 'Connecting...'}
                </h2>
                <p className="text-sm text-muted max-w-sm">
                  I've loaded your recent journal entries for context. Ask me about patterns, insights, or anything on your mind.
                </p>
                {!isContextLoaded && !error && (
                  <Loader2 className="w-5 h-5 mt-4 animate-spin text-muted" />
                )}
                {error && (
                  <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6 pb-28 min-h-[calc(100dvh-6rem)]">
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
                                    editMessage(editContent);
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
                                    editMessage(editContent);
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
                            <div className="rounded-2xl px-4 py-2.5 bg-accent text-white">
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
                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
                              >
                                {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {isLastUserMsg && !editingId && !isStreaming && (
                              <button
                                onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
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
                            ) : (
                              <p className="text-sm leading-relaxed animate-pulse">▊</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {isLastAssistant && !isStreaming && (
                              <button
                                onClick={regenerate}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
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
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 px-4 pb-4 pt-4 bg-gradient-to-t from-base via-base/95 via-60% to-transparent pointer-events-none"
        style={{ right: chatHistoryOpen ? 320 : 0 }}
      >
        <div className="max-w-4xl mx-auto px-3 pointer-events-auto">
          {showScrollButton && (
            <div className="flex justify-center -translate-y-1">
              <button
                onClick={scrollToBottom}
                className="w-9 h-9 rounded-full bg-accent text-white shadow-lg hover:scale-110 transition-all flex items-center justify-center"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-3 flex items-center gap-2 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={reconnect}
                className="text-xs px-2 py-1 rounded bg-surface-hover text-muted hover:bg-accent-tint transition-colors"
              >
                Reconnect
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end bg-surface rounded-xl border border-default p-2 shadow-lg">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              className="flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none disabled:opacity-50 scrollbar-theme text-body placeholder:text-muted"
              style={{ lineHeight: `${LINE_HEIGHT}px`, maxHeight: `${MAX_TEXTAREA_ROWS * LINE_HEIGHT}px`, height: `${LINE_HEIGHT + INPUT_VERTICAL_PADDING}px` }}
            />
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  input.trim() && isConnected
                    ? 'bg-accent text-white shadow-md hover:shadow-lg hover:scale-105'
                    : 'bg-surface-hover text-muted'
                } disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      <ChatHistorySidebar
        isOpen={chatHistoryOpen}
        chats={chatList}
        activeChatId={chatId}
        onClose={onToggleChatHistory}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
      />
    </div>
  );
};
