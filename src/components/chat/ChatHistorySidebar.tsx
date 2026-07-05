import React from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';
import type { ChatSummary } from '@/types/chat';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    chats: ChatSummary[];
    activeChatId: string | null;
    onClose: () => void;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
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
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed right-0 top-0 h-full w-80 bg-surface border-l border-default z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
            >
                <div className="h-16 px-4 border-b border-default flex items-center justify-between">
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

                <div className="flex-1 overflow-y-auto py-2 scrollbar-theme">
                    {chats.length === 0 ? (
                        <p className="text-sm text-center py-8 text-muted">
                            No chats yet
                        </p>
                    ) : (
                        chats.map(chat => (
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
                    {chats.length} chat{chats.length !== 1 ? 's' : ''}
                </div>
            </aside>
        </>
    );
};
