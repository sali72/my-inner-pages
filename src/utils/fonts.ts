import { FontType, FontSizeType } from '@/types';

const FONT_CLASSES: Record<FontType, string> = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
};

const FONT_SIZE_CLASSES: Record<FontSizeType, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export const getFontClass = (font: FontType): string => {
  return FONT_CLASSES[font] || 'font-serif';
};

export const getFontSizeClass = (fontSize: FontSizeType): string => {
  return FONT_SIZE_CLASSES[fontSize] || 'text-lg';
};
