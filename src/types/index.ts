export interface JournalEntry {
  id: number | string;
  date: string;
  title: string;
  tags: string[];
  content: string;
  mood?: string;
  isNew?: boolean;
  created_at?: string;
}

export type ViewType = 'journal' | 'mirror' | 'chat' | 'settings';

export interface PageFlipState {
  dragStart: number | null;
  dragOffset: number;
  isFlipping: boolean;
}

export type Mode = 'light' | 'dark' | 'system';
export type Accent = 'sage' | 'dusk' | 'amber' | 'slate' | 'blush' | 'ink' | 'sand' | 'moss';

export type FontStyle = 'serif' | 'sans' | 'mono';
export type ContentFontSize = 'small' | 'medium' | 'large' | 'x-large';

export interface AppearanceSettings {
  mode: Mode;
  accent: Accent;
}

export interface WritingSettings {
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
}

export interface ThemeSettings {
  appearance: AppearanceSettings;
  writing: WritingSettings;
  ambientSound: boolean;
}
