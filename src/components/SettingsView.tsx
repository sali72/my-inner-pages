import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ThemeType, FontType, FontSizeType } from '@types/index';
import { THEMES } from '@constants/themes';

interface SettingsViewProps {
  theme: ThemeType;
  font: FontType;
  fontSize: FontSizeType;
  ambientSound: boolean;
  onThemeChange: (theme: ThemeType) => void;
  onFontChange: (font: FontType) => void;
  onFontSizeChange: (size: FontSizeType) => void;
  onAmbientSoundToggle: () => void;
}

const THEME_OPTIONS: { value: ThemeType; label: string; gradient: string; textColor: string }[] = [
  { value: 'vintage', label: 'Vintage', gradient: 'from-amber-100 to-orange-100', textColor: 'text-amber-900' },
  { value: 'minimal', label: 'Minimal', gradient: 'from-slate-100 to-gray-100', textColor: 'text-slate-700' },
  { value: 'dark', label: 'Dark', gradient: 'from-slate-800 to-slate-900', textColor: 'text-slate-200' },
];

const FONT_OPTIONS: { value: FontType; label: string }[] = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans' },
  { value: 'mono', label: 'Mono' },
];

const FONT_SIZE_OPTIONS: { value: FontSizeType; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'X-Large' },
];

const AMBIENT_SOUNDS = ['🌧️ Rain', '☕ Café', '🌿 Nature'];

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  font,
  fontSize,
  ambientSound,
  onThemeChange,
  onFontChange,
  onFontSizeChange,
  onAmbientSoundToggle,
}) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className={`${themeConfig.paper} p-8 rounded-xl shadow-lg border ${themeConfig.border} space-y-8`}>
        {/* Theme Selection */}
        <div>
          <h3 className={`text-lg font-semibold ${themeConfig.accent} mb-4`}>Journal Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, gradient, textColor }) => (
              <button
                key={value}
                onClick={() => onThemeChange(value)}
                className={`p-4 rounded-lg bg-gradient-to-br ${gradient} border-2 transition-all ${
                  theme === value
                    ? value === 'vintage'
                      ? 'border-amber-500 ring-2 ring-amber-300'
                      : value === 'minimal'
                      ? 'border-gray-500 ring-2 ring-gray-300'
                      : 'border-slate-500 ring-2 ring-slate-400'
                    : value === 'vintage'
                    ? 'border-amber-200 hover:border-amber-400'
                    : value === 'minimal'
                    ? 'border-gray-200 hover:border-gray-400'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <p className={`${textColor} font-medium`}>{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Font Settings */}
        <div>
          <h3 className={`text-lg font-semibold ${themeConfig.accent} mb-4`}>Journal Font</h3>
          <div className="space-y-3">
            {/* Font Style */}
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2 block`}>
                Font Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FONT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFontChange(value)}
                    className={`p-3 rounded-lg font-${value} border-2 transition-all ${
                      font === value
                        ? isDark
                          ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400'
                          : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                        : isDark
                        ? 'border-slate-600 text-slate-400 hover:border-slate-500'
                        : 'border-amber-200 text-amber-700 hover:border-amber-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2 block`}>
                Font Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SIZE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFontSizeChange(value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      fontSize === value
                        ? isDark
                          ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400'
                          : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                        : isDark
                        ? 'border-slate-600 text-slate-400 hover:border-slate-500'
                        : 'border-amber-200 text-amber-700 hover:border-amber-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Sound */}
        <div>
          <h3 className={`text-lg font-semibold ${themeConfig.accent} mb-4`}>Ambient Sound</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
            Ambient sounds are placeholders. You'll need to integrate audio files or a sound library to make them functional.
          </p>
          <button
            onClick={onAmbientSoundToggle}
            className={`w-full p-4 rounded-lg border ${themeConfig.border} flex justify-between items-center ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'
            } transition-all`}
          >
            <span className={isDark ? 'text-slate-300' : 'text-amber-800'}>Enable Ambient Sound</span>
            {ambientSound ? (
              <Volume2 className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-amber-600'}`} />
            ) : (
              <VolumeX className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-amber-400'}`} />
            )}
          </button>
          {ambientSound && (
            <div className="mt-2 space-y-2">
              {AMBIENT_SOUNDS.map((sound) => (
                <button
                  key={sound}
                  className={`w-full text-left px-3 py-2 rounded ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-amber-50 text-amber-700'
                  } transition-all`}
                >
                  {sound}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
