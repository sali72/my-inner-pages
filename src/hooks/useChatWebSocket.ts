import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatState, WSClientMessage, WSServerMessage } from '@/types/chat';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v0';
const STORAGE_KEY = 'chat_messages';

interface UseChatWebSocketReturn extends ChatState {
  sendMessage: (content: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  startNewChat: () => void;
}

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* quota exceeded etc */ }
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ChatState>(() => ({
    messages: loadMessages(),
    isConnected: false,
    isStreaming: false,
    isContextLoaded: false,
    error: null,
  }));
  const currentAssistantMsg = useRef('');

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

  const connect = useCallback(() => {
    cleanup();

    const token = localStorage.getItem('authToken');
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?token=${token}`);
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
        case 'context_loaded':
          setState(prev => ({ ...prev, isContextLoaded: true }));
          break;

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

  // Persist messages on every change
  useEffect(() => {
    saveMessages(state.messages);
  }, [state.messages]);

  const disconnect = useCallback(() => {
    cleanup();
    setState({
      messages: [],
      isConnected: false,
      isStreaming: false,
      isContextLoaded: false,
      error: null,
    });
  }, [cleanup]);

  const startNewChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    disconnect();
    connect();
  }, [disconnect, connect]);

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

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return {
    ...state,
    sendMessage,
    disconnect,
    reconnect: connect,
    startNewChat,
  };
}
