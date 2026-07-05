export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  aborted?: boolean;
}

export interface ChatSummary {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export type WSClientMessage =
  | { type: 'message'; content: string };

export type WSServerMessage =
  | { type: 'context_loaded'; chat_id: string | null }
  | { type: 'token'; content: string }
  | { type: 'done'; chat_id?: string }
  | { type: 'error'; content: string };

export interface ChatState {
  chatId: string | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
}
