import React, { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Plus, Search, X } from 'lucide-react';
import type { ChatSummary } from '@/types/chat';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    chats: ChatSummary[];
    activeChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
    onNewChat: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    isOpen,
    chats,
    activeChatId,
    onSelectChat,
    onDeleteChat,
    onNewChat,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const q = searchQuery.toLowerCase();
        return chats.filter(chat => (chat.title || 'New chat').toLowerCase().includes(q));
    }, [chats, searchQuery]);

    return (
        <aside
            className={`${isOpen ? 'w-80 border-l' : 'w-0'} overflow-hidden transition-all duration-300 border-default flex-shrink-0 self-start sticky top-16 h-[calc(100dvh-4rem)]`}
        >
            <div className="w-80 h-full flex flex-col bg-surface">
                <div className="px-4 pt-4 pb-2 border-b border-default space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif font-bold text-body">
                            Chat History
                        </h2>
                        <button
                            onClick={onNewChat}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search chats..."
                            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg bg-surface-hover border border-default outline-none focus:border-accent transition-colors text-body placeholder:text-muted"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 scrollbar-theme">
                    {filteredChats.length === 0 ? (
                        <p className="text-sm text-center py-8 text-muted">
                            {searchQuery ? 'No matching chats' : 'No chats yet'}
                        </p>
                    ) : (
                        filteredChats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id)}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors group ${
                                    chat.id === activeChatId
                                        ? 'bg-accent/10'
                                        : 'hover:bg-surface-hover'
                                }`}
                            >
                                <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${
                                    chat.id === activeChatId ? 'text-accent' : 'text-muted'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${
                                        chat.id === activeChatId ? 'text-accent font-medium' : 'text-body'
                                    }`}>
                                        {chat.title || 'New chat'}
                                    </p>
                                    <p className="text-xs text-muted mt-0.5">
                                        {chat.message_count} message{chat.message_count !== 1 ? 's' : ''}
                                        {' · '}
                                        {new Date(chat.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => onDeleteChat(e, chat.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition-all shrink-0 mt-0.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-default text-xs text-muted">
                    {filteredChats.length} of {chats.length} chat{chats.length !== 1 ? 's' : ''}
                </div>
            </div>
        </aside>
    );
};
