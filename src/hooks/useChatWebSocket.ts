import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatState, WSClientMessage, WSServerMessage } from '@/types/chat';
import { api, chatResponseSchema } from '@utils/api';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v0';

interface UseChatWebSocketReturn extends ChatState {
  sendMessage: (content: string) => void;
  sendEdit: (content: string, messageIndex: number) => void;
  stopStreaming: () => void;
  regenerate: () => void;
  editMessage: (content: string, messageIndex: number) => void;
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
  const loadGenRef = useRef(0);

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

    const params = new URLSearchParams();
    params.set('token', token);
    if (targetChatId) {
      params.set('chat_id', targetChatId);
    }

    const url = `${WS_BASE_URL}/chat/ws?${params}`;
    const ws = new WebSocket(url);
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
          {
            const accumulated = currentAssistantMsg.current;
            setState(prev => {
              const msgs = [...prev.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === 'assistant' && last.id === 'streaming') {
                msgs[msgs.length - 1] = { ...last, content: accumulated };
              }
              return { ...prev, messages: msgs, isStreaming: true };
            });
          }
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
    const gen = ++loadGenRef.current;
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
      if (loadGenRef.current !== gen) return;
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
      if (loadGenRef.current !== gen) return;
      setState(prev => ({ ...prev, error: 'Failed to load chat' }));
      return;
    }
    if (loadGenRef.current !== gen) return;
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

  const getLastUserIndex = useCallback((): number => {
    const msgs = messagesRef.current;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') return i;
    }
    return -1;
  }, []);

  const sendEdit = useCallback((content: string, messageIndex: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Truncate the UI message list at messageIndex, then append the new
    // user message + streaming placeholder — exactly like sendMessage but
    // with the history forked at the edit point.
    const truncated = messagesRef.current.slice(0, messageIndex);

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
      messages: [...truncated, userMsg, placeholder],
      isStreaming: true,
      error: null,
    }));

    currentAssistantMsg.current = '';

    const msg: WSClientMessage = { type: 'edit', content, message_index: messageIndex };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const regenerate = useCallback(() => {
    const idx = getLastUserIndex();
    if (idx < 0) return;
    const content = messagesRef.current[idx].content;
    sendEdit(content, idx);
  }, [getLastUserIndex, sendEdit]);

  const editMessage = useCallback((content: string, messageIndex: number) => {
    sendEdit(content, messageIndex);
  }, [sendEdit]);

  useEffect(() => {
    connect(null);
    return cleanup;
  }, [connect, cleanup]);

  return {
    ...state,
    sendMessage,
    sendEdit,
    stopStreaming,
    regenerate,
    editMessage,
    disconnect,
    reconnect: () => connect(chatIdRef.current),
    startNewChat: connectNew,
    loadChat,
  };
}
