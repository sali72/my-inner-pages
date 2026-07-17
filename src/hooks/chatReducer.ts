import type { ChatMessage, ChatState } from '@/types/chat';

export const initialChatState: ChatState = {
  chatId: null,
  messages: [],
  connectionState: 'disconnected',
  isStreaming: false,
  isContextLoaded: false,
  error: null,
  resumed: false,
};

export type ChatAction =
  | { type: 'WS_CONNECTED' }
  | { type: 'WS_RECONNECTING' }
  | { type: 'WS_DISCONNECTED' }
  | { type: 'WS_FAILED'; error: string }
  | { type: 'WS_RESET' }
  | { type: 'CONTEXT_LOADED'; chatId: string | null }
  | { type: 'STREAM_TOKEN'; content: string }
  | { type: 'STREAM_DONE'; chatId?: string; aborted?: boolean }
  | { type: 'STREAM_ERROR'; error: string }
  | { type: 'SET_MESSAGE_STATUS'; messageId: string; status: ChatMessage['status'] }
  | { type: 'GENERATION_RESUMED' }
  | { type: 'GENERATION_LOST' }
  | { type: 'APPEND_MESSAGE'; userMsg: ChatMessage; placeholder: ChatMessage; truncateTo?: number }
  | { type: 'STOP_STREAMING' }
  | { type: 'LOAD_MESSAGES'; messages: ChatMessage[] };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'WS_CONNECTED':
      return { ...state, connectionState: 'connected', error: null };

    case 'WS_RECONNECTING':
      return { ...state, connectionState: 'reconnecting' };

    case 'WS_DISCONNECTED':
      return { ...state, connectionState: 'disconnected', isStreaming: false, isContextLoaded: false };

    case 'WS_FAILED':
      return { ...state, connectionState: 'failed', error: action.error };

    case 'WS_RESET':
      return { ...initialChatState };

    case 'CONTEXT_LOADED':
      return { ...state, chatId: action.chatId, isContextLoaded: true, error: null, resumed: false };

    case 'STREAM_TOKEN':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === 'streaming' && m.role === 'assistant'
            ? { ...m, content: m.content + action.content }
            : m
        ),
        isStreaming: true,
      };

    case 'STREAM_DONE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === 'streaming' && m.role === 'assistant'
            ? { ...m, id: crypto.randomUUID(), aborted: action.aborted }
            : m
        ),
        chatId: action.chatId ?? state.chatId,
        isStreaming: false,
        resumed: false,
      };

    case 'STREAM_ERROR':
      return { ...state, isStreaming: false, error: action.error };

    case 'SET_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.messageId ? { ...m, status: action.status } : m
        ),
      };

    case 'GENERATION_RESUMED':
      return { ...state, resumed: true };

    case 'GENERATION_LOST':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.status === 'sending' || m.id === 'streaming'
            ? { ...m, status: 'failed' as const }
            : m
        ),
      };

    case 'APPEND_MESSAGE':
      return {
        ...state,
        messages: [
          ...(action.truncateTo !== undefined
            ? state.messages.slice(0, action.truncateTo)
            : state.messages
          ),
          action.userMsg,
          action.placeholder,
        ],
        isStreaming: true,
        error: null,
        resumed: false,
      };

    case 'STOP_STREAMING':
      return {
        ...state,
        messages: state.messages.reduce<ChatMessage[]>((acc, m) => {
          if (m.id === 'streaming') {
            if (m.content) {
              acc.push({ ...m, id: crypto.randomUUID(), aborted: true });
            }
          } else {
            acc.push(m);
          }
          return acc;
        }, []),
        isStreaming: false,
      };

    case 'LOAD_MESSAGES':
      return { ...state, messages: action.messages };
  }
}
