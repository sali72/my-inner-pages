import { useRef, useCallback } from 'react';
import type { WSServerMessage } from '@/types/chat';
import { isTokenExpired } from './chatHelpers';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v0';
const MAX_RECONNECT_ATTEMPTS = 15;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
export type WsStatusEvent =
  | { type: 'connected' }
  | { type: 'disconnected'; code: number }
  | { type: 'rate_limited' }
  | { type: 'no_token' }
  | { type: 'session_expired' }
  | { type: 'reconnecting' }
  | { type: 'reconnect_failed' };

function jitteredDelay(attempt: number): number {
  const exponential = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt),
    MAX_RECONNECT_DELAY_MS,
  );
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(exponential * jitter);
}

export function useWebSocketConnection() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMessageRef = useRef<(data: WSServerMessage) => void>(() => {});
  const onStatusRef = useRef<(event: WsStatusEvent) => void>(() => {});
  const tokenCheckRef = useRef<() => boolean>(() => false);
  const chatIdRef = useRef<string | null>(null);
  const scheduleRef = useRef<() => void>(() => {});

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptRef.current = 0;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      onStatusRef.current({ type: 'reconnect_failed' });
      return;
    }

    const attempt = reconnectAttemptRef.current;
    const delay = jitteredDelay(attempt);

    onStatusRef.current({ type: 'reconnecting' });

    reconnectTimerRef.current = setTimeout(() => {
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        onStatusRef.current({ type: 'reconnect_failed' });
        return;
      }
      if (!tokenCheckRef.current()) {
        onStatusRef.current({ type: 'session_expired' });
        return;
      }
      reconnectAttemptRef.current += 1;
      doConnect(chatIdRef.current, true);
    }, delay);
  }, []);

  const doConnect = useCallback((targetChatId?: string | null, isReconnect = false) => {
    cleanup();

    const token = localStorage.getItem('authToken');
    if (!token) {
      onStatusRef.current(isReconnect ? { type: 'session_expired' } : { type: 'no_token' });
      return;
    }

    if (isReconnect && isTokenExpired(token)) {
      onStatusRef.current({ type: 'session_expired' });
      return;
    }

    chatIdRef.current = targetChatId ?? null;

    const params = new URLSearchParams();
    params.set('token', token);
    if (targetChatId) params.set('chat_id', targetChatId);
    if (isReconnect && targetChatId) params.set('resume', 'true');

    const url = `${WS_BASE_URL}/chat/ws?${params}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      onStatusRef.current({ type: 'connected' });
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      onStatusRef.current({ type: 'disconnected', code: event.code });

      if (event.code === 4001) return;

      if (event.code === 4003) {
        scheduleRef.current();
        return;
      }

      if (event.code === 1000 || event.code === 1001) {
        scheduleRef.current();
        return;
      }

      scheduleRef.current();
    };

    ws.onerror = () => {};

    ws.onmessage = (event) => {
      try {
        const data: WSServerMessage = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        /* ignore malformed */
      }
    };
  }, [cleanup]);

  scheduleRef.current = scheduleReconnect;

  return {
    connect: doConnect,
    cleanup,
    wsRef,
    reconnectTimerRef,
    reconnectAttemptRef,
    onMessageRef,
    onStatusRef,
    tokenCheckRef,
    chatIdRef,
  };
}
