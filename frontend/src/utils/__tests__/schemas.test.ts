import { describe, it, expect } from 'vitest';
import { journalResponseSchema } from '@/types/schemas';

describe('Journal Schema Validation Tests', () => {
  it('parses journal response with content_json and content_text', () => {
    const raw = {
      id: 'journal-123',
      title: 'Deep Reflection',
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Evening Thoughts' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Feeling calm.' }],
          },
        ],
      },
      content_text: 'Evening Thoughts\nFeeling calm.',
      tags: ['reflection', 'calm'],
      created_at: '2026-08-13T20:00:00Z',
      updated_at: '2026-08-13T20:00:00Z',
    };

    const parsed = journalResponseSchema.parse(raw);

    expect(parsed.id).toBe('journal-123');
    expect(parsed.title).toBe('Deep Reflection');
    expect(parsed.content_json).toEqual(raw.content_json);
    expect(parsed.content_text).toBe('Evening Thoughts\nFeeling calm.');
    expect(parsed.tags).toEqual(['reflection', 'calm']);
  });

  it('provides default content_json and empty content_text when optional fields are omitted', () => {
    const raw = {
      id: 'journal-456',
      title: 'Quick Note',
      tags: [],
      created_at: '2026-08-13T20:00:00Z',
      updated_at: '2026-08-13T20:00:00Z',
    };

    const parsed = journalResponseSchema.parse(raw);

    expect(parsed.content_json).toEqual({ type: 'doc', content: [] });
    expect(parsed.content_text).toBe('');
  });
});
