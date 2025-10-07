import { ThemeConfig, ThemeType } from '@types/index';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  vintage: {
    bg: 'from-amber-50 via-orange-50 to-rose-50',
    paper: 'bg-amber-50',
    accent: 'text-amber-800',
    border: 'border-amber-200',
  },
  minimal: {
    bg: 'from-slate-50 via-gray-50 to-zinc-50',
    paper: 'bg-white',
    accent: 'text-slate-700',
    border: 'border-gray-200',
  },
  dark: {
    bg: 'from-slate-900 via-gray-900 to-neutral-900',
    paper: 'bg-slate-800',
    accent: 'text-slate-200',
    border: 'border-slate-700',
  },
};
