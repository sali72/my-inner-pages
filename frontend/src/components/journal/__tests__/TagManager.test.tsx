import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagManager } from '../TagManager';
import { useAllTags, useRenameTag, useDeleteTag, useUpdateTagColor } from '@hooks/useTags';

vi.mock('@hooks/useTags', () => ({
  useAllTags: vi.fn(),
  useRenameTag: vi.fn(),
  useDeleteTag: vi.fn(),
  useUpdateTagColor: vi.fn(),
}));

describe('TagManager Component', () => {
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
      data: [{ name: 'work', usage_count: 5, color: '#3498db' }],
      refetch: mockRefetch,
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<TagManager isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('renders tags and triggers refetch when isOpen is true', () => {
    render(<TagManager isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
