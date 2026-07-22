import { useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import type { WSServerMessage } from '@/types/chat';

const MAX_RECONNECT_ATTEMPTS = 15;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

function getDefaultWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/v0`;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || getDefaultWsUrl();

export type WsStatusEvent =
  | { type: 'connected' }
  | { type: 'disconnected'; code: number }
  | { type: 'rate_limited' }
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
      reconnectTimerRef.current = null;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        onStatusRef.current({ type: 'reconnect_failed' });
        return;
      }
      reconnectAttemptRef.current += 1;
      doConnect(chatIdRef.current, true);
    }, delay);
  }, []);

  const doConnect = useCallback((targetChatId?: string | null, isReconnect = false) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    if (reconnectTimerRef.current !== null) return;
    cleanup();

    chatIdRef.current = targetChatId ?? null;

    const params = new URLSearchParams();
    if (targetChatId) params.set('chat_id', targetChatId);
    if (isReconnect && targetChatId) params.set('resume', 'true');

    const url = `${WS_BASE_URL}/chat/ws?${params}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      const wasReconnect = isReconnect;
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: wasReconnect ? 'WebSocket reconnected' : 'WebSocket connected',
        level: 'info',
        data: { chat_id: targetChatId, is_reconnect: wasReconnect },
      });
      onStatusRef.current({ type: 'connected' });
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      onStatusRef.current({ type: 'disconnected', code: event.code });

      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `WebSocket closed: code ${event.code}`,
        level: event.code === 1000 ? 'info' : 'warning',
        data: {
          code: event.code,
          reason: event.reason,
          chat_id: targetChatId,
          reconnect_attempt: reconnectAttemptRef.current,
        },
      });

      if (event.code === 4001) return;

      if (event.code === 4003) {
        scheduleRef.current();
        return;
      }

      scheduleRef.current();
    };

    ws.onerror = () => {
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket error',
        level: 'error',
        data: { chat_id: targetChatId },
      });
    };

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
    chatIdRef,
  };
}