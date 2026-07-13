# My Inner Pages — Frontend

React 18 SPA with TypeScript, Vite, Tailwind CSS, TanStack Query, Playwright.

## Commands (run from `frontend/`)
- `npm install` — install dependencies
- `npm run dev` — Vite dev server (port 5173, HMR)
- `npm run build` — type-check + production build
- `npm run test:e2e` — Playwright E2E tests (auto-starts dev server)
- `npm run lint` — ESLint (zero warnings policy)

## Non-obvious tooling
- Path aliases: import via `@/`, `@components/`, `@hooks/`, etc.
- No routing library — single-page app with conditional rendering on `activeView`. Implemented a custom `useRouter` hook that synchronizes navigation state with URL query parameters and HTML5 history events (`popstate`) to enable browser/mobile back-button navigation and reload preservation.
- Zod v4 for API response validation (in `utils/api.ts`)
- ChatView always mounted (CSS `hidden` class) — preserves WebSocket connection

## Architecture
- **Feature-based components:** `auth/`, `journal/`, `chat/`, `mirror/`, `settings/`, `admin/`, `landing/`, `layout/`, `common/`
- **No router:** `App.tsx` renders the active view (values: `journal`, `mirror`, `chat`, `settings`, `admin`) based on query parameters parsed by the `useRouter` hook, making the URL the single source of truth.
- **State:** AuthContext (global auth), ThemeContext (preferences), TanStack React Query (server data), local state for ephemeral UI, useRouter (navigation)
- **Offline/Sync:** Keystrokes are instantly persisted locally to IndexedDB via Yjs + `y-indexeddb` per journal entry, making the local document the source of truth. Unsynced changes (including offline-created drafts starting with `draft-`) are written to `localStorage` and synced to the backend in the background by `App.tsx` when online, using dynamic ID migration to map drafts to MongoDB ObjectIds.
- **Barrel exports:** each component directory has `index.ts`

## UX principles
- **Mobile-first:** design for phone screens first, then enhance for desktop

## Key conventions
- **Imports:** path aliases over relative; external first, local second
- **Components:** arrow functions, destructured inline props
- **CSS:** Tailwind utility classes only — no CSS modules or styled-components
- **Types:** TypeScript interfaces for models, type aliases for unions, Zod schemas for API

## E2E testing
- No test IDs — select via visible text, aria-labels, or semantic roles
- Workers: 1, retries: 1, traces on first retry
- Helpers in `e2e/fixtures.ts`: `createUser()`, `loginAsUser()`

## Boundaries
- Do NOT add react-router — conditional rendering pattern is intentional
- Do NOT use test IDs in E2E tests — use user-visible selectors
- Do NOT use relative imports like `../../` when `@components/` alias exists

## Reference docs
- `README.md` — setup guide, features overview, user flow, configuration
- `docs/features/local-first-editor.md` — local-first editor (Yjs + IndexedDB) feature docs
- `docs/adr/001-local-first-editor-architecture.md` — architecture decision record
