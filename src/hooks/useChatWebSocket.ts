import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatState, WSClientMessage, WSServerMessage } from '@/types/chat';
import { api, chatResponseSchema } from '@utils/api';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v0';

interface UseChatWebSocketReturn extends ChatState {
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  regenerate: () => void;
  editMessage: (content: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  startNewChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ChatState>({
    chatId: null,
    messages: [],
    isConnected: false,
    isStreaming: false,
    isContextLoaded: false,
    error: null,
  });
  const currentAssistantMsg = useRef('');
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;
  const chatIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback((targetChatId?: string | null) => {
    cleanup();

    const token = localStorage.getItem('authToken');
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    const params = new URLSearchParams({ token });
    if (targetChatId) {
      params.set('chat_id', targetChatId);
    }

    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, isConnected: false, isStreaming: false }));
      wsRef.current = null;
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, error: 'Connection failed' }));
    };

    ws.onmessage = (event) => {
      const data: WSServerMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'context_loaded': {
          const newChatId = data.chat_id;
          chatIdRef.current = newChatId;
          setState(prev => ({
            ...prev,
            chatId: newChatId,
            isContextLoaded: true,
          }));
          break;
        }

        case 'token':
          currentAssistantMsg.current += data.content;
          setState(prev => {
            const msgs = [...prev.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant' && last.id === 'streaming') {
              msgs[msgs.length - 1] = { ...last, content: currentAssistantMsg.current };
            }
            return { ...prev, messages: msgs, isStreaming: true };
          });
          break;

        case 'done': {
          const finalContent = currentAssistantMsg.current;
          currentAssistantMsg.current = '';
          if (data.chat_id) {
            chatIdRef.current = data.chat_id;
            setState(prev => ({ ...prev, chatId: data.chat_id! }));
          }
          setState(prev => {
            const msgs = [...prev.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant' && last.id === 'streaming') {
              msgs[msgs.length - 1] = {
                ...last,
                id: crypto.randomUUID(),
                content: finalContent,
              };
            }
            return { ...prev, messages: msgs, isStreaming: false };
          });
          break;
        }

        case 'error':
          setState(prev => ({ ...prev, isStreaming: false, error: data.content }));
          currentAssistantMsg.current = '';
          break;
      }
    };
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setState({
      chatId: null,
      messages: [],
      isConnected: false,
      isStreaming: false,
      isContextLoaded: false,
      error: null,
    });
    chatIdRef.current = null;
  }, [cleanup]);

  const connectNew = useCallback(() => {
    disconnect();
    connect(null);
  }, [disconnect, connect]);

  const loadChat = useCallback(async (targetChatId: string) => {
    currentAssistantMsg.current = '';
    cleanup();
    setState(prev => ({
      ...prev,
      messages: [],
      isContextLoaded: false,
      error: null,
    }));

    try {
      const chat = await api.get(`/chats/${targetChatId}`, chatResponseSchema);
      if (chat && chat.messages) {
        const loadedMessages: ChatMessage[] = chat.messages.map((m: { role: string; content: string; created_at: string }) => ({
          id: crypto.randomUUID(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
        }));
        setState(prev => ({ ...prev, messages: loadedMessages }));
      }
    } catch {
      // silently fail; messages stay empty
    }

    connect(targetChatId);
  }, [cleanup, connect]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const placeholder: ChatMessage = {
      id: 'streaming',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg, placeholder],
      isStreaming: true,
      error: null,
    }));

    currentAssistantMsg.current = '';

    const msg: WSClientMessage = { type: 'message', content };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const stopStreaming = useCallback(() => {
    const partialContent = currentAssistantMsg.current;
    currentAssistantMsg.current = '';
    setState(prev => {
      const msgs = prev.messages.map(m =>
        m.id === 'streaming'
          ? partialContent
            ? { ...m, id: crypto.randomUUID(), content: partialContent, aborted: true }
            : null
          : m
      ).filter(Boolean) as ChatMessage[];
      return { ...prev, messages: msgs, isStreaming: false };
    });
    cleanup();
    connect(chatIdRef.current);
  }, [cleanup, connect]);

  const getLastUserContent = useCallback((): string | null => {
    const msgs = messagesRef.current;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        return msgs[i].content;
      }
    }
    return null;
  }, []);

  const regenerate = useCallback(() => {
    const lastContent = getLastUserContent();
    if (!lastContent) return;
    sendMessage(lastContent);
  }, [getLastUserContent, sendMessage]);

  const editMessage = useCallback((content: string) => {
    sendMessage(content);
  }, [sendMessage]);

  useEffect(() => {
    connect(null);
    return cleanup;
  }, [connect, cleanup]);

  return {
    ...state,
    sendMessage,
    stopStreaming,
    regenerate,
    editMessage,
    disconnect,
    reconnect: () => connect(chatIdRef.current),
    startNewChat: connectNew,
    loadChat,
  };
}
