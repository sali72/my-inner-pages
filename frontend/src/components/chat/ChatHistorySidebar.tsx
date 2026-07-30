import React, { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Plus, Search, X } from 'lucide-react';
import type { ChatSummary } from '@/types/chat';
import { ConfirmModal } from '@components/journal';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    chats: ChatSummary[];
    activeChatId: string | null;
    onClose: () => void;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onNewChat: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    isOpen,
    chats,
    activeChatId,
    onClose,
    onSelectChat,
    onDeleteChat,
    onNewChat,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const q = searchQuery.toLowerCase();
        return chats.filter(chat => (chat.title || 'New chat').toLowerCase().includes(q));
    }, [chats, searchQuery]);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    w-80 bg-surface border-default flex-shrink-0

                    fixed right-0 top-0 h-full z-50
                    transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}

                    lg:static lg:translate-x-0 lg:z-auto
                    lg:self-start lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]
                    lg:transition-all lg:duration-300 lg:overflow-hidden
                    ${isOpen ? 'lg:w-80 lg:border-l' : 'lg:w-0 lg:border-l-0'}
                `}
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
                                aria-label="Search chats"
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
                                <div
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onSelectChat(chat.id);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors group cursor-pointer ${
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
                                        onClick={(e) => { e.stopPropagation(); setChatToDelete(chat.id); }}
                                        aria-label={`Delete chat ${chat.title || 'New chat'}`}
                                        className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition-all shrink-0 mt-0.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-default text-xs text-muted">
                        {filteredChats.length} of {chats.length} chat{chats.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </aside>

            <ConfirmModal
                isOpen={chatToDelete !== null}
                title="Delete Chat"
                message={`Delete "${chats.find(c => c.id === chatToDelete)?.title || 'this chat'}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => { onDeleteChat(chatToDelete!); setChatToDelete(null); }}
                onCancel={() => setChatToDelete(null)}
            />
        </>
    );
};
