import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatState, WSClientMessage, WSServerMessage, MessageStatus } from '@/types/chat';
import { api, chatResponseSchema } from '@utils/api';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v0';

const MAX_RECONNECT_ATTEMPTS = 15;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const ACK_TIMEOUT_MS = 5000;

function jitteredDelay(attempt: number): number {
  const exponential = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt),
    MAX_RECONNECT_DELAY_MS,
  );
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(exponential * jitter);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = (payload.exp as number) * 1000;
    return Date.now() >= expMs - 5 * 60 * 1000;
  } catch {
    return true;
  }
}

interface QueuedMessage {
  id: string;
  content: string;
  type: 'message' | 'edit';
  message_index?: number;
  retries: number;
}

interface UseChatWebSocketReturn extends ChatState {
  sendMessage: (content: string) => void;
  sendEdit: (content: string, messageIndex: number) => void;
  stopStreaming: () => void;
  regenerate: () => void;
  editMessage: (content: string, messageIndex: number) => void;
  disconnect: () => void;
  startNewChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ChatState>({
    chatId: null,
    messages: [],
    connectionState: 'disconnected',
    isStreaming: false,
    isContextLoaded: false,
    error: null,
  });
  const currentAssistantMsg = useRef('');
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;
  const chatIdRef = useRef<string | null>(null);
  const loadGenRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueueRef = useRef<QueuedMessage[]>([]);
  const ackWaitRef = useRef<{ messageId: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (ackWaitRef.current !== null) {
      clearTimeout(ackWaitRef.current.timer);
      ackWaitRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setState(prev => ({ ...prev, connectionState: 'failed' }));
      return;
    }

    const attempt = reconnectAttemptRef.current;
    const delay = jitteredDelay(attempt);

    setState(prev => ({ ...prev, connectionState: 'reconnecting' }));

    reconnectTimerRef.current = setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (!token || isTokenExpired(token)) {
        setState(prev => ({ ...prev, error: 'Session expired. Please log in again.', connectionState: 'failed' }));
        return;
      }
      reconnectAttemptRef.current += 1;
      connect(chatIdRef.current, true);
    }, delay);
  }, []);

  const connect = useCallback((targetChatId?: string | null, isReconnect: boolean = false) => {
    cleanup();

    const token = localStorage.getItem('authToken');
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    if (isReconnect && isTokenExpired(token)) {
      setState(prev => ({ ...prev, error: 'Session expired. Please log in again.', connectionState: 'failed' }));
      return;
    }

    const params = new URLSearchParams();
    params.set('token', token);
    if (targetChatId) {
      params.set('chat_id', targetChatId);
    }
    if (isReconnect && targetChatId) {
      params.set('resume', 'true');
    }

    const url = `${WS_BASE_URL}/chat/ws?${params}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      setState(prev => ({ ...prev, connectionState: 'connected', error: null }));
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setState(prev => ({ ...prev, isStreaming: false, isContextLoaded: false }));

      if (event.code === 4001) {
        setState(prev => ({ ...prev, connectionState: 'failed', error: 'Authentication failed. Please log in again.' }));
        return;
      }

      if (event.code === 4003) {
        setState(prev => ({ ...prev, connectionState: 'reconnecting', error: 'Rate limited. Reconnecting...' }));
        scheduleReconnect();
        return;
      }

      if (event.code === 1000 || event.code === 1001) {
        scheduleReconnect();
        return;
      }

      scheduleReconnect();
    };

    ws.onerror = () => {
      if (!wsRef.current) return;
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
            error: null,
          }));
          drainQueue();
          break;
        }

        case 'token': {
          currentAssistantMsg.current += data.content;
          const accumulated = currentAssistantMsg.current;
          setState(prev => {
            const msgs = [...prev.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant' && last.id === 'streaming') {
              msgs[msgs.length - 1] = { ...last, content: accumulated };
            }
            return { ...prev, messages: msgs, isStreaming: true };
          });
          break;
        }

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
                aborted: data.aborted,
              };
            }
            return { ...prev, messages: msgs, isStreaming: false };
          });
          break;
        }

        case 'error': {
          setState(prev => ({ ...prev, isStreaming: false, error: data.content }));
          currentAssistantMsg.current = '';
          break;
        }

        case 'ack': {
          if (ackWaitRef.current !== null && ackWaitRef.current.messageId === data.message_id) {
            clearTimeout(ackWaitRef.current.timer);
            ackWaitRef.current = null;
          }
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
              m.id === data.message_id ? { ...m, status: 'delivered' as MessageStatus } : m
            ),
          }));
          break;
        }

        case 'ping': {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong' }));
          }
          break;
        }

        case 'generation_lost': {
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
              m.status === 'sending' || m.id === 'streaming'
                ? { ...m, status: 'failed' as MessageStatus }
                : m
            ),
          }));
          break;
        }
      }
    };
  }, [cleanup, scheduleReconnect]);

  const drainQueue = useCallback(() => {
    const queue = pendingQueueRef.current;
    if (queue.length === 0) return;

    const sendNext = () => {
      if (queue.length === 0) return;
      const item = queue[0];
      const ws = wsRef.current;

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const msg: WSClientMessage = item.type === 'edit'
        ? { type: 'edit', content: item.content, message_index: item.message_index!, id: item.id }
        : { type: 'message', content: item.content, id: item.id };

      ws.send(JSON.stringify(msg));

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === item.id ? { ...m, status: 'sending' as MessageStatus } : m
        ),
      }));

      const ackTimer = setTimeout(() => {
        if (item.retries < 1) {
          item.retries += 1;
          sendNext();
        } else {
          queue.shift();
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
              m.id === item.id ? { ...m, status: 'failed' as MessageStatus } : m
            ),
          }));
          sendNext();
        }
      }, ACK_TIMEOUT_MS);

      if (ackWaitRef.current !== null) {
        clearTimeout(ackWaitRef.current.timer);
      }
      ackWaitRef.current = { messageId: item.id, timer: ackTimer };
    };

    sendNext();
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setState({
      chatId: null,
      messages: [],
      connectionState: 'disconnected',
      isStreaming: false,
      isContextLoaded: false,
      error: null,
    });
    chatIdRef.current = null;
    pendingQueueRef.current = [];
  }, [cleanup]);

  const connectNew = useCallback(() => {
    disconnect();
    pendingQueueRef.current = [];
    connect(null, false);
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
    connect(targetChatId, false);
  }, [cleanup, connect]);

  const sendMessage = useCallback((content: string) => {
    const msgId = crypto.randomUUID();
    const ws = wsRef.current;

    const userMsg: ChatMessage = {
      id: msgId,
      role: 'user',
      content,
      timestamp: Date.now(),
      status: ws && ws.readyState === WebSocket.OPEN ? 'sending' : 'queued',
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

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingQueueRef.current.push({
        id: msgId,
        content,
        type: 'message',
        retries: 0,
      });
      return;
    }

    const msg: WSClientMessage = { type: 'message', content, id: msgId };
    ws.send(JSON.stringify(msg));

    if (ackWaitRef.current !== null) {
      clearTimeout(ackWaitRef.current.timer);
    }
    const ackTimer = setTimeout(() => {
      const pending = pendingQueueRef.current;
      const alreadyQueued = pending.some(q => q.id === msgId);
      if (!alreadyQueued) {
        pending.push({ id: msgId, content, type: 'message', retries: 0 });
      }
    }, ACK_TIMEOUT_MS);
    ackWaitRef.current = { messageId: msgId, timer: ackTimer };
  }, []);

  const stopStreaming = useCallback(() => {
    const partialContent = currentAssistantMsg.current;
    currentAssistantMsg.current = '';

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const cancelMsg: WSClientMessage = { type: 'cancel' };
      ws.send(JSON.stringify(cancelMsg));
    }

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
  }, []);

  const getLastUserIndex = useCallback((): number => {
    const msgs = messagesRef.current;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') return i;
    }
    return -1;
  }, []);

  const sendEdit = useCallback((content: string, messageIndex: number) => {
    const msgId = crypto.randomUUID();
    const ws = wsRef.current;

    const truncated = messagesRef.current.slice(0, messageIndex);

    const userMsg: ChatMessage = {
      id: msgId,
      role: 'user',
      content,
      timestamp: Date.now(),
      status: ws && ws.readyState === WebSocket.OPEN ? 'sending' : 'queued',
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

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingQueueRef.current.push({
        id: msgId,
        content,
        type: 'edit',
        message_index: messageIndex,
        retries: 0,
      });
      return;
    }

    const msg: WSClientMessage = { type: 'edit', content, message_index: messageIndex, id: msgId };
    ws.send(JSON.stringify(msg));

    if (ackWaitRef.current !== null) {
      clearTimeout(ackWaitRef.current.timer);
    }
    const ackTimer = setTimeout(() => {
      const pending = pendingQueueRef.current;
      const alreadyQueued = pending.some(q => q.id === msgId);
      if (!alreadyQueued) {
        pending.push({ id: msgId, content, type: 'edit', message_index: messageIndex, retries: 0 });
      }
    }, ACK_TIMEOUT_MS);
    ackWaitRef.current = { messageId: msgId, timer: ackTimer };
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
    connect(null, false);
    return cleanup;
  }, [connect, cleanup]);

  return {
    chatId: state.chatId,
    messages: state.messages,
    connectionState: state.connectionState,
    isStreaming: state.isStreaming,
    isContextLoaded: state.isContextLoaded,
    error: state.error,
    sendMessage,
    sendEdit,
    stopStreaming,
    regenerate,
    editMessage,
    disconnect,
    startNewChat: connectNew,
    loadChat,
  };
}
