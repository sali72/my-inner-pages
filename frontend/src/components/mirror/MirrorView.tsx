import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, MessageCircle, Heart, Sparkles, Crosshair, Users } from 'lucide-react';
import { MirrorReflection, MirrorMode } from '@/types/mirror';
import { MIRROR_MODES } from '@constants/mirrorModes';
import { api } from '@/utils/api';

interface MirrorViewProps {
  isDark: boolean;
  onStartChat?: (reflection: string, mode: string) => void;
  reflections: Record<MirrorMode, MirrorReflection | null>;
  onReflectionChange: (mode: MirrorMode, reflection: MirrorReflection | null) => void;
}

export const MirrorView: React.FC<MirrorViewProps> = ({ isDark, onStartChat, reflections, onReflectionChange }) => {
  const [selectedMode, setSelectedMode] = useState<MirrorMode>('emotional');
  const reflection = reflections[selectedMode];
  const [loading, setLoading] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  const mountedRef = useRef(true);
  const modeAtRequestRef = useRef<MirrorMode>(selectedMode);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const setSafeIsRevealing = (v: boolean) => {
    if (mountedRef.current) setIsRevealing(v);
  };

  const generateReflection = async () => {
    setLoading(true);
    setIsRevealing(true);
    onReflectionChange(selectedMode, null);
    modeAtRequestRef.current = selectedMode;

    try {
      const data = await api.get<MirrorReflection>(`/mirror/reflection?mode=${selectedMode}`);
      if (!mountedRef.current || modeAtRequestRef.current !== selectedMode) return;
      onReflectionChange(selectedMode, data);
      revealTimeoutRef.current = setTimeout(() => setSafeIsRevealing(false), 500);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error generating reflection:', err);
      onReflectionChange(selectedMode, {
        reflection: 'Unable to generate reflection at this moment. Please try again.',
        mode: modeAtRequestRef.current,
        available_modes: ['emotional', 'cognitive', 'behavioral', 'relational'],
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      revealTimeoutRef.current = setTimeout(() => setSafeIsRevealing(false), 500);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleMirrorTouch = () => {
    if (!loading && !reflection) {
      generateReflection();
    }
  };

  const MODE_ICONS: Record<MirrorMode, React.ReactNode> = {
    emotional: <Heart className="w-3.5 h-3.5" />,
    cognitive: <Sparkles className="w-3.5 h-3.5" />,
    behavioral: <Crosshair className="w-3.5 h-3.5" />,
    relational: <Users className="w-3.5 h-3.5" />,
  };

  const modeConfig = MIRROR_MODES[selectedMode];
  const showBlur = loading || !reflection;

  return (
    <div className="min-h-screen p-4 pt-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(Object.keys(MIRROR_MODES) as MirrorMode[]).map((mode) => {
            const isActive = selectedMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setSelectedMode(mode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${MIRROR_MODES[mode].gradient} text-white shadow-sm`
                    : 'bg-surface text-muted hover:text-body border border-border'
                }`}
              >
                {MODE_ICONS[mode]}
                {MIRROR_MODES[mode].title}
              </button>
            );
          })}
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
                      Reflecting...
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
                    <p className="text-sm text-muted max-w-xs text-center">
                      See what patterns the AI notices in your recent journal entries
                    </p>
                    <p className="text-xs text-muted mt-2">
                      {modeConfig.title} lens
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
              <div className="mb-6">
                <h2 className="text-xl font-bold text-body">
                  {modeConfig.title} Reflection
                </h2>
                <p className="text-sm text-muted">
                  Based on your recent journals
                </p>
              </div>

              <div className="content-typography whitespace-pre-wrap">
                {reflection.reflection}
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={generateReflection}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    loading
                      ? 'bg-surface-hover text-muted cursor-not-allowed'
                      : `bg-gradient-to-r ${modeConfig.gradient} text-white hover:shadow-lg hover:scale-105`
                  }`}
                >
                  Reflect again
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reflection.reflection);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-3 rounded-lg text-muted hover:text-body hover:bg-surface-hover transition-all"
                  aria-label="Copy reflection"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {onStartChat && (
                  <button
                    onClick={() => onStartChat(reflection.reflection, modeConfig.title)}
                    className="p-3 rounded-lg text-muted hover:text-accent hover:bg-accent-tint transition-all"
                    aria-label="Chat about this reflection"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

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
