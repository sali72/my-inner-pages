export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  aborted?: boolean;
}

export type WSClientMessage =
  | { type: 'message'; content: string; history?: { role: 'user' | 'assistant'; content: string }[] };

export type WSServerMessage =
  | { type: 'context_loaded' }
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; content: string };

export interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
}
