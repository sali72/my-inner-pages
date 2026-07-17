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

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected' | 'failed';

export type WSClientMessage =
  | { type: 'message'; content: string; id: string }
  | { type: 'edit'; content: string; message_index: number; id: string }
  | { type: 'cancel' }
  | { type: 'pong' }
  | { type: 'ping' };

export type WSServerMessage =
  | { type: 'context_loaded'; chat_id: string | null }
  | { type: 'token'; content: string }
  | { type: 'done'; chat_id?: string; aborted?: boolean }
  | { type: 'error'; content: string }
  | { type: 'ack'; message_id: string }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'generation_lost'; chat_id: string }
  | { type: 'generation_resumed' };

export interface ChatState {
  chatId: string | null;
  messages: ChatMessage[];
  connectionState: ConnectionState;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
  resumed: boolean;
}
