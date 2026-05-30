import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import { Mode, Accent, FontStyle, ContentFontSize } from '@/types';
import { buildThemeTokens } from '@/utils/themeTokens';

interface ThemeContextValue {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
  ambientSound: boolean;
  resolvedMode: 'light' | 'dark';

  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
  setFontStyle: (f: FontStyle) => void;
  setFontSize: (s: ContentFontSize) => void;
  setAmbientSound: (on: boolean) => void;
}

const STORAGE_KEY = 'my-inner-pages-theme';

interface PersistedSettings {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
  ambientSound: boolean;
}

const VALID_ACCENTS: Accent[] = ['sage', 'dusk', 'amber', 'slate', 'blush', 'ink', 'sand', 'moss'];
const VALID_MODES: Mode[] = ['light', 'dark', 'system'];
const VALID_FONTS: FontStyle[] = ['serif', 'sans', 'mono'];
const VALID_SIZES: ContentFontSize[] = ['small', 'medium', 'large', 'x-large'];

const DEFAULTS: PersistedSettings = {
  mode: 'system',
  accent: 'amber',
  fontStyle: 'serif',
  fontSize: 'medium',
  ambientSound: false,
};

function validate(raw: Partial<PersistedSettings>): PersistedSettings {
  return {
    mode: VALID_MODES.includes(raw.mode!) ? raw.mode! : DEFAULTS.mode,
    accent: VALID_ACCENTS.includes(raw.accent!) ? raw.accent! : DEFAULTS.accent,
    fontStyle: VALID_FONTS.includes(raw.fontStyle!) ? raw.fontStyle! : DEFAULTS.fontStyle,
    fontSize: VALID_SIZES.includes(raw.fontSize!) ? raw.fontSize! : DEFAULTS.fontSize,
    ambientSound: typeof raw.ambientSound === 'boolean' ? raw.ambientSound : DEFAULTS.ambientSound,
  };
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return validate(JSON.parse(raw));
  } catch {}
  return { ...DEFAULTS };
}

function saveSettings(settings: PersistedSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PersistedSettings>(loadSettings);
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' =
    settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode;

  const applyTokens = useCallback(() => {
    const tokens = buildThemeTokens({
      mode: settings.mode,
      accent: settings.accent,
      fontStyle: settings.fontStyle,
      fontSize: settings.fontSize,
    });

    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    root.setAttribute('data-mode', resolvedMode);
    root.setAttribute('data-accent', settings.accent);
    root.setAttribute('data-font-style', settings.fontStyle);
    root.setAttribute('data-font-size', settings.fontSize);

    root.style.colorScheme = resolvedMode;
  }, [settings, resolvedMode]);

  useEffect(() => {
    applyTokens();
    saveSettings(settings);
  }, [applyTokens, settings]);

  const setter = useCallback(<K extends keyof PersistedSettings>(
    key: K,
    value: PersistedSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const ctx = useMemo<ThemeContextValue>(() => ({
    mode: settings.mode,
    accent: settings.accent,
    fontStyle: settings.fontStyle,
    fontSize: settings.fontSize,
    ambientSound: settings.ambientSound,
    resolvedMode,
    setMode: (m) => setter('mode', m),
    setAccent: (a) => setter('accent', a),
    setFontStyle: (f) => setter('fontStyle', f),
    setFontSize: (s) => setter('fontSize', s),
    setAmbientSound: (on) => setter('ambientSound', on),
  }), [settings, resolvedMode, setter]);

  return (
    <ThemeContext.Provider value={ctx}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
