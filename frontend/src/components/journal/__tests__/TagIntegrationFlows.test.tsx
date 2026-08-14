import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { JournalView } from '../JournalView';
import { JournalEntry } from '@/types';
import { useAllTags, useRenameTag, useDeleteTag, useUpdateTagColor } from '@hooks/useTags';
import * as Y from 'yjs';

vi.mock('@hooks/useTags', () => ({
  useAllTags: vi.fn(),
  useRenameTag: vi.fn(),
  useDeleteTag: vi.fn(),
  useUpdateTagColor: vi.fn(),
}));

const ydocMap = new Map<any, Y.Doc>();

vi.mock('@hooks/useJournalDoc', () => ({
  useJournalDoc: vi.fn().mockImplementation((id: any) => {
    if (!ydocMap.has(id)) {
      ydocMap.set(id, new Y.Doc());
    }
    return {
      ydoc: ydocMap.get(id)!,
      isLoaded: true,
    };
  }),
}));

// Helper component wrapping JournalView with real state to simulate multi-step navigation
const TestJournalContainer = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      title: 'First Reflection',
      content: 'Writing about #work and life.',
      tags: ['work'],
      date: 'August 14, 2026',
      created_at: '2026-08-14T10:00:00Z',
    },
    {
      id: 2,
      title: 'Second Entry',
      content: 'Just relaxing.',
      tags: ['personal'],
      date: 'August 14, 2026',
      created_at: '2026-08-14T11:00:00Z',
    },
  ]);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  React.useEffect(() => {
    const handleTagUpdated = (e: Event) => {
      const { action, oldName } = (e as CustomEvent).detail;
      if (action === 'delete' && oldName) {
        const lowerOld = oldName.toLowerCase();
        setEntries(prev => prev.map(entry => ({
          ...entry,
          tags: entry.tags?.filter(t => t.toLowerCase() !== lowerOld),
          content: entry.content.replace(new RegExp(`#${lowerOld}`, 'gi'), oldName),
        })));
      }
    };
    window.addEventListener('journal:tag-updated', handleTagUpdated);
    return () => window.removeEventListener('journal:tag-updated', handleTagUpdated);
  }, []);

  const handleUpdate = async (id: number | string, updates: Partial<JournalEntry>) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const handleSaveNew = async (title: string, content: string, tags: string[], created_at?: string) => {
    const newId = Date.now();
    const newEntry: JournalEntry = {
      id: newId,
      title,
      content,
      tags,
      date: 'August 14, 2026',
      created_at,
    };
    setEntries(prev => [newEntry, ...prev]);
    return newId;
  };

  return (
    <JournalView
      entries={entries}
      font="sans"
      fontSize="medium"
      isLoadingMore={false}
      hasMore={false}
      onLoadMore={vi.fn()}
      onUpdateEntry={handleUpdate}
      onDeleteEntry={vi.fn()}
      onSaveNewEntry={handleSaveNew}
      onStartChat={vi.fn()}
      selectedEntryId={selectedId}
      onSelectEntry={(id) => setSelectedId(id)}
    />
  );
};

describe('Tag System End-to-End Integration Flows', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRenameTag as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useDeleteTag as any).mockReturnValue({
      mutateAsync: vi.fn().mockImplementation(async (tagName) => {
        window.dispatchEvent(new CustomEvent('journal:tag-updated', {
          detail: { action: 'delete', oldName: tagName },
        }));
      }),
    });
    (useUpdateTagColor as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useAllTags as any).mockReturnValue({
      data: [
        { name: 'work', usage_count: 1, color: '#3498db' },
        { name: 'personal', usage_count: 1, color: '#2ecc71' },
      ],
      refetch: mockRefetch,
    });
  });

  it('persists a new tag typed in an entry when clicking back navigation, across entry re-opening', async () => {
    render(<TestJournalContainer />);

    // 1. Verify timeline shows initial entries
    expect(screen.getByText('First Reflection')).toBeInTheDocument();
    expect(screen.getByText('Second Entry')).toBeInTheDocument();

    // 2. Click into 'Second Entry'
    fireEvent.click(screen.getByText('Second Entry'));
    expect(screen.getByPlaceholderText('Title...')).toBeInTheDocument();

    // 3. Click '+' button to show tag input
    const plusButton = screen.getByRole('button', { name: '' }); // + button
    fireEvent.click(plusButton);

    const tagInput = screen.getByPlaceholderText('Tag');
    expect(tagInput).toBeInTheDocument();

    // 4. Type 'mobile-tag' into the input WITHOUT hitting Enter
    fireEvent.change(tagInput, { target: { value: 'mobile-tag' } });

    // 5. Click Back navigation button (<)
    const backButton = screen.getByRole('button', { name: 'Back to journal' });
    fireEvent.click(backButton);

    // 6. Assert Timeline view now displays 'Second Entry' with '#mobile-tag' tag pill
    await waitFor(() => {
      expect(screen.getByText('Second Entry')).toBeInTheDocument();
    });

    expect(screen.getAllByText('mobile-tag').length).toBeGreaterThan(0);

    // 7. Click back into 'Second Entry' to verify persistence
    fireEvent.click(screen.getByText('Second Entry'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Title...')).toBeInTheDocument();
    });

    // CRITICAL ASSERTION: '#mobile-tag' MUST STILL BE THERE inside the entry header!
    expect(screen.getByText('#mobile-tag')).toBeInTheDocument();

    // 8. Click Back navigation again to confirm it persists permanently
    const backButton2 = screen.getByRole('button', { name: 'Back to journal' });
    fireEvent.click(backButton2);

    await waitFor(() => {
      expect(screen.getByText('Second Entry')).toBeInTheDocument();
    });
    expect(screen.getAllByText('mobile-tag').length).toBeGreaterThan(0);
  });

  it('deletes tag via Manage Tags event, removing it from timeline and reopening entry without reappearing', async () => {
    render(<TestJournalContainer />);

    // 1. Initially timeline shows 'First Reflection' with tag 'work'
    expect(screen.getAllByText('work').length).toBeGreaterThan(0);

    // 2. Dispatch tag delete event for 'work' inside act()
    act(() => {
      (useAllTags as any).mockReturnValue({
        data: [{ name: 'personal', usage_count: 1, color: '#2ecc71' }],
        refetch: mockRefetch,
      });
      window.dispatchEvent(new CustomEvent('journal:tag-updated', {
        detail: { action: 'delete', oldName: 'work' },
      }));
    });

    // 3. Open 'First Reflection' entry
    fireEvent.click(screen.getByText('First Reflection'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Title...')).toBeInTheDocument();
    });

    // 4. Assert header tag 'work' is NOT present in explicit tags pill
    const explicitTagPill = screen.queryByRole('button', { name: 'Remove tag work' });
    expect(explicitTagPill).not.toBeInTheDocument();

    // 5. Navigate back to timeline
    const backButton = screen.getByRole('button', { name: 'Back to journal' });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('First Reflection')).toBeInTheDocument();
    });

    // 6. Assert 'work' tag is GONE from timeline
    expect(screen.queryByText('work')).not.toBeInTheDocument();
  });
});
