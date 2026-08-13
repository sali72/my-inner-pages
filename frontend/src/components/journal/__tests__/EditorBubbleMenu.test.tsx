import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorBubbleMenu } from '../EditorBubbleMenu';
import type { Editor } from '@tiptap/core';

describe('EditorBubbleMenu Rich Text Toolbar', () => {
  let mockEditor: Partial<Editor>;
  let mockChain: any;

  beforeEach(() => {
    mockChain = {
      toggleBold: vi.fn().mockReturnThis(),
      toggleItalic: vi.fn().mockReturnThis(),
      toggleStrike: vi.fn().mockReturnThis(),
      toggleCode: vi.fn().mockReturnThis(),
      toggleHeading: vi.fn().mockReturnThis(),
      toggleBlockquote: vi.fn().mockReturnThis(),
      toggleBulletList: vi.fn().mockReturnThis(),
      toggleOrderedList: vi.fn().mockReturnThis(),
      unsetAllMarks: vi.fn().mockReturnThis(),
      clearNodes: vi.fn().mockReturnThis(),
      focus: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    };

    mockEditor = {
      chain: () => mockChain,
      isActive: vi.fn().mockReturnValue(false),
      registerPlugin: vi.fn(),
      unregisterPlugin: vi.fn(),
    };
  });

  it('renders all rich text formatting buttons', () => {
    render(<EditorBubbleMenu editor={mockEditor as Editor} />);

    expect(screen.getByTitle(/Bold/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Strikethrough/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Inline Code/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 1/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 2/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Quote/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Bullet List/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Numbered List/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Clear Formatting/i)).toBeInTheDocument();
  });

  it('executes inline formatting toggle (Bold, Italic, Strikethrough, Code)', () => {
    render(<EditorBubbleMenu editor={mockEditor as Editor} />);

    fireEvent.mouseDown(screen.getByTitle(/Bold/i));
    expect(mockChain.toggleBold).toHaveBeenCalled();
    expect(mockChain.focus).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTitle(/Italic/i));
    expect(mockChain.toggleItalic).toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTitle(/Strikethrough/i));
    expect(mockChain.toggleStrike).toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTitle(/Inline Code/i));
    expect(mockChain.toggleCode).toHaveBeenCalled();
  });

  it('executes block formatting toggles (Headings, Blockquote, Lists)', () => {
    render(<EditorBubbleMenu editor={mockEditor as Editor} />);

    fireEvent.mouseDown(screen.getByTitle(/Heading 1/i));
    expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 1 });

    fireEvent.mouseDown(screen.getByTitle(/Heading 2/i));
    expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 2 });

    fireEvent.mouseDown(screen.getByTitle(/Quote/i));
    expect(mockChain.toggleBlockquote).toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTitle(/Bullet List/i));
    expect(mockChain.toggleBulletList).toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTitle(/Numbered List/i));
    expect(mockChain.toggleOrderedList).toHaveBeenCalled();
  });

  it('executes clear formatting action on button click', () => {
    render(<EditorBubbleMenu editor={mockEditor as Editor} />);

    fireEvent.mouseDown(screen.getByTitle(/Clear Formatting/i));
    expect(mockChain.unsetAllMarks).toHaveBeenCalled();
    expect(mockChain.clearNodes).toHaveBeenCalled();
    expect(mockChain.focus).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });
});
