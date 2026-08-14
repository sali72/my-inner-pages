import type { JSONContent } from '@tiptap/core';

export interface JournalEntry {
  id: number | string;
  date: string;
  title: string;
  tags: string[];
  content: string;
  content_json?: JSONContent;
  content_text?: string;
  mood?: string;
  isNew?: boolean;
  created_at?: string;
  updated_at?: string;
  rumination_index?: number | null;
}

export type ViewType = 'journal' | 'mirror' | 'chat' | 'settings' | 'admin' | 'feedback';

export function isValidView(v: string): v is ViewType {
  return v === 'journal' || v === 'mirror' || v === 'chat' || v === 'settings' || v === 'admin' || v === 'feedback';
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
}

export * from './schemas';
export * from './auth';
export * from './admin';
export * from './feedback';
export * from './chat';
export * from './mirror';
