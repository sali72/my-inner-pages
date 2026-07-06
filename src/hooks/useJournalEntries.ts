import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JournalEntry } from '@/types';
import { api, journalListResponseSchema, journalResponseSchema, type JournalResponse } from '@utils/api';
import { useAuth } from '@/contexts/AuthContext';

const QUERY_KEY = ['journals'] as const;

function mapEntry(item: JournalResponse): JournalEntry {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    tags: item.tags,
    date: new Date(item.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    created_at: item.created_at,
  };
}

export const useJournalEntries = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get('/journals', journalListResponseSchema);
      return response.items
        .map(mapEntry)
        .sort(
          (a, b) =>
            new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime(),
        );
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (entry: Omit<JournalEntry, 'id'>) =>
      api.post('/journals', { title: entry.title, content: entry.content, tags: entry.tags, created_at: entry.created_at }, journalResponseSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, content, tags, created_at }: Partial<JournalEntry> & { id: number | string }) =>
      api.put(`/journals/${id}`, { title, content, tags, created_at }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => api.delete(`/journals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const addEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const created = await createMutation.mutateAsync(entry);
    return mapEntry(created);
  };

  const updateEntry = async (id: number | string, updates: Partial<JournalEntry>) => {
    await updateMutation.mutateAsync({ id, ...updates });
  };

  const deleteEntry = async (id: number | string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    entries: data ?? [],
    loading: isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  };
};
