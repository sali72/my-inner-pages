import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JournalPage } from '../JournalPage';
import { JournalTimeline } from '../JournalTimeline';
import { JournalEntry, JOURNAL_TITLE_MAX_LENGTH } from '@/types';

const mockTitleText = {
  value: '',
  toString() { return this.value; },
  insert(_idx: number, text: string) { this.value = text; },
  delete() { this.value = ''; },
  length: 0,
};

const mockYdoc = {
  getText: () => mockTitleText,
  getXmlFragment: () => ({ length: 0 }),
  transact: (fn: () => void) => fn(),
};

vi.mock('@hooks/useJournalDoc', () => ({
  useJournalDoc: () => ({
    ydoc: mockYdoc,
    isLoaded: true,
  }),
}));

vi.mock('@hooks/useJournalAutosave', () => ({
  useJournalAutosave: () => ({
    saveStatus: null,
    save: vi.fn(),
    handleRetry: vi.fn(),
    persistLocally: vi.fn(),
  }),
}));

vi.mock('@tiptap/react', () => ({
  useEditor: () => ({
    getJSON: () => ({ type: 'doc', content: [] }),
    getText: () => '',
    getHTML: () => '<p></p>',
    commands: { setContent: vi.fn() },
    isDestroyed: false,
    view: { dom: document.createElement('div') },
  }),
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('../EditorBubbleMenu', () => ({
  EditorBubbleMenu: () => null,
}));

vi.mock('../JournalAutoTagDropdown', () => ({
  JournalAutoTagDropdown: () => null,
}));

describe('Journal Title Handling & Best Practices', () => {
  const mockEntry: JournalEntry = {
    id: 'entry-1',
    title: 'Initial Title',
    content: 'Some content',
    tags: ['test'],
    date: 'August 31, 2026',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTitleText.value = '';
  });

  describe('JournalPage Title Input & Character Counter', () => {
    it('enforces maxLength on title input element', () => {
      render(
        <JournalPage
          entry={mockEntry}
          font="serif"
          fontSize="medium"
          onDelete={vi.fn()}
          onChat={vi.fn()}
          onBack={vi.fn()}
        />
      );

      const titleInput = screen.getByPlaceholderText('Title...') as HTMLInputElement;
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.maxLength).toBe(JOURNAL_TITLE_MAX_LENGTH);
    });

    it('sanitizes newlines from pasted title and clamps to max length', () => {
      render(
        <JournalPage
          entry={{ ...mockEntry, title: '' }}
          font="serif"
          fontSize="medium"
          onDelete={vi.fn()}
          onChat={vi.fn()}
          onBack={vi.fn()}
        />
      );

      const titleInput = screen.getByPlaceholderText('Title...') as HTMLInputElement;
      const longMultilineTitle = 'Line 1\nLine 2\r\n' + 'X'.repeat(250);

      fireEvent.paste(titleInput, {
        clipboardData: {
          getData: () => longMultilineTitle,
        },
      });

      expect(titleInput.value).not.toContain('\n');
      expect(titleInput.value.length).toBe(JOURNAL_TITLE_MAX_LENGTH);
      expect(titleInput.value.slice(0, 14)).toBe('Line 1 Line 2 ');
    });
  });

  describe('JournalTimeline Title Layout & Modal Truncation', () => {
    it('renders card title with break-words class', () => {
      const longTitle = 'SuperLongWordWithoutSpaces'.repeat(5);
      const testEntries: JournalEntry[] = [
        {
          id: 'long-1',
          title: longTitle,
          content: 'Some note text',
          tags: [],
          date: 'August 31, 2026',
        },
      ];

      render(
        <JournalTimeline
          entries={testEntries}
          allTags={[]}
          tagColorMap={{}}
          font="serif"
          fontSize="medium"
          searchQuery=""
          selectedTags={[]}
          tagMode="or"
          sortBy="date-desc"
          showFilters={false}
          onSearchChange={vi.fn()}
          onTagToggle={vi.fn()}
          onTagModeChange={vi.fn()}
          onSortByChange={vi.fn()}
          onFilterToggle={vi.fn()}
          onClearFilters={vi.fn()}
          onManageTags={vi.fn()}
          onSelectEntry={vi.fn()}
          onNewEntry={vi.fn()}
          onStartChat={vi.fn()}
          onDeleteEntry={vi.fn()}
          isLoadingMore={false}
          hasMore={false}
          onLoadMore={vi.fn()}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading.className).toContain('break-words');
    });
  });
});
