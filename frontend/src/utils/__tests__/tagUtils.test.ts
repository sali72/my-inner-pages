import { describe, it, expect } from 'vitest';
import {
  sanitizeTag,
  parseHashTags,
  getContrastTextColor,
  formatTagStyle,
  replaceHashtagInTiptapAst,
} from '../tagUtils';

describe('tagUtils module', () => {
  describe('sanitizeTag', () => {
    it('normalizes whitespace to hyphens and lowercases string', () => {
      expect(sanitizeTag(' Self Care ')).toBe('self-care');
      expect(sanitizeTag('#DeepWork')).toBe('deepwork');
      expect(sanitizeTag('  #Mental Health  ')).toBe('mental-health');
    });

    it('returns empty string for empty or null input', () => {
      expect(sanitizeTag('')).toBe('');
    });
  });

  describe('parseHashTags', () => {
    it('extracts unique normalized hashtags from prose text including Unicode', () => {
      const text = 'Today I focused on #deep-work and #Self-Care with #deep-work and #زندگی.';
      expect(parseHashTags(text)).toEqual(['deep-work', 'self-care', 'زندگی']);
    });
  });

  describe('getContrastTextColor & formatTagStyle', () => {
    it('returns dark text for bright colors and white for dark colors', () => {
      expect(getContrastTextColor('#f1c40f')).toBe('#1e293b'); // Yellow -> dark
      expect(getContrastTextColor('#2ecc71')).toBe('#1e293b'); // Bright green -> dark
      expect(getContrastTextColor('#3498db')).toBe('#ffffff'); // Blue -> white
    });

    it('formats tag style object correctly', () => {
      expect(formatTagStyle(null)).toEqual({
        backgroundColor: 'var(--accent-tint)',
        color: 'var(--accent)',
      });
      expect(formatTagStyle('#3498db')).toEqual({
        backgroundColor: '#3498db20',
        color: '#3498db',
      });
    });
  });

  describe('replaceHashtagInTiptapAst', () => {
    it('renames hashtag in text node', () => {
      const ast = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Working on #old-tag today' }],
          },
        ],
      };
      const updated = replaceHashtagInTiptapAst(ast, 'old-tag', 'new-tag');
      expect(updated.content[0].content[0].text).toBe('Working on #new-tag today');
    });

    it('converts #old-tag to old-tag (stripping #) when newTag is null', () => {
      const ast = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Working on #old-tag today' }],
          },
        ],
      };
      const updated = replaceHashtagInTiptapAst(ast, 'old-tag', null);
      expect(updated.content[0].content[0].text).toBe('Working on old-tag today');
    });
  });
});
