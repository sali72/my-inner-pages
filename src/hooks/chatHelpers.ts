import type { ChatMessage, MessageStatus } from '@/types/chat';

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
