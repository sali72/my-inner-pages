export type MirrorMode = 'emotional' | 'cognitive' | 'behavioral' | 'relational';

export interface MirrorModeConfig {
  title: string;
  icon: string;
  gradient: string;
  lightBg: string;
  darkBg: string;
}

export const MIRROR_MODES: Record<MirrorMode, MirrorModeConfig> = {
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
