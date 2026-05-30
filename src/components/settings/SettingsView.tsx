import React from 'react';
import { Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { Mode, Accent, FontStyle, ContentFontSize } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsViewProps {
  mode: Mode;
  accent: Accent;
  fontStyle: FontStyle;
  fontSize: ContentFontSize;
  onModeChange: (m: Mode) => void;
  onAccentChange: (a: Accent) => void;
  onFontStyleChange: (f: FontStyle) => void;
  onFontSizeChange: (s: ContentFontSize) => void;
}

const ACCENTS: { value: Accent; label: string; light: string; dark: string }[] = [
  { value: 'sage', label: 'Sage', light: '#5a8a6a', dark: '#7ab890' },
  { value: 'dusk', label: 'Dusk', light: '#7a6caa', dark: '#a898d0' },
  { value: 'amber', label: 'Amber', light: '#92400e', dark: '#d48a50' },
  { value: 'slate', label: 'Slate', light: '#607080', dark: '#8aaabb' },
  { value: 'blush', label: 'Blush', light: '#c0607a', dark: '#d888a0' },
  { value: 'ink', label: 'Ink', light: '#3a5896', dark: '#6888c4' },
  { value: 'sand', label: 'Sand', light: '#c4a664', dark: '#d4b880' },
  { value: 'moss', label: 'Moss', light: '#4d7a6a', dark: '#70a090' },
];

const FONT_STYLES: { value: FontStyle; label: string; preview: string }[] = [
  { value: 'serif', label: 'Serif', preview: 'Lora' },
  { value: 'sans', label: 'Sans', preview: 'Inter' },
  { value: 'mono', label: 'Mono', preview: 'JetBrains Mono' },
];

const FONT_SIZES: { value: ContentFontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'x-large', label: 'X-Large' },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  light: <Sun className="w-5 h-5" />,
  dark: <Moon className="w-5 h-5" />,
  system: <Monitor className="w-5 h-5" />,
};

const PREVIEW_TEXT = {
  title: 'A Quiet Morning',
  date: 'May 30, 2026',
  tags: ['reflection', 'morning'],
  body: 'The light filters through the window in that particular way it only does in spring. I find myself thinking about how small moments carry the most weight — the sound of coffee brewing, a page turning, the distant hum of the city waking up.',
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  mode,
  accent,
  fontStyle,
  fontSize,
  onModeChange,
  onAccentChange,
  onFontStyleChange,
  onFontSizeChange,
}) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pt-6">
      <div className="card p-6 space-y-8">

      {/* Appearance Mode */}
      <section>
        <h2 className="text-lg font-semibold text-primary mb-1">Appearance Mode</h2>
        <p className="text-sm text-secondary mb-3">Choose light, dark, or follow your system preference.</p>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm ${
                mode === m
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-primary border-default hover:border-hover'
              }`}
            >
              {MODE_ICONS[m]}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Accent Color */}
      <section>
        <h2 className="text-lg font-semibold text-primary mb-1">Accent Color</h2>
        <p className="text-sm text-secondary mb-3">Used for buttons, links, tags, and highlights.</p>
        <div className="grid grid-cols-4 gap-3">
          {ACCENTS.map(({ value, label, light }) => (
            <button
              key={value}
              onClick={() => onAccentChange(value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                accent === value
                  ? 'border-accent bg-accent-tint'
                  : 'border-default hover:border-hover'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full border border-white/20 shadow-sm"
                style={{ background: light }}
              />
              <span className="text-xs text-secondary">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Live Preview */}
      <section className="card p-5">
        <div className="content-typography">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-medium text-accent">{PREVIEW_TEXT.date}</span>
              <h3 className="text-xl font-bold text-primary mt-0.5">{PREVIEW_TEXT.title}</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PREVIEW_TEXT.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs bg-accent-tint text-accent-tint"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-primary leading-relaxed">{PREVIEW_TEXT.body}</p>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold text-primary mb-1">Typography</h2>
        <p className="text-sm text-secondary mb-3">Font style and size for journal entries, reflections, and chat.</p>

        <label className="text-sm font-medium text-primary mb-2 block">Font Style</label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {FONT_STYLES.map(({ value, label, preview }) => (
            <button
              key={value}
              onClick={() => onFontStyleChange(value)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                fontStyle === value
                  ? 'border-accent bg-accent-tint'
                  : 'border-default hover:border-hover'
              }`}
            >
              <p className="text-lg font-semibold text-primary" style={{ fontFamily: `var(--content-font)` }}>
                {preview}
              </p>
              <p className="text-xs text-secondary mt-1">{label}</p>
            </button>
          ))}
        </div>

        <label className="text-sm font-medium text-primary mb-2 block">Font Size</label>
        <div className="flex gap-2">
          {FONT_SIZES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFontSizeChange(value)}
              className={`flex-1 py-2.5 rounded-lg border-2 transition-all text-sm ${
                fontSize === value
                  ? 'border-accent bg-accent-tint text-accent'
                  : 'border-default text-primary hover:border-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-lg font-semibold text-primary mb-1">Account</h2>
        <div className="p-4 rounded-lg border border-default bg-surface mb-3">
          <p className="text-sm text-secondary mb-1">Logged in as:</p>
          <p className="font-medium text-primary">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full p-4 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all flex justify-between items-center"
        >
          <span className="font-medium">Logout</span>
          <LogOut className="w-5 h-5" />
        </button>
      </section>

      </div>
    </div>
  );
};
