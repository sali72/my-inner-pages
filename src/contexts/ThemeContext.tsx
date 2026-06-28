import React, { createContext, useContext, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Mode, Accent, FontStyle, ContentFontSize } from '@/types';
import { buildThemeTokens } from '@/utils/themeTokens';

interface ThemeContextValue {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
  resolvedMode: 'light' | 'dark';

  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
  setFontStyle: (f: FontStyle) => void;
  setFontSize: (s: ContentFontSize) => void;
}

const STORAGE_KEY = 'my-inner-pages-theme';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

interface PersistedSettings {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
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
};

function validate(raw: Partial<PersistedSettings>): PersistedSettings {
  return {
    mode: VALID_MODES.includes(raw.mode!) ? raw.mode! : DEFAULTS.mode,
    accent: VALID_ACCENTS.includes(raw.accent!) ? raw.accent! : DEFAULTS.accent,
    fontStyle: VALID_FONTS.includes(raw.fontStyle!) ? raw.fontStyle! : DEFAULTS.fontStyle,
    fontSize: VALID_SIZES.includes(raw.fontSize!) ? raw.fontSize! : DEFAULTS.fontSize,
  };
}

function loadLocal(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return validate(JSON.parse(raw));
  } catch {}
  return { ...DEFAULTS };
}

function saveLocal(settings: PersistedSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

async function fetchRemote(): Promise<PersistedSettings | null> {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.preferences) {
      return validate(data.preferences);
    }
  } catch {}
  return null;
}

async function saveRemote(settings: PersistedSettings) {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try {
    await fetch(`${API_URL}/auth/me/preferences`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch {}
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PersistedSettings>(loadLocal);
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchRemote().then(remote => {
      if (remote) {
        setSettings(prev => {
          const merged = { ...prev, ...remote };
          saveLocal(merged);
          return merged;
        });
      }
    });
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
    saveLocal(settings);

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => saveRemote(settings), 1000);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
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
    resolvedMode,
    setMode: (m) => setter('mode', m),
    setAccent: (a) => setter('accent', a),
    setFontStyle: (f) => setter('fontStyle', f),
    setFontSize: (s) => setter('fontSize', s),
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
