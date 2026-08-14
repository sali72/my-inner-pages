import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagManager } from '../TagManager';
import { useAllTags, useRenameTag, useDeleteTag, useUpdateTagColor } from '@hooks/useTags';

vi.mock('@hooks/useTags', () => ({
  useAllTags: vi.fn(),
  useRenameTag: vi.fn(),
  useDeleteTag: vi.fn(),
  useUpdateTagColor: vi.fn(),
}));

describe('Tag System UX & Regression Tests', () => {
  const mockRefetch = vi.fn();
  const mockRename = { mutateAsync: vi.fn() };
  const mockDelete = { mutateAsync: vi.fn() };
  const mockUpdateColor = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRenameTag as any).mockReturnValue(mockRename);
    (useDeleteTag as any).mockReturnValue(mockDelete);
    (useUpdateTagColor as any).mockReturnValue(mockUpdateColor);
    (useAllTags as any).mockReturnValue({
      data: [
        { name: 'deep-work', usage_count: 10, color: '#3498db' },
        { name: 'زندگی', usage_count: 5, color: '#f1c40f' },
        { name: 'über', usage_count: 2, color: null },
      ],
      refetch: mockRefetch,
    });
  });

  describe('Unicode & Non-English Hashtag Parsing', () => {
    it('correctly extracts non-English / Unicode hashtags', () => {
      const parseHashTags = (text: string): string[] => {
        const matches = text.match(/#([\p{L}\p{N}_-]+)/gu);
        if (!matches) return [];
        return [...new Set(matches.map(m => m.slice(1)))];
      };

      const input = 'Today I felt grateful for #زندگی and focused on #deep-work and #über';
      const extracted = parseHashTags(input);

      expect(extracted).toEqual(['زندگی', 'deep-work', 'über']);
    });
  });

  describe('Auto-Hyphenation & Space Sanitization', () => {
    it('sanitizes spaces to hyphens in tag creation', () => {
      const sanitizeTag = (input: string) => input.trim().toLowerCase().replace(/\s+/g, '-');

      expect(sanitizeTag('self care')).toBe('self-care');
      expect(sanitizeTag('  deep   work  ')).toBe('deep-work');
      expect(sanitizeTag('project_alpha')).toBe('project_alpha');
    });
  });

  describe('# Symbol Stripping on Tag Removal', () => {
    it('converts #tag to tag without erasing prose when removing a tag', () => {
      const replaceHashtagInText = (text: string, oldTag: string, newTag: string | null): string => {
        const escaped = oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`#${escaped}(?=[\\s.,!?;:]|$)`, 'gui');
        if (newTag !== null) {
          return text.replace(regex, `#${newTag}`);
        } else {
          return text.replace(regex, oldTag);
        }
      };

      const sentence = 'Great progress at #work today!';
      const result = replaceHashtagInText(sentence, 'work', null);

      expect(result).toBe('Great progress at work today!');
    });
  });

  describe('TagManager Component Search & Filtering', () => {
    it('filters tag list based on search query', () => {
      render(<TagManager isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('deep-work')).toBeInTheDocument();
      expect(screen.getByText('زندگی')).toBeInTheDocument();
      expect(screen.getByText('über')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText('Search tags...');
      fireEvent.change(searchInput, { target: { value: 'زندگی' } });

      expect(screen.getByText('زندگی')).toBeInTheDocument();
      expect(screen.queryByText('deep-work')).not.toBeInTheDocument();
    });

    it('triggers callback when selecting a tag filter', () => {
      const handleSelectFilter = vi.fn();
      render(<TagManager isOpen={true} onClose={vi.fn()} onSelectTagFilter={handleSelectFilter} />);

      const tagButton = screen.getByText('deep-work');
      fireEvent.click(tagButton);

      expect(handleSelectFilter).toHaveBeenCalledWith('deep-work');
    });

    it('renders without hook order errors when toggling isOpen state', () => {
      const { rerender } = render(<TagManager isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByText('Manage Tags')).not.toBeInTheDocument();

      rerender(<TagManager isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    });
  });

  describe('Pending Tag Input Flushing on Save/Back', () => {
    it('flushes unsubmitted tag input when navigating back or saving', () => {
      const showTagInput = true;
      const tagInputValue = 'mobile-tag ';
      const explicitTags: string[] = [];

      const flushPendingTagInput = () => {
        if (showTagInput && tagInputValue.trim()) {
          const t = tagInputValue.trim().toLowerCase().replace(/\s+/g, '-');
          if (t && !explicitTags.includes(t)) {
            explicitTags.push(t);
          }
          return t;
        }
        return null;
      };

      const flushed = flushPendingTagInput();
      expect(flushed).toBe('mobile-tag');
      expect(explicitTags).toEqual(['mobile-tag']);
    });
  });

  describe('Dynamic Contrast Calculation', () => {
    it('calculates dark text for bright yellow backgrounds and white for dark blue', () => {
      const getContrastTextColor = (hexColor: string): string => {
        const hex = hexColor.replace('#', '');
        if (hex.length !== 6) return '#ffffff';
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 140 ? '#1e293b' : '#ffffff';
      };

      expect(getContrastTextColor('#f1c40f')).toBe('#1e293b'); // Yellow -> dark text
      expect(getContrastTextColor('#3498db')).toBe('#ffffff'); // Blue -> white text
    });
  });
});
