import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoveriesView } from '../DiscoveriesView';
import { api } from '@/utils/api';
import { DiscoveriesPayload } from '@/types/discoveries';

vi.mock('@/utils/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('DiscoveriesView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then empty journey state', async () => {
    const mockEmptyPayload: DiscoveriesPayload = {
      status: 'ok',
      journey: {
        status: 'empty',
        totalEntries: 2,
        totalWords: 150,
        firstEntryDate: '2026-08-01',
        lastEntryDate: '2026-08-05',
        modelVersion: 0,
      },
      patterns: [],
      activeThemes: [],
      moments: [
        {
          id: 'first_entry',
          type: 'first_entry',
          date: '2026-08-01',
          title: 'You began your journal',
          description: 'Your sanctuary journey began.',
        },
      ],
    };

    (api.get as any).mockResolvedValueOnce(mockEmptyPayload);

    render(<DiscoveriesView onStartChat={vi.fn()} />);

    expect(screen.getByText('Reading your pages...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/As you write, the picture will start to form/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/2 entries/i)).toBeInTheDocument();
    expect(screen.getByText(/You began your journal/i)).toBeInTheDocument();
  });

  it('renders active state with pattern cards and triggers onStartChat on Explore this click', async () => {
    const onStartChatMock = vi.fn();
    const mockActivePayload: DiscoveriesPayload = {
      status: 'ok',
      journey: {
        status: 'active',
        totalEntries: 25,
        totalWords: 4500,
        firstEntryDate: '2026-07-01',
        lastEntryDate: '2026-08-30',
        lastModelUpdate: '2026-08-30T10:00:00Z',
        modelVersion: 3,
      },
      patterns: [
        {
          id: 'p1',
          description: 'In your writing, you often explore quiet sensory moments.',
          evidence: 'Observations across recent entries',
          excerpts: [
            {
              entryId: 'e123',
              quote: 'I felt peaceful walking in the morning sun.',
              entryDate: '2026-08-25',
            },
          ],
        },
      ],
      activeThemes: ['mindfulness', 'morning rituals'],
      moments: [
        {
          id: 'm1',
          type: 'first_entry',
          date: '2026-07-01',
          title: 'You began your journal',
          description: 'First steps.',
        },
      ],
    };

    (api.get as any).mockResolvedValueOnce(mockActivePayload);

    render(<DiscoveriesView onStartChat={onStartChatMock} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Here is what your writing has shown so far/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('In your writing, you often explore quiet sensory moments.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/"I felt peaceful walking in the morning sun."/)
    ).toBeInTheDocument();
    expect(screen.getByText('mindfulness')).toBeInTheDocument();

    const exploreButton = screen.getByRole('button', { name: /Explore this/i });
    fireEvent.click(exploreButton);

    expect(onStartChatMock).toHaveBeenCalledTimes(1);
    expect(onStartChatMock).toHaveBeenCalledWith(
      'In your writing, you often explore quiet sensory moments.',
      [
        {
          entryId: 'e123',
          quote: 'I felt peaceful walking in the morning sun.',
          entryDate: '2026-08-25',
        },
      ]
    );
  });
});
