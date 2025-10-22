# My Inner Pages - Frontend

React + TypeScript journaling app with authentication.

## Quick Start

```bash
npm install
npm run dev
```

## Structure

```
src/
├── components/        # UI components
│   ├── Auth*.tsx     # Auth pages (Login, Register, etc)
│   ├── Journal*.tsx  # Journal components
│   └── Settings*.tsx # Settings components
├── contexts/         # React contexts
│   └── AuthContext.tsx # Shared auth state (Provider + hook)
├── hooks/            # React hooks
│   ├── useJournalEntries.ts
│   └── useSettings.ts
├── constants/        # Theme configs
└── types/            # TypeScript types
```

## Configuration (.env)

```env
VITE_API_URL=http://localhost:8000/api/v0
```

## Features

- Authentication (no email verification)
- Journal entries with tags
- Page flip animations
- 3 themes (vintage, minimal, dark)
- Settings (font, theme, ambient sound)

## Tech Stack

- React + TypeScript
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide - Icons

## Auth Flow

1. User sees login page
2. Register → Account created immediately
3. Login → JWT token stored in localStorage
4. AuthContext updates → App re-renders
5. Access journal app

No routes - single page app with conditional rendering. Auth state shared via Context API.
