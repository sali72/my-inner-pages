# My Inner Pages - Frontend

React + TypeScript journaling app with authentication and AI-powered reflections.

## Quick Start

```bash
npm install
npm run dev
```

## Structure

```
src/
├── components/
│   ├── auth/          # Authentication (Login, Register, etc)
│   ├── journal/       # Journal entries, pages, tags
│   ├── mirror/        # AI reflection feature
│   ├── settings/      # User settings
│   ├── layout/        # Header, Sidebar
│   └── common/        # Reusable components (DropdownMenu, IconButton)
├── contexts/          # React contexts (AuthContext)
├── hooks/             # Custom hooks (useJournalEntries, useSettings, usePageFlip)
├── constants/         # Theme & mirror mode configs
├── types/             # TypeScript types
└── utils/             # Helpers (theme, errorHandler, fonts, textDirection)
```

## Configuration (.env)

```env
VITE_API_URL=http://localhost:8000/api/v0
```

## Features

- **Authentication** - Login/Register (no email verification)
- **Journal** - Entries with tags, page flip animations
- **Mirror** - AI reflections in 4 modes (emotional, cognitive, behavioral, relational)
- **Themes** - Vintage, minimal, dark
- **Settings** - Font, size, theme, ambient sound

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Architecture

Single-page app with feature-based organization. Auth state via Context API. No routing - conditional rendering based on view state (`journal` | `mirror` | `settings`).
