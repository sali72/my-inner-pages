export interface JournalEntry {
  id: number | string;
  date: string;
  title: string;
  tags: string[];
  content: string;
  mood?: string;
  isNew?: boolean;
  created_at?: string; // For sorting purposes
}

export type ViewType = 'journal' | 'mirror' | 'settings';

export type ThemeType = 'vintage' | 'minimal' | 'dark';

export type FontType = 'serif' | 'sans' | 'mono';

export type FontSizeType = 'sm' | 'md' | 'lg' | 'xl';

export interface ThemeConfig {
  bg: string;
  paper: string;
  accent: string;
  border: string;
}

export interface PageFlipState {
  dragStart: number | null;
  dragOffset: number;
  isFlipping: boolean;
}
