import React from 'react';

/**
 * Detects if text is Right-to-Left (RTL) based on Unicode character ranges
 */
export const detectRTL = (text: string): boolean => {
  if (!text || text.length === 0) return false;
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text.charAt(0));
};

/**
 * Detects the direction of a single line of text
 */
export const detectLineDirection = (line: string): 'ltr' | 'rtl' => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return 'ltr';
  return detectRTL(trimmedLine) ? 'rtl' : 'ltr';
};

/**
 * Renders text with proper line-by-line direction detection
 */
export const renderTextWithLineDirection = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <span key={index} style={{ direction: detectLineDirection(line), display: 'block' }}>
      {line || '\u00A0'}
    </span>
  ));
};
