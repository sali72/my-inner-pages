export interface MirrorReflection {
  reflection: string;
  mode: string;
  available_modes: string[];
  error?: string;
}

export type { MirrorMode, MirrorModeConfig } from '@constants/mirrorModes';
