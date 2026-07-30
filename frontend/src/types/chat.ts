export type MessageStatus = 'sending' | 'delivered' | 'failed' | 'queued';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  aborted?: boolean;
  status?: MessageStatus;
}

export interface ChatSummary {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export type ConnectionState = 'connected' | 'disconnected' | 'failed';

export type SSEServerEvent =
  | { type: 'context_loaded'; chat_id: string }
  | { type: 'token'; content: string }
  | { type: 'done'; chat_id?: string; is_first?: boolean }
  | { type: 'error'; content: string; retry_after_seconds?: number }
  | { type: 'ack'; message_id: string };

export interface ChatState {
  chatId: string | null;
  messages: ChatMessage[];
  connectionState: ConnectionState;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
  resumed: boolean;
}
