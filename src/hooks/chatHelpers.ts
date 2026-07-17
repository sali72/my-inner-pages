import type { ChatMessage, MessageStatus } from '@/types/chat';

export const ACK_TIMEOUT_MS = 5000;

export interface QueuedMessage {
  id: string;
  content: string;
  type: 'message' | 'edit';
  message_index?: number;
  retries: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = (payload.exp as number) * 1000;
    return Date.now() >= expMs - 5 * 60 * 1000;
  } catch {
    return true;
  }
}

export function startAckTimer(
  ackWaitRef: React.MutableRefObject<{ messageId: string; timer: ReturnType<typeof setTimeout> } | null>,
  pendingQueueRef: React.MutableRefObject<QueuedMessage[]>,
  drainQueue: () => void,
  msgId: string,
  content: string,
  type: QueuedMessage['type'],
  extra?: { message_index: number },
) {
  if (ackWaitRef.current !== null) {
    clearTimeout(ackWaitRef.current.timer);
  }
  const ackTimer = setTimeout(() => {
    const pending = pendingQueueRef.current;
    const alreadyQueued = pending.some(q => q.id === msgId);
    if (!alreadyQueued) {
      pending.push({ id: msgId, content, type, ...(extra || {}), retries: 0 });
      drainQueue();
    }
  }, ACK_TIMEOUT_MS);
  ackWaitRef.current = { messageId: msgId, timer: ackTimer };
}

export function buildUserMessage(
  id: string,
  content: string,
  status: MessageStatus | undefined,
): ChatMessage {
  return { id, role: 'user', content, timestamp: Date.now(), status };
}

export function buildPlaceholder(): ChatMessage {
  return { id: 'streaming', role: 'assistant', content: '', timestamp: Date.now() };
}
