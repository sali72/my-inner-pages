# My Inner Pages - Journal Application

A beautiful, interactive journaling application built with React, TypeScript, and Tailwind CSS. Features include page-flip animations, RTL text support, customizable themes, and AI insights.

## 🎯 Features

- **Interactive Journal**: Page-flip animations with drag-to-navigate functionality
- **Rich Text Support**: RTL (Right-to-Left) text detection and rendering
- **Customizable Themes**: Vintage, Minimal, and Dark themes
- **Font Customization**: Choose from Serif, Sans, or Mono fonts with adjustable sizes
- **Tag System**: Organize entries with custom tags
- **Entry Management**: Create, edit, delete, copy, and share journal entries
- **AI Insights**: View emotional patterns and themes (placeholder for future AI integration)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📁 Project Structure

```
notes-ui/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # App header with navigation
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── EntryMenu.tsx    # Entry actions menu
│   │   ├── TagInput.tsx     # Tag management component
│   │   ├── JournalPage.tsx  # Individual journal page
│   │   ├── NewEntryPage.tsx # New entry creation page
│   │   ├── JournalView.tsx  # Journal view container
│   │   ├── InsightsView.tsx # AI insights view
│   │   └── SettingsView.tsx # Settings view
│   ├── hooks/               # Custom React hooks
│   │   ├── useJournalEntries.ts  # Journal entries state management
│   │   ├── usePageFlip.ts        # Page flip animation logic
│   │   └── useSettings.ts        # App settings state
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── textDirection.ts # RTL text detection
│   │   └── fonts.ts         # Font utility functions
│   ├── constants/           # App constants
│   │   ├── themes.ts        # Theme configurations
│   │   └── initialEntries.ts # Initial journal entries
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd /home/ali/Desktop/Projects/Own-Projects/AI/my-inner-pages-ui/notes-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running Locally

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

1. **Create a production build**:
   ```bash
   npm run build
   ```

2. **Preview the production build**:
   ```bash
   npm run preview
   ```

The built files will be in the `dist/` directory.

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 🎨 Customization

### Adding New Themes

Edit `src/constants/themes.ts` to add new theme configurations:

```typescript
export const THEMES: Record<ThemeType, ThemeConfig> = {
  // ... existing themes
  myTheme: {
    bg: 'from-blue-50 via-cyan-50 to-teal-50',
    paper: 'bg-blue-50',
    accent: 'text-blue-800',
    border: 'border-blue-200',
  },
};
```

### Modifying Initial Entries

Edit `src/constants/initialEntries.ts` to change the default journal entries.

### Customizing Fonts

Modify the font options in `src/utils/fonts.ts` or add new font size options.

## 📦 Dependencies

### Core Dependencies
- **React** (^18.2.0) - UI library
- **React DOM** (^18.2.0) - React rendering
- **Lucide React** (^0.294.0) - Icon library

### Development Dependencies
- **TypeScript** (^5.2.2) - Type safety
- **Vite** (^5.0.8) - Build tool and dev server
- **Tailwind CSS** (^3.3.6) - Utility-first CSS framework
- **ESLint** - Code linting

## 🔧 TypeScript Configuration

The project uses path aliases for cleaner imports:

```typescript
import { Header } from '@components/Header';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { JournalEntry } from '@types/index';
import { THEMES } from '@constants/themes';
import { getFontClass } from '@utils/fonts';
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Code Architecture

### Component Design
- **Separation of Concerns**: Each component has a single responsibility
- **Props Interface**: All components use TypeScript interfaces for type safety
- **Reusability**: Components are designed to be reusable and composable

### State Management
- **Custom Hooks**: Business logic is extracted into custom hooks
- **Local State**: React's useState for component-level state
- **Prop Drilling**: Minimal prop drilling through well-structured component hierarchy

### Styling
- **Tailwind CSS**: Utility-first approach for rapid development
- **Responsive Design**: Mobile-first responsive design
- **Theme System**: Centralized theme configuration

## 🚧 Future Enhancements

- [ ] Local storage persistence for journal entries
- [ ] AI-powered insights and sentiment analysis
- [ ] Export entries to PDF or Markdown
- [ ] Search and filter functionality
- [ ] Calendar view for entries
- [ ] Ambient sound integration
- [ ] Cloud sync capabilities
- [ ] Password protection

## 📄 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

---

**Enjoy journaling with My Inner Pages!** ✨
