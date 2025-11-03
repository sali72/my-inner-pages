import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

/**
 * Get common theme-based CSS classes
 */
export const getThemeClasses = (theme: ThemeType) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  return {
    text: isDark ? 'text-slate-200' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    textAccent: themeConfig.accent,
    bg: isDark ? 'bg-slate-800' : 'bg-white',
    bgHover: isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100',
    bgActive: isDark ? 'bg-slate-700' : 'bg-slate-100',
    border: themeConfig.border,
    paper: themeConfig.paper,
    isDark,
    config: themeConfig,
  };
};

/**
 * Get button classes based on theme and variant
 */
export const getButtonClasses = (
  theme: ThemeType,
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  const variants = {
    primary: isDark
      ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-900',
    secondary: isDark
      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      : 'bg-white hover:bg-slate-50 text-slate-700',
    danger: isDark
      ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400'
      : 'bg-red-50 hover:bg-red-100 text-red-600',
  };

  return `${variants[variant]} transition-all rounded-lg`;
};

/**
 * Get input classes based on theme
 */
export const getInputClasses = (theme: ThemeType) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  return `bg-transparent border ${themeConfig.border} ${
    isDark ? 'text-slate-200' : 'text-slate-800'
  } focus:outline-none focus:ring-2 focus:ring-${isDark ? 'slate-500' : 'amber-500'}`;
};
