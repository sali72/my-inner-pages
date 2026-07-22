import { useReducer, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, ConnectionState, WSClientMessage, WSServerMessage, MessageStatus } from '@/types/chat';
import { api, chatResponseSchema } from '@utils/api';
import { chatReducer, initialChatState } from './chatReducer';
import { useWebSocketConnection } from './useWebSocketConnection';
import type { WsStatusEvent } from './useWebSocketConnection';
import { startAckTimer, buildUserMessage, buildPlaceholder, isTokenExpired, ACK_TIMEOUT_MS } from './chatHelpers';
import type { QueuedMessage } from './chatHelpers';
import { getAuthSession, isCurrentAuthSession } from '@utils/authSession';

interface UseChatWebSocketReturn {
  chatId: string | null;
  messages: ChatMessage[];
  connectionState: ConnectionState;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
  resumed: boolean;
  sendMessage: (content: string) => void;
  sendEdit: (content: string, messageIndex: number) => void;
  stopStreaming: () => void;
  regenerate: () => void;
  disconnect: () => void;
  startNewChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const {
    connect: wsConnect,
    cleanup: wsCleanup,
    wsRef,
    reconnectTimerRef,
    onMessageRef,
    onStatusRef,
    tokenCheckRef,
    chatIdRef,
  } = useWebSocketConnection();

  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;
  const loadGenRef = useRef(0);
  const pendingQueueRef = useRef<QueuedMessage[]>([]);
  const ackWaitRef = useRef<{ messageId: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  tokenCheckRef.current = () => {
    const token = localStorage.getItem('authToken');
    return !!token && !isTokenExpired(token);
  };

  const drainQueue = useCallback(() => {
    const queue = pendingQueueRef.current;
    if (queue.length === 0) return;

    const sendNext = () => {
      if (queue.length === 0) return;
      const item = queue[0];
      const ws = wsRef.current;

      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const msg: WSClientMessage = item.type === 'edit'
        ? { type: 'edit', content: item.content, message_index: item.message_index!, id: item.id }
        : { type: 'message', content: item.content, id: item.id };

      ws.send(JSON.stringify(msg));
      dispatch({ type: 'SET_MESSAGE_STATUS', messageId: item.id, status: 'sending' });

      const ackTimer = setTimeout(() => {
        if (item.retries < 1) {
          item.retries += 1;
          sendNext();
        } else {
          queue.shift();
          dispatch({ type: 'SET_MESSAGE_STATUS', messageId: item.id, status: 'failed' });
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

  const connect = useCallback((targetChatId?: string | null, isReconnect = false) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      dispatch({ type: 'WS_FAILED', error: 'Not authenticated' });
      return;
    }
    if (isReconnect && isTokenExpired(token)) {
      dispatch({ type: 'WS_FAILED', error: 'Session expired. Please log in again.' });
      return;
    }
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    if (isReconnect && reconnectTimerRef.current !== null) return;
    wsConnect(targetChatId, isReconnect);
  }, [wsConnect, wsRef, reconnectTimerRef]);

  const disconnect = useCallback(() => {
    wsCleanup();
    dispatch({ type: 'WS_RESET' });
    chatIdRef.current = null;
    pendingQueueRef.current = [];
  }, [wsCleanup]);

  const connectNew = useCallback(() => {
    disconnect();
    connect(null, false);
  }, [disconnect, connect]);

  const loadChat = useCallback(async (targetChatId: string) => {
    const gen = ++loadGenRef.current;
    const session = getAuthSession();
    wsCleanup();
    dispatch({ type: 'WS_DISCONNECTED' });
    dispatch({ type: 'LOAD_MESSAGES', messages: [] });

    try {
      const chat = await api.get(`/chats/${targetChatId}`, chatResponseSchema);
      if (loadGenRef.current !== gen || !isCurrentAuthSession(session)) return;
      if (chat?.messages) {
        const loadedMessages: ChatMessage[] = chat.messages.map(
          (m: { role: string; content: string; created_at: string }) => ({
            id: crypto.randomUUID(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          }),
        );
        dispatch({ type: 'LOAD_MESSAGES', messages: loadedMessages });
      }
    } catch {
      if (loadGenRef.current !== gen || !isCurrentAuthSession(session)) return;
      dispatch({ type: 'WS_FAILED', error: 'Failed to load chat' });
      return;
    }
    if (loadGenRef.current !== gen || !isCurrentAuthSession(session)) return;
    connect(targetChatId, false);
  }, [wsCleanup, connect]);

  const sendMessage = useCallback((content: string) => {
    const msgId = crypto.randomUUID();
    const ws = wsRef.current;
    const status: MessageStatus = ws?.readyState === WebSocket.OPEN ? 'sending' : 'queued';

    dispatch({
      type: 'APPEND_MESSAGE',
      userMsg: buildUserMessage(msgId, content, status),
      placeholder: buildPlaceholder(),
    });

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingQueueRef.current.push({ id: msgId, content, type: 'message', retries: 0 });
      return;
    }

    ws.send(JSON.stringify({ type: 'message', content, id: msgId } as WSClientMessage));
    startAckTimer(ackWaitRef, pendingQueueRef, drainQueue, msgId, content, 'message');
  }, [drainQueue]);

  const stopStreaming = useCallback(() => {
    dispatch({ type: 'STOP_STREAMING' });
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cancel' }));
    }
  }, []);

  const sendEdit = useCallback((content: string, messageIndex: number) => {
    const msgId = crypto.randomUUID();
    const ws = wsRef.current;
    const status: MessageStatus = ws?.readyState === WebSocket.OPEN ? 'sending' : 'queued';

    dispatch({
      type: 'APPEND_MESSAGE',
      userMsg: buildUserMessage(msgId, content, status),
      placeholder: buildPlaceholder(),
      truncateTo: messageIndex,
    });

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingQueueRef.current.push({ id: msgId, content, type: 'edit', message_index: messageIndex, retries: 0 });
      return;
    }

    ws.send(JSON.stringify({ type: 'edit', content, message_index: messageIndex, id: msgId } as WSClientMessage));
    startAckTimer(ackWaitRef, pendingQueueRef, drainQueue, msgId, content, 'edit', { message_index: messageIndex });
  }, [drainQueue]);

  const regenerate = useCallback(() => {
    const msgs = messagesRef.current;
    let idx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { idx = i; break; }
    }
    if (idx < 0) return;
    sendEdit(msgs[idx].content, idx);
  }, [sendEdit]);

  onStatusRef.current = (event: WsStatusEvent) => {
    switch (event.type) {
      case 'connected':
        dispatch({ type: 'WS_CONNECTED' });
        break;
      case 'disconnected':
        dispatch({ type: 'WS_DISCONNECTED' });
        if (event.code === 4001) {
          dispatch({ type: 'WS_FAILED', error: 'Authentication failed. Please log in again.' });
        }
        break;
      case 'rate_limited':
        dispatch({ type: 'WS_DISCONNECTED' });
        dispatch({ type: 'WS_FAILED', error: 'Rate limited. Reconnecting...' });
        break;
      case 'reconnecting':
        dispatch({ type: 'WS_RECONNECTING' });
        break;
      case 'no_token':
        dispatch({ type: 'WS_FAILED', error: 'Not authenticated' });
        break;
      case 'session_expired':
        dispatch({ type: 'WS_FAILED', error: 'Session expired. Please log in again.' });
        break;
      case 'reconnect_failed':
        dispatch({ type: 'WS_FAILED', error: 'Connection lost' });
        break;
    }
  };

  onMessageRef.current = (data: WSServerMessage) => {
    switch (data.type) {
      case 'context_loaded':
        chatIdRef.current = data.chat_id;
        dispatch({ type: 'CONTEXT_LOADED', chatId: data.chat_id });
        drainQueue();
        break;

      case 'token':
        dispatch({ type: 'STREAM_TOKEN', content: data.content });
        break;

      case 'done':
        if (data.chat_id) chatIdRef.current = data.chat_id;
        dispatch({ type: 'STREAM_DONE', chatId: data.chat_id, aborted: data.aborted });
        break;

      case 'error':
        dispatch({ type: 'STREAM_ERROR', error: data.content });
        break;

      case 'ack': {
        if (ackWaitRef.current !== null && ackWaitRef.current.messageId === data.message_id) {
          clearTimeout(ackWaitRef.current.timer);
          ackWaitRef.current = null;
        }
        dispatch({ type: 'SET_MESSAGE_STATUS', messageId: data.message_id, status: 'delivered' });
        const queue = pendingQueueRef.current;
        if (queue.length > 0 && queue[0].id === data.message_id) {
          queue.shift();
          drainQueue();
        }
        break;
      }

      case 'ping':
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      case 'generation_resumed':
        dispatch({ type: 'GENERATION_RESUMED' });
        break;

      case 'generation_lost':
        dispatch({ type: 'GENERATION_LOST' });
        break;
    }
  };

  useEffect(() => {
    connect(null, false);
    const handleSessionChange = () => {
      const nextSession = getAuthSession();
      loadGenRef.current += 1;
      wsCleanup();
      pendingQueueRef.current = [];
      if (ackWaitRef.current) clearTimeout(ackWaitRef.current.timer);
      ackWaitRef.current = null;
      dispatch({ type: 'WS_RESET' });
      if (nextSession.token) window.setTimeout(() => connect(null, false), 0);
    };
    window.addEventListener('auth:session-changed', handleSessionChange);
    const recoverOnline = () => {
      const token = localStorage.getItem('authToken');
      if (!token || isTokenExpired(token)) return;
      connect(chatIdRef.current, true);
    };
    const recoverVisible = () => {
      if (document.visibilityState !== 'visible') return;
      recoverOnline();
    };
    window.addEventListener('online', recoverOnline);
    document.addEventListener('visibilitychange', recoverVisible);
    return () => {
      window.removeEventListener('online', recoverOnline);
      document.removeEventListener('visibilitychange', recoverVisible);
      window.removeEventListener('auth:session-changed', handleSessionChange);
      wsCleanup();
    };
  }, [connect, wsCleanup]);

  return {
    chatId: state.chatId,
    messages: state.messages,
    connectionState: state.connectionState,
    isStreaming: state.isStreaming,
    isContextLoaded: state.isContextLoaded,
    error: state.error,
    resumed: state.resumed,
    sendMessage,
    sendEdit,
    stopStreaming,
    regenerate,
    disconnect,
    startNewChat: connectNew,
    loadChat,
  };
}
