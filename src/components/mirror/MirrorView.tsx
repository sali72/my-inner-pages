import React, { useState } from 'react';
import { MirrorReflection, MirrorMode } from '@/types/mirror';
import { MIRROR_MODES } from '@constants/mirrorModes';
import { api } from '@/utils/api';
import { DropdownMenu, DropdownMenuItem, IconButton } from '@components/common';

interface MirrorViewProps {
  isDark: boolean;
}

export const MirrorView: React.FC<MirrorViewProps> = ({ isDark }) => {
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
      const data = await api.get<MirrorReflection>(`/mirror/reflection?mode=${selectedMode}`);
      setReflection(data);
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

  const modeConfig = MIRROR_MODES[selectedMode];
  const showBlur = loading || !reflection;

  return (
    <div className="min-h-screen p-4 pt-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-body">
            🪞 Mirror
          </h1>

          <div className="relative">
            <IconButton
              onClick={() => setShowDropdown(!showDropdown)}
              ariaLabel="Mirror mode options"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              }
            />

            <DropdownMenu
              isOpen={showDropdown}
              onClose={() => setShowDropdown(false)}
            >
              {(Object.keys(MIRROR_MODES) as MirrorMode[]).map((mode) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode);
                    setShowDropdown(false);
                    setReflection(null);
                  }}
                  isActive={selectedMode === mode}
                  icon={MIRROR_MODES[mode].icon}
                >
                  {MIRROR_MODES[mode].title}
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          </div>
        </div>

        <div
          onClick={handleMirrorTouch}
          className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            !loading && !reflection ? 'cursor-pointer hover:shadow-3xl hover:scale-[1.02]' : ''
          }`}
          style={{ minHeight: '500px' }}
        >
          <div className={`absolute inset-0 ${isDark ? modeConfig.darkBg : modeConfig.lightBg}`}>
            <div className={`absolute top-10 left-10 w-64 h-64 bg-gradient-to-br ${modeConfig.gradient} opacity-30 rounded-full blur-2xl`} />
            <div className={`absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tl ${modeConfig.gradient} opacity-30 rounded-full blur-2xl`} />
          </div>

          {showBlur && (
            <div className="absolute inset-0">
              {loading ? (
                <div className="absolute inset-0">
                  <div className={`absolute inset-0 bg-gradient-to-r ${modeConfig.gradient} opacity-30 animate-pulse`} />
                  <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${modeConfig.gradient} opacity-40 rounded-full blur-3xl animate-float`} />
                  <div className={`absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl ${modeConfig.gradient} opacity-40 rounded-full blur-3xl animate-float-delayed`} />
                  <div className="absolute inset-0 backdrop-blur-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-body font-medium">
                      {modeConfig.icon} Reflecting...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 backdrop-blur-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <p className="text-xl font-medium text-body mb-2">
                      Touch to reflect
                    </p>
                    <p className="text-sm text-muted">
                      {modeConfig.icon} {modeConfig.title} mirror
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {reflection && (
            <div className={`relative p-8 transition-opacity duration-1000 ${
              isRevealing ? 'opacity-0' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${modeConfig.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {modeConfig.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-body">
                    {modeConfig.title} Reflection
                  </h2>
                  <p className="text-sm text-muted">
                    Based on your recent journals
                  </p>
                </div>
              </div>

              <div className="content-typography whitespace-pre-wrap">
                {reflection.reflection}
              </div>

              <button
                onClick={generateReflection}
                disabled={loading}
                className={`mt-8 px-6 py-3 rounded-lg font-medium transition-all ${
                  loading
                    ? 'bg-surface-hover text-muted cursor-not-allowed'
                    : `bg-gradient-to-r ${modeConfig.gradient} text-white hover:shadow-lg hover:scale-105`
                }`}
              >
                ✨ Reflect again
              </button>

              {reflection.error && (
                <p className="text-xs mt-4 text-accent">
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
