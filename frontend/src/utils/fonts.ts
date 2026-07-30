import { FontStyle, ContentFontSize } from '@/types';

const FONT_CLASSES: Record<FontStyle, string> = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
};

const FONT_SIZE_CLASSES: Record<ContentFontSize, string> = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
  'x-large': 'text-2xl',
};

export const getFontClass = (font: FontStyle): string => {
  return FONT_CLASSES[font] || 'font-serif';
};

export const getFontSizeClass = (fontSize: ContentFontSize): string => {
  return FONT_SIZE_CLASSES[fontSize] || 'text-lg';
};
