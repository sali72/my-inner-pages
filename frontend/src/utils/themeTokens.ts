import { Mode, Accent, ContentFontSize, FontStyle } from '@/types';

type TokenRecord = Record<string, string>;

const structuralTokens: Record<'light' | 'dark', TokenRecord> = {
  light: {
    '--bg-base': '#e8e6e0',
    '--bg-surface': '#f2f0ec',
    '--bg-surface-hover': '#eae8e3',
    '--bg-elevated': '#ffffff',
    '--text-primary': '#1a1a18',
    '--text-secondary': '#5a5a56',
    '--text-tertiary': '#9a9a94',
    '--border-subtle': 'rgba(0, 0, 0, 0.07)',
    '--border-default': 'rgba(0, 0, 0, 0.12)',
    '--color-scheme': 'light',
  },
  dark: {
    '--bg-base': '#0a0a09',
    '--bg-surface': '#141412',
    '--bg-surface-hover': '#1e1e1c',
    '--bg-elevated': '#1e1e1c',
    '--text-primary': '#f0f0ec',
    '--text-secondary': '#a0a09c',
    '--text-tertiary': '#606060',
    '--border-subtle': 'rgba(255, 255, 255, 0.06)',
    '--border-default': 'rgba(255, 255, 255, 0.10)',
    '--color-scheme': 'dark',
  },
};

type AccentVariant = {
  light: TokenRecord;
  dark: TokenRecord;
};

const accentTokens: Record<Accent, AccentVariant> = {
  sage: {
    light: {
      '--bg-base': '#ecefe8',
      '--bg-surface': '#f6f8f3',
      '--accent-primary': '#5a8a6a',
      '--accent-primary-hover': '#4a7a5a',
      '--accent-tint': '#e8f2eb',
      '--accent-tint-text': '#2d6b3e',
      '--accent-focus': 'rgba(90, 138, 106, 0.35)',
    },
    dark: {
      '--accent-primary': '#7ab890',
      '--accent-primary-hover': '#8ac8a0',
      '--accent-tint': '#1a3024',
      '--accent-tint-text': '#9fd4b0',
      '--accent-focus': 'rgba(122, 184, 144, 0.35)',
    },
  },
  dusk: {
    light: {
      '--bg-base': '#edebf2',
      '--bg-surface': '#f7f5fa',
      '--accent-primary': '#7a6caa',
      '--accent-primary-hover': '#6a5c9a',
      '--accent-tint': '#eeebf8',
      '--accent-tint-text': '#4a3d8a',
      '--accent-focus': 'rgba(122, 108, 170, 0.35)',
    },
    dark: {
      '--accent-primary': '#a898d0',
      '--accent-primary-hover': '#b8a8e0',
      '--accent-tint': '#2a2448',
      '--accent-tint-text': '#c4b8e8',
      '--accent-focus': 'rgba(168, 152, 208, 0.35)',
    },
  },
  amber: {
    light: {
      '--bg-base': '#f5ede0',
      '--bg-surface': '#fcf5ea',
      '--accent-primary': '#92400e',
      '--accent-primary-hover': '#78350f',
      '--accent-tint': '#fef3c7',
      '--accent-tint-text': '#92400e',
      '--accent-focus': 'rgba(146, 64, 14, 0.35)',
    },
    dark: {
      '--accent-primary': '#d48a50',
      '--accent-primary-hover': '#e09a60',
      '--accent-tint': '#3a2010',
      '--accent-tint-text': '#f0c080',
      '--accent-focus': 'rgba(212, 138, 80, 0.35)',
    },
  },
  slate: {
    light: {
      '--bg-base': '#e8e9ec',
      '--bg-surface': '#f4f4f6',
      '--accent-primary': '#607080',
      '--accent-primary-hover': '#506070',
      '--accent-tint': '#eaeef2',
      '--accent-tint-text': '#3a5060',
      '--accent-focus': 'rgba(96, 112, 128, 0.35)',
    },
    dark: {
      '--accent-primary': '#8aaabb',
      '--accent-primary-hover': '#9abacb',
      '--accent-tint': '#1e2c36',
      '--accent-tint-text': '#a8c4d4',
      '--accent-focus': 'rgba(138, 170, 187, 0.35)',
    },
  },
  blush: {
    light: {
      '--bg-base': '#f7eaec',
      '--bg-surface': '#fcf4f5',
      '--accent-primary': '#c0607a',
      '--accent-primary-hover': '#b0506a',
      '--accent-tint': '#f7eaee',
      '--accent-tint-text': '#8a3a50',
      '--accent-focus': 'rgba(192, 96, 122, 0.35)',
    },
    dark: {
      '--accent-primary': '#d888a0',
      '--accent-primary-hover': '#e898b0',
      '--accent-tint': '#3a1e28',
      '--accent-tint-text': '#eeacc0',
      '--accent-focus': 'rgba(216, 136, 160, 0.35)',
    },
  },
  ink: {
    light: {
      '--bg-base': '#e8eaef',
      '--bg-surface': '#f4f5f8',
      '--accent-primary': '#3a5896',
      '--accent-primary-hover': '#2a4886',
      '--accent-tint': '#e8edf8',
      '--accent-tint-text': '#2a4080',
      '--accent-focus': 'rgba(58, 88, 150, 0.35)',
    },
    dark: {
      '--accent-primary': '#6888c4',
      '--accent-primary-hover': '#7898d4',
      '--accent-tint': '#182040',
      '--accent-tint-text': '#96b0e4',
      '--accent-focus': 'rgba(104, 136, 196, 0.35)',
    },
  },
  sand: {
    light: {
      '--bg-base': '#f2ede0',
      '--bg-surface': '#faf6ec',
      '--accent-primary': '#c4a664',
      '--accent-primary-hover': '#b49654',
      '--accent-tint': '#f5f0e4',
      '--accent-tint-text': '#7a6530',
      '--accent-focus': 'rgba(196, 166, 100, 0.35)',
    },
    dark: {
      '--accent-primary': '#d4b880',
      '--accent-primary-hover': '#e0c890',
      '--accent-tint': '#302810',
      '--accent-tint-text': '#e8d4a0',
      '--accent-focus': 'rgba(212, 184, 128, 0.35)',
    },
  },
  moss: {
    light: {
      '--bg-base': '#e8ede8',
      '--bg-surface': '#f3f7f3',
      '--accent-primary': '#4d7a6a',
      '--accent-primary-hover': '#3d6a5a',
      '--accent-tint': '#e6f0ec',
      '--accent-tint-text': '#2a5040',
      '--accent-focus': 'rgba(77, 122, 106, 0.35)',
    },
    dark: {
      '--accent-primary': '#70a090',
      '--accent-primary-hover': '#80b0a0',
      '--accent-tint': '#182820',
      '--accent-tint-text': '#98c4b4',
      '--accent-focus': 'rgba(112, 160, 144, 0.35)',
    },
  },
};

const contentFontTokens: Record<ContentFontSize, TokenRecord> = {
  small: { '--content-font-size': '15px', '--content-leading': '1.65' },
  medium: { '--content-font-size': '17px', '--content-leading': '1.70' },
  large: { '--content-font-size': '19px', '--content-leading': '1.75' },
  'x-large': { '--content-font-size': '22px', '--content-leading': '1.80' },
};

const contentFontFamilyTokens: Record<FontStyle, TokenRecord> = {
  serif: { '--content-font': "'Lora', Georgia, serif" },
  sans: { '--content-font': "'Inter', system-ui, -apple-system, sans-serif" },
  mono: { '--content-font': "'JetBrains Mono', 'Fira Code', monospace" },
};

const contentTrackingTokens: Record<FontStyle, TokenRecord> = {
  serif: { '--content-tracking': '-0.01em' },
  sans: { '--content-tracking': '0' },
  mono: { '--content-tracking': '0.02em' },
};

const VALID_ACCENTS = new Set(['sage', 'dusk', 'amber', 'slate', 'blush', 'ink', 'sand', 'moss']);
const VALID_FONTS = new Set(['serif', 'sans', 'mono']);
const VALID_SIZES = new Set(['small', 'medium', 'large', 'x-large']);

export function buildThemeTokens(settings: {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
}): TokenRecord {
  const accent = VALID_ACCENTS.has(settings.accent) ? settings.accent : 'amber';
  const fontStyle = VALID_FONTS.has(settings.fontStyle) ? settings.fontStyle : 'serif';
  const fontSize = VALID_SIZES.has(settings.fontSize) ? settings.fontSize : 'medium';
  const resolvedMode = settings.mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.mode ?? 'light';

  return {
    ...structuralTokens[resolvedMode],
    ...accentTokens[accent][resolvedMode],
    ...contentFontTokens[fontSize],
    ...contentFontFamilyTokens[fontStyle],
    ...contentTrackingTokens[fontStyle],
    '--ui-font': "'Inter', system-ui, -apple-system, sans-serif",
    '--content-measure': '65ch',
    '--chat-measure': '70ch',
  };
}

export { structuralTokens, accentTokens };
