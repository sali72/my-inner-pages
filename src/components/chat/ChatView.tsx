import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, MessageCircle, Copy, Check } from 'lucide-react';
import { ThemeType } from '@/types';
import { useChatWebSocket } from '@hooks/useChatWebSocket';
import { THEMES } from '@constants/themes';
import { MarkdownRenderer } from './MarkdownRenderer';

const MAX_TEXTAREA_ROWS = 10;
const LINE_HEIGHT = 20;

interface ChatViewProps {
  theme: ThemeType;
}

export const ChatView: React.FC<ChatViewProps> = ({ theme }) => {
  const themeConfig = THEMES[theme];
  const isDark = theme === 'dark';
  const {
    messages,
    isConnected,
    isStreaming,
    isContextLoaded,
    error,
    sendMessage,
    reconnect,
    startNewChat,
  } = useChatWebSocket();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_TEXTAREA_ROWS * LINE_HEIGHT;
    el.style.height = `${Math.max(LINE_HEIGHT, Math.min(el.scrollHeight, maxHeight))}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected || isStreaming) return;
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

  // Keep input focused after sending (it stays enabled during streaming)
  useEffect(() => {
    if (isConnected && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isConnected, isStreaming]);

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const textClass = isDark ? 'text-slate-200' : 'text-slate-800';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDark ? 'border-slate-700' : 'border-amber-200';
  const bgClass = isDark ? 'bg-slate-800/50' : 'bg-white/50';

  return (
    <div className="h-[calc(100vh-7rem)] p-4 pt-0 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
        <div className={`flex items-center gap-3 mb-3 shrink-0`}>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center`}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${themeConfig.accent}`}>Chat</h1>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`text-xs ${mutedTextClass}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={startNewChat}
              className={`ml-auto text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              New chat
            </button>
          )}
        </div>

        <div className={`flex-1 rounded-2xl ${bgClass} border ${borderClass} overflow-hidden flex flex-col min-h-0`}>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mb-4 shadow-lg`}>
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-lg font-semibold ${textClass} mb-2`}>
                {isContextLoaded ? 'Ask me anything' : 'Connecting...'}
              </h2>
              <p className={`text-sm ${mutedTextClass} max-w-sm`}>
                I've loaded your recent journal entries for context. Ask me about patterns, insights, or anything on your mind.
              </p>
              {!isContextLoaded && !error && (
                <Loader2 className={`w-5 h-5 mt-4 animate-spin ${mutedTextClass}`} />
              )}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-theme">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="flex flex-col items-end gap-1 max-w-[80%]">
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                      }`}>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.content === '' ? 'animate-pulse' : ''}`}>
                          {msg.content || '▊'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-1 max-w-[80%]">
                      <div className={`min-w-0 ${textClass}`}>
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} isDark={isDark} />
                        ) : (
                          <p className="text-sm leading-relaxed animate-pulse">▊</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                          isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className={`border-t ${borderClass} p-4 shrink-0`}>
            {error && (
              <div className="mb-3 flex items-center gap-2 text-red-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={reconnect}
                  className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  Reconnect
                </button>
              </div>
            )}
            <div className={`flex gap-3 items-end ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${borderClass} p-2`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                disabled={!isConnected}
                className={`flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none disabled:opacity-50 scrollbar-theme ${isDark ? 'text-slate-200 placeholder:text-slate-400' : 'text-slate-800 placeholder:text-slate-500'}`}
                style={{ lineHeight: `${LINE_HEIGHT}px`, maxHeight: `${MAX_TEXTAREA_ROWS * LINE_HEIGHT}px` }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected || isStreaming}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  input.trim() && isConnected && !isStreaming
                    ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-md hover:shadow-lg hover:scale-105'
                    : isDark
                    ? 'bg-slate-700 text-slate-500'
                    : 'bg-slate-100 text-slate-400'
                } disabled:cursor-not-allowed`}
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
