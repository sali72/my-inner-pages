import React, { useState } from 'react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';
import { api } from '@/utils/api';

interface InsightsViewProps {
  theme: ThemeType;
}

interface MirrorReflection {
  reflection: string;
  mode: string;
  available_modes: string[];
  error?: string;
}

const MODE_DESCRIPTIONS: Record<string, { title: string; description: string; icon: string }> = {
  emotional: {
    title: 'Emotional Mirror',
    description: 'Explore your feelings and emotional patterns',
    icon: '💗'
  },
  cognitive: {
    title: 'Cognitive Mirror',
    description: 'Examine your thoughts and beliefs',
    icon: '🧠'
  },
  behavioral: {
    title: 'Behavioral Mirror',
    description: 'Reflect on your actions and habits',
    icon: '⚡'
  },
  relational: {
    title: 'Relational Mirror',
    description: 'Understand your relationships and connections',
    icon: '🤝'
  }
};

export const InsightsView: React.FC<InsightsViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];
  
  const [reflection, setReflection] = useState<MirrorReflection | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('emotional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReflection = async (mode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.get<MirrorReflection>(`/api/v0/mirror/reflection?mode=${mode}`);
      setReflection(data);
      setSelectedMode(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate reflection');
      console.error('Error generating reflection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className={`${themeConfig.paper} p-8 rounded-xl shadow-lg border ${themeConfig.border}`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${themeConfig.accent} mb-2`}>🪞 Mirror Section</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            A personalized daily reflection based on your recent journal entries
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-3`}>
            Choose Your Mirror Theme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(MODE_DESCRIPTIONS).map(([mode, info]) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedMode === mode
                    ? `${themeConfig.accent} ${isDark ? 'bg-indigo-900/30 border-indigo-500' : 'bg-indigo-50 border-indigo-400'}`
                    : `${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'}`
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{info.icon}</span>
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {info.title}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {info.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => generateReflection(selectedMode)}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
            loading
              ? `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
              : `${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`
          }`}
        >
          {loading ? 'Generating reflection...' : '✨ Generate Mirror Reflection'}
        </button>

        {/* Error Display */}
        {error && (
          <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              {error}
            </p>
          </div>
        )}

        {/* Reflection Display */}
        {reflection && (
          <div className={`mt-6 p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{MODE_DESCRIPTIONS[reflection.mode]?.icon}</span>
              <h3 className={`text-lg font-semibold ${themeConfig.accent}`}>
                {MODE_DESCRIPTIONS[reflection.mode]?.title}
              </h3>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed whitespace-pre-wrap`}>
              {reflection.reflection}
            </p>
            {reflection.error && (
              <p className={`text-xs mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Note: Using fallback reflection due to service issue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
