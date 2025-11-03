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
  color: string;
  blurColor: string;
}> = {
  emotional: {
    title: 'Emotional',
    icon: '💗',
    color: 'from-rose-400 to-pink-500',
    blurColor: 'bg-gradient-to-br from-rose-400/20 to-pink-500/20'
  },
  cognitive: {
    title: 'Cognitive',
    icon: '🧠',
    color: 'from-blue-400 to-indigo-500',
    blurColor: 'bg-gradient-to-br from-blue-400/20 to-indigo-500/20'
  },
  behavioral: {
    title: 'Behavioral',
    icon: '⚡',
    color: 'from-amber-400 to-orange-500',
    blurColor: 'bg-gradient-to-br from-amber-400/20 to-orange-500/20'
  },
  relational: {
    title: 'Relational',
    icon: '🤝',
    color: 'from-emerald-400 to-teal-500',
    blurColor: 'bg-gradient-to-br from-emerald-400/20 to-teal-500/20'
  }
};

export const InsightsView: React.FC<MirrorViewProps> = ({ theme }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
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
          className={`relative ${themeConfig.paper} rounded-2xl shadow-2xl border ${themeConfig.border} overflow-hidden transition-all duration-300 ${
            !loading && !reflection ? 'cursor-pointer hover:shadow-3xl hover:scale-[1.02]' : ''
          }`}
          style={{ minHeight: '500px' }}
        >
          {/* Blur overlay */}
          <div
            className={`absolute inset-0 backdrop-blur-2xl ${modeConfig.blurColor} transition-opacity duration-1000 ${
              showBlur ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              {loading ? (
                <>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${modeConfig.color} animate-pulse mb-4`} />
                  <p className={`text-lg font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Reflecting...
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
                    {modeConfig.icon} {modeConfig.title} perspective
                  </p>
                </>
              ) : (
                <>
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${modeConfig.color} opacity-50 mb-6`} />
                  <p className={`text-xl font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-2`}>
                    Touch to reflect
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {modeConfig.icon} {modeConfig.title} mirror
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Reflection content */}
          {reflection && (
            <div className={`relative p-8 transition-opacity duration-1000 ${
              isRevealing ? 'opacity-0' : 'opacity-100'
            }`}>
              {/* Mode indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${modeConfig.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {modeConfig.icon}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${themeConfig.accent}`}>
                    {modeConfig.title} Reflection
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Based on your recent journals
                  </p>
                </div>
              </div>

              {/* Reflection text */}
              <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none`}>
                <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} whitespace-pre-wrap`}>
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
                    : `bg-gradient-to-r ${modeConfig.color} text-white hover:shadow-lg hover:scale-105`
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
