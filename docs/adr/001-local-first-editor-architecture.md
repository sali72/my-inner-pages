# ADR-001: Local-First Editor Architecture

**Status:** Accepted  
**Date:** 2026-07-13  
**Deciders:** @sali72  

---

## Context

The journal editor's original autosave architecture used the **UI as the source of truth** — debounced `create`/`update` API requests synchronized React state with the backend on every keystroke. This caused persistent production bugs:

- Race conditions that created duplicate journal entries (one without title, one with title).
- Focus loss and dropped characters when autosave triggered component state changes mid-typing.
- Architectural brittleness: any future feature (offline mode, multi-tab, collaboration) would require a fundamental rewrite.

We needed an architecture where **persistence is decoupled from the UI lifecycle** and **local storage is the source of truth** during editing.

## Decision

**Adopt a local-first architecture using Tiptap + Yjs + y-indexeddb, with one Y.Doc per journal entry.**

### Technology choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Editor framework | Tiptap (ProseMirror) | Extensible, well-typed, official Yjs plugin |
| Shared document type | Yjs (Y.Doc) | Mature CRDT library, battle-tested, offline-first by design |
| Local persistence | y-indexeddb (IndexedDB) | Survives tab close/refresh/crash, larger storage than localStorage |
| Rich text protocol | Y.XmlFragment + Y.Text via Collaboration extension | Native Yjs types, no serialization overhead |
| Backend sync | TanStack Query mutations + background interval | No custom sync protocol needed |

### Key constraints

1. **Y.Doc must be stable for the component's lifetime** — never recreated on prop/font/size changes. Dashboarded via `useMemo([], [])`.
2. **IndexeddbPersistence must be created/destroyed inside useEffect** — never in useMemo, to avoid stale destroyed instances.
3. **Dynamic styling (font, fontSize) must use CSS inheritance, not editor recreation** — applied on wrapper `<div>`, not Tiptap attributes.
4. **Backend sync must never block the editor** — saves are fire-and-forget with fallback to localStorage.

## Consequences

### Positive

- **No lost keystrokes**: every edit persists to IndexedDB immediately, even offline.
- **No save races**: Y.Doc is the single source of truth; there are no competing API requests for the same data.
- **No interrupted typing**: persistence is decoupled from the editor lifecycle.
- **Offline-first by design**: works fully without a network connection.
- **Future-proof**: Yjs natively handles multi-tab, collaboration, and custom networking.
- **Simpler save logic**: "try backend, fall back to localStorage queue" replaces the old debounce-with-race-vulnerability pattern.

### Negative

- **Bundle size increase**: ~1MB JS (319KB gzipped) from yjs, y-indexeddb, and Tiptap extensions.
- **Dual persistence**: IndexedDB (editor state) + localStorage (sync queue) must stay aligned.
- **Initial load spinner**: editor shows a loading state until IndexedDB syncs (typically <100ms).
- **Content format shift**: Previous plain text is now parsed as HTML by Tiptap. Entries containing `<`/`>` characters may render differently on next edit. Acceptable for typical journal content.

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| localStorage and IndexedDB diverge | React state mirrors Y.Doc content on every `onUpdate`. `beforeunload` writes React state to localStorage. Divergence window is <1 keystroke. |
| Draft ID migration loses Y.Doc content | Migration remounts `JournalPage` with new key, which creates a new Y.Doc. Content is restored from React Query cache (invalidated after backend POST). |
| Y.Doc memory leak on rapid navigation | Single `Y.Doc` instance per mount; component is keyed by `editorSessionKey` which only changes on navigation. |
| Multiple tabs corrupt IndexedDB | Each entry has its own Y.Doc + database. Tabs editing different entries cannot collide. Same-entry edits in multiple tabs is deferred (not yet supported). |

## Compliance

- All new journal editor features **must** write through the Y.Doc → y-indexeddb path.
- Backend sync code **must not** block or delay the editor lifecycle.
- Font/size/style changes **must** be applied via CSS inheritance on wrapper elements, never by recreating the editor or Y.Doc.
- The `draft-` ID lifecycle (generation → background sync → migration) **must** be preserved for any new entry-creation paths.

## Alternatives Considered

1. **IndexedDB via raw IDBWrapper** — rejected due to lack of built-in conflict resolution.
2. **localStorage only** — rejected due to 5MB limit and synchronous API.
3. **Service Worker + Cache API** — rejected as overly complex for the use case.
4. **Continue with debounced API calls** — rejected due to accumulated bugs and limited future scalability.

## References

- [Yjs documentation](https://yjs.dev)
- [y-indexeddb](https://github.com/yjs/y-indexeddb)
- [Tiptap Collaboration extension](https://tiptap.dev/docs/editor/extensions/collaboration)
- [Feature doc: Local-First Editor](../features/local-first-editor.md)
