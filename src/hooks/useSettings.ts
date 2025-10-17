import { useState } from 'react';
import { ThemeType, FontType, FontSizeType } from '@/types';

export const useSettings = () => {
  const [theme, setTheme] = useState<ThemeType>('vintage');
  const [journalFont, setJournalFont] = useState<FontType>('serif');
  const [journalFontSize, setJournalFontSize] = useState<FontSizeType>('lg');
  const [ambientSound, setAmbientSound] = useState(false);

  return {
    theme,
    setTheme,
    journalFont,
    setJournalFont,
    journalFontSize,
    setJournalFontSize,
    ambientSound,
    setAmbientSound,
  };
};
