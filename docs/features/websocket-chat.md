# WebSocket Chat — Frontend Client

## Overview

The frontend WebSocket chat client lives in `useChatWebSocket` (`src/hooks/useChatWebSocket.ts`).
It manages the full lifecycle: connection, message send/receive, streaming, auto-reconnect,
message queuing, and delivery status.

## Connection State Machine

```
                  ┌──────────┐
                  │disconnected│
                  └─────┬────┘
                        │ mount / startNewChat / loadChat
                        ▼
              ┌─────────────────┐
              │   connecting     │  (WebSocket handshake in flight)
              └────────┬────────┘
                       │ onopen
                       ▼
              ┌─────────────────┐
         ┌───▶│   connected      │◀───┐
         │    └────────┬────────┘     │
         │             │ onclose      │ onopen (reconnect success)
         │             ▼              │
         │    ┌─────────────────┐     │
         │    │  reconnecting    │────┘
         │    └────────┬────────┘
         │             │ max attempts reached
         │             ▼
         │    ┌─────────────────┐
         └────│     failed       │  (terminal — user must reload)
              └─────────────────┘
```

| State | Meaning | User sees |
|---|---|---|
| `disconnected` | No WS, not trying | "Disconnected" pill |
| `connected` | WS open, sending/receiving | No indicator (or green dot) |
| `reconnecting` | WS closed, backing off | Yellow pulse + "Reconnecting…" |
| `failed` | Gave up after 15 attempts | Red dot + "Connection lost" |

## Auto-Reconnect

Triggered on any `onclose` event except code 4001 (auth failure).

**Backoff formula:**
```
delay = min(1000 × 2^attempt × (0.8 + Math.random() × 0.4), 30000)
```

- Base: 1000ms, doubles each attempt with ±20% jitter
- Cap: 30s
- Max: 15 attempts → state becomes `failed`
- Reset: on successful `onopen`, attempt counter goes to 0

**Before each reconnect attempt:**
1. Read JWT from `localStorage`
2. Check `exp` claim with 5-minute buffer (`isTokenExpired`)
3. If expired → `failed` with "Session expired"
4. If valid → reconnect with current token

## Message Queue (`pendingQueueRef`)

Messages sent while disconnected (or whose ack times out) are enqueued and drained
sequentially on reconnect.

**Queue item:**
```typescript
{ id: string, content: string, type: 'message' | 'edit', message_index?: number, retries: number }
```

**Drain flow:**
1. On `context_loaded` WS event → call `drainQueue()`
2. `drainQueue` sends `queue[0]`, sets 5s ack timer
3. Ack received → shift queue, `drainQueue()` for next
4. Ack timeout → retry once (`retries` 0→1), send again
5. Second timeout → shift+mark failed, continue to next
6. If WS drops mid-drain → `sendNext` returns (no-op), retries on next reconnect

## Ack Protocol

Every outgoing `message`/`edit` includes a `id: string` (UUIDv4):

```typescript
{ type: 'message', content: '...', id: 'a1b2c3d4-...' }
```

**Direct send path** (connected):
1. Send immediately via `ws.send()`
2. Start 5s ack timer
3. Ack arrives → mark `delivered`, clear timer
4. Timer fires → enqueue message, call `drainQueue()` for retry

**Queued send path** (disconnected or retry):
1. Message pushed to queue with `retries: 0`
2. `drainQueue()` sends it, starts 5s ack timer
3. Same retry logic as direct path

**Retry safety:** Server dedup by `id` — retransmit with the same ID is safe.
`aborted` entries in the dedup store allow reprocessing.

## Types

### `WSClientMessage` (client → server)

```typescript
| { type: 'message'; content: string; id: string }
| { type: 'edit'; content: string; message_index: number; id: string }
| { type: 'cancel' }
| { type: 'pong' }
| { type: 'ping' }
```

### `WSServerMessage` (server → client)

```typescript
| { type: 'context_loaded'; chat_id: string | null }
| { type: 'token'; content: string }
| { type: 'done'; chat_id?: string; aborted?: boolean }
| { type: 'error'; content: string }
| { type: 'ack'; message_id: string }
| { type: 'ping' }
| { type: 'pong' }
| { type: 'generation_lost'; chat_id: string }
| { type: 'generation_resumed' }
```

### `ChatState`

```typescript
{
  chatId: string | null;
  messages: ChatMessage[];
  connectionState: ConnectionState;
  isStreaming: boolean;
  isContextLoaded: boolean;
  error: string | null;
  resumed: boolean;
}
```

### `MessageStatus`

```typescript
'sending' | 'sent' | 'delivered' | 'failed' | 'queued'
```

## Event Handling

| WS Event | Frontend action |
|---|---|
| `context_loaded` | Set `chatId`, `isContextLoaded=true`, drain queue |
| `ack` | Clear ack timer, mark message `delivered`, advance queue |
| `token` | Append to `currentAssistantMsg`, update streaming placeholder |
| `done` | Finalize assistant message (replace placeholder), clear streaming state, reset `resumed` |
| `error` | Set error, stop streaming |
| `ping` | Respond with `pong` |
| `generation_lost` | Mark pending messages as `failed` |
| `generation_resumed` | Set `resumed=true` (shows "Resumed" toast) |

## UI Indicators

### Connection status (above input)

| State | Indicator |
|---|---|
| `connected` | None |
| `reconnecting` | Spinning loader + "Reconnecting…" text |
| `disconnected` | WifiOff icon + "Disconnected" |
| `failed` | "Connection lost" |

### Message delivery (user messages only)

| Status | Icon |
|---|---|
| `sending` | Faint spinner |
| `delivered` | Green checkmark |
| `queued` | "waiting…" text |
| `failed` | Red exclamation |

### Resume toast (above input)

Shows "Resumed" text when `resumed` is `true`. Auto-clears on next message send
or stream completion.

### "Still connecting…" hint

If `context_loaded` hasn't arrived within 5s of `connected` state, subtitle changes
from "Loading context…" to "Still connecting…".

## Non-Destructive Cancel

`stopStreaming()` sends `{ type: 'cancel' }` over the live WebSocket — no connection
close or reconnect involved. The connection stays open for the next message.

```typescript
const stopStreaming = () => {
  ws.send(JSON.stringify({ type: 'cancel' }));
  // Finalize partial content as aborted, clear streaming state
};
```

## Close Code Handling

| Code | Frontend action |
|---|---|
| 4001 | `failed` — "Authentication failed. Please log in again." |
| 4003 | `reconnecting` — "Rate limited. Reconnecting..." (extended backoff) |
| 1000 / 1001 | `reconnecting` — silent reconnect with backoff |
| 1006 (abnormal) | `reconnecting` — silent reconnect with backoff |
| other | `reconnecting` — silent reconnect with backoff |

## Hook API

```typescript
interface UseChatWebSocketReturn extends ChatState {
  sendMessage: (content: string) => void;
  sendEdit: (content: string, messageIndex: number) => void;
  stopStreaming: () => void;
  regenerate: () => void;
  editMessage: (content: string, messageIndex: number) => void;
  disconnect: () => void;
  startNewChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
}
```

All state fields from `ChatState` are exposed directly on the return value, so consumers
can destructure `connectionState`, `isStreaming`, `resumed`, etc.

## Key Implementation Details

- **Refs over state for hot paths:** `wsRef`, `pendingQueueRef`, `ackWaitRef`, `reconnectAttemptRef`,
  `currentAssistantMsg` — avoid re-renders during streaming and reconnection loops.
- **`messagesRef`** keeps a mutable copy of the latest messages for `getLastUserIndex`
  and `sendEdit` truncation without stale closure issues.
- **`loadGenRef`** guards against stale `loadChat` responses (incremented on each `loadChat` call).
- **Queue drain only on `context_loaded`:** ensures the server is ready before sending
  queued messages. Resumed generations handle buffer replay on the server side.
