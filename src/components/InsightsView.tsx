import React, { useState } from 'react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';
import { api } from '@/utils/api';

interface MirrorViewProps {
  theme: ThemeType;
}

interface MirrorReflection {
  reflection: string;
  mode: string;
  available_modes: string[];
  error?: string;
}

type MirrorMode = 'emotional' | 'cognitive' | 'behavioral' | 'relational';

const MODE_CONFIG: Record<MirrorMode, { 
  title: string; 
  icon: string;
  gradient: string;
  lightBg: string;
  darkBg: string;
}> = {
  emotional: {
    title: 'Emotional',
    icon: '💗',
    gradient: 'from-rose-400 to-pink-500',
    lightBg: 'bg-gradient-to-br from-rose-100 to-pink-100',
    darkBg: 'bg-gradient-to-br from-rose-900/40 to-pink-900/40'
  },
  cognitive: {
    title: 'Cognitive',
    icon: '🧠',
    gradient: 'from-blue-400 to-indigo-500',
    lightBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
    darkBg: 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40'
  },
  behavioral: {
    title: 'Behavioral',
    icon: '⚡',
    gradient: 'from-amber-400 to-orange-500',
    lightBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
    darkBg: 'bg-gradient-to-br from-amber-900/40 to-orange-900/40'
  },
  relational: {
    title: 'Relational',
    icon: '🤝',
    gradient: 'from-emerald-400 to-teal-500',
    lightBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
    darkBg: 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40'
  }
};

export const MirrorView: React.FC<MirrorViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];
  
  const [reflection, setReflection] = useState<MirrorReflection | null>(null);
  const [selectedMode, setSelectedMode] = useState<MirrorMode>('emotional');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const generateReflection = async () => {
    setLoading(true);
    setIsRevealing(true);
    setReflection(null);
    
    try {
      const data = await api.get<MirrorReflection>(`/api/v0/mirror/reflection?mode=${selectedMode}`);
      setReflection(data);
      // Fade out blur after receiving response
      setTimeout(() => setIsRevealing(false), 500);
    } catch (err) {
      console.error('Error generating reflection:', err);
      setReflection({
        reflection: 'Unable to generate reflection at this moment. Please try again.',
        mode: selectedMode,
        available_modes: ['emotional', 'cognitive', 'behavioral', 'relational'],
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      setTimeout(() => setIsRevealing(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleMirrorTouch = () => {
    if (!loading && !reflection) {
      generateReflection();
    }
  };

  const modeConfig = MODE_CONFIG[selectedMode];
  const showBlur = loading || !reflection;

  return (
    <div className="min-h-screen p-4 pt-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header with mode selector */}
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-bold ${themeConfig.accent}`}>
            🪞 Mirror
          </h1>
          
          {/* Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-slate-700 text-slate-300' 
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="Mirror mode options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 ${
                  themeConfig.paper
                } ${themeConfig.border} border`}>
                  <div className="py-1">
                    {(Object.keys(MODE_CONFIG) as MirrorMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSelectedMode(mode);
                          setShowDropdown(false);
                          setReflection(null);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                          selectedMode === mode
                            ? `${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${themeConfig.accent}`
                            : `${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`
                        }`}
                      >
                        <span className="text-lg">{MODE_CONFIG[mode].icon}</span>
                        <span className="font-medium">{MODE_CONFIG[mode].title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mirror Surface */}
        <div
          onClick={handleMirrorTouch}
          className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            !loading && !reflection ? 'cursor-pointer hover:shadow-3xl hover:scale-[1.02]' : ''
          }`}
          style={{ minHeight: '500px' }}
        >
          {/* Base colored gradient background - always visible */}
          <div className={`absolute inset-0 ${isDark ? modeConfig.darkBg : modeConfig.lightBg}`}>
            {/* Add some gradient blobs for more interesting blur effect */}
            <div className={`absolute top-10 left-10 w-64 h-64 bg-gradient-to-br ${modeConfig.gradient} opacity-30 rounded-full blur-2xl`} />
            <div className={`absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tl ${modeConfig.gradient} opacity-30 rounded-full blur-2xl`} />
          </div>

          {/* Blur overlay when not revealed */}
          {showBlur && (
            <div className="absolute inset-0">
              {loading ? (
                /* Floating gradient blur effect while generating */
                <div className="absolute inset-0">
                  <div className={`absolute inset-0 bg-gradient-to-r ${modeConfig.gradient} opacity-30 animate-pulse`} />
                  <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${modeConfig.gradient} opacity-40 rounded-full blur-3xl animate-float`} />
                  <div className={`absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl ${modeConfig.gradient} opacity-40 rounded-full blur-3xl animate-float-delayed`} />
                  <div className={`absolute inset-0 backdrop-blur-2xl`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'} font-medium`}>
                      {modeConfig.icon} Reflecting...
                    </p>
                  </div>
                </div>
              ) : (
                /* Static blurred gradient before touching */
                <div className="absolute inset-0">
                  <div className={`absolute inset-0 backdrop-blur-2xl`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <p className={`text-xl font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-2`}>
                      Touch to reflect
                    </p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {modeConfig.icon} {modeConfig.title} mirror
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reflection content */}
          {reflection && (
            <div className={`relative p-8 transition-opacity duration-1000 ${
              isRevealing ? 'opacity-0' : 'opacity-100'
            }`}>
              {/* Mode indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${modeConfig.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {modeConfig.icon}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {modeConfig.title} Reflection
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Based on your recent journals
                  </p>
                </div>
              </div>

              {/* Reflection text */}
              <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none`}>
                <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'} whitespace-pre-wrap`}>
                  {reflection.reflection}
                </p>
              </div>

              {/* Generate new reflection button */}
              <button
                onClick={generateReflection}
                disabled={loading}
                className={`mt-8 px-6 py-3 rounded-lg font-medium transition-all ${
                  loading
                    ? `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
                    : `bg-gradient-to-r ${modeConfig.gradient} text-white hover:shadow-lg hover:scale-105`
                }`}
              >
                ✨ Reflect again
              </button>

              {reflection.error && (
                <p className={`text-xs mt-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Note: Using fallback reflection due to service issue
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
