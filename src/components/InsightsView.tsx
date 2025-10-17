import React from 'react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';

interface InsightsViewProps {
  theme: ThemeType;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const themeConfig = THEMES[theme];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className={`${themeConfig.paper} p-8 rounded-xl shadow-lg border ${themeConfig.border}`}>
        <h3 className={`text-xl font-semibold ${themeConfig.accent} mb-4`}>Emotional Patterns</h3>
        <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} mb-4`}>
          Your entries show a beautiful progression toward mindfulness and self-acceptance.
        </p>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-blue-50'} mb-3`}>
          <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-indigo-900'}`}>
            Most Common Theme
          </p>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-indigo-600'}`}>
            Self-reflection and personal growth
          </p>
        </div>
      </div>
    </div>
  );
};
