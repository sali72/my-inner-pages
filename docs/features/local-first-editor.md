# Local-First Editor (Yjs + IndexedDB)

## Overview

The journal editor uses a **local-first architecture**: every keystroke is immediately persisted to IndexedDB via [Yjs](https://yjs.dev) shared data types and [y-indexeddb](https://github.com/yjs/y-indexeddb). Backend synchronization is an asynchronous background process independent of the editing lifecycle.

This eliminates save races, lost keystrokes, and focus loss caused by the previous debounced-autosave architecture.

## Architecture

```
User types
     │
     ▼
  Tiptap Editor (@tiptap/react + @tiptap/extension-collaboration)
     │
     ▼
  Y.Doc (shared document, one per journal entry)
     │
     ├──► y-indexeddb (IndexedDB persistence — instant, offline)
     │
     └──► React state mirror (title/content for tag parsing)
              │
              ▼
         save() — optional API sync (non-blocking fallback)
```

## Key Files

| File | Role |
|------|------|
| `src/hooks/useJournalDoc.ts` | Manages `Y.Doc` lifecycle + `IndexeddbPersistence` per entry |
| `src/components/journal/JournalPage.tsx` | Tiptap editor + autocomplete + save orchestration |
| `src/hooks/useJournalEntries.ts` | CRUD API calls + background `syncUnsyncedEntries` |
| `src/App.tsx` | Background sync watcher (online, focus, 30s interval) |
| `src/utils/offlineStorage.ts` | LocalStorage queue for unsynced backend operations |

## Initialization Flow

1. **Mount**: `useJournalDoc(entryId, title)` creates a stable `Y.Doc` (`useMemo([], [])`) and connects `IndexeddbPersistence` to a database named `my-inner-pages-journal-${entryId}`.
2. **Sync**: The hook waits for IndexedDB to sync. If the local `Y.Doc` has no title and a server title exists, it seeds the local document. Content is seeded on first load by `editor.commands.setContent(entry.content)` when the Y.XmlFragment is empty.
3. **Ready**: `isLoaded` becomes `true` → loading spinner is hidden → editor is interactive.
4. **Editing**: Every change flows through `@tiptap/extension-collaboration` → `Y.Doc` → `y-indexeddb` (instant). React state mirrors content for tag autocomplete.

## Save Flow (Backend Sync)

Saving to the backend is a **non-blocking, best-effort** operation:

```
Debounce (1500ms) or Back button or Title blur
     │
     ▼
  Compare local state with last-known server state
     │
     ├── No changes → skip
     │
     └── Has changes → PUT /journals/{id}
              │
              ├── Success → remove from localStorage unsynced queue
              │
              └── Failure → save to localStorage unsynced queue
                               │
                               ▼
                         Background sync (App.tsx)
                         • On window focus
                         • On navigator.onLine event
                         • Every 30 seconds
```

## Offline Draft Lifecycle

Creating a journal entry while offline generates a `draft-` prefixed ID:

1. User clicks "New Entry", types content, clicks Back.
2. `onCreate` (API POST) fails → `draft-${Date.now()}` is generated locally.
3. Entry is saved to IndexedDB (via Y.Doc) + localStorage (via `saveUnsyncedEntry`).
4. Background sync in `App.tsx` picks up the `draft-` entry → `POST /journals` on backend → receives real MongoDB ObjectId.
5. `onIdMigrate(oldId, newId)` dispatches `journal:id-migrated` custom event → `JournalPage` updates `entryIdRef.current`.
6. `router.navigate` replaces URL param with new ID → `JournalPage` remounts with the real ID → new Y.Doc database is created for the real ID.
7. Content is restored from React Query cache (which was invalidated after the POST).

## Database Naming

IndexedDB databases are named `my-inner-pages-journal-${entryId}` where `entryId` is the numeric MongoDB ObjectId or a `draft-` string. Each journal entry gets its own Y.Doc and IndexedDB database. This isolation prevents sync conflicts between entries.

## Dual Persistence Considerations

Two persistence layers coexist:

| Layer | Storage | Purpose |
|-------|---------|---------|
| Y.Doc + y-indexeddb | IndexedDB | Editor source of truth — survives tab close, refresh, crash |
| `offlineStorage.ts` | localStorage | Queue of operations pending backend sync — allows retry logic |

The Y.Doc is always the canonical source for the editor. LocalStorage is only a sync queue. If they diverge (e.g., React state mirror lags Y.Doc by one keystroke), the next background sync sends the localStorage snapshot, which is typically identical.

## Future Considerations

- **Multi-tab**: Yjs + y-indexeddb supports shared workers for cross-tab sync.
- **Collaboration**: Yjs has built-in CRDT-based networking (y-websocket, y-webrtc).
- **Offline-first**: The architecture already works fully offline. Future features like attachment storage can follow the same pattern.
- **Migration**: Existing entries created before this feature are plain text in MongoDB. On first edit, Tiptap treats them as text and wraps them in `<p>` tags. Content is preserved on round-trip.
