import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JournalEntry } from '@/types';
import { api, journalListResponseSchema, journalResponseSchema, type JournalResponse } from '@utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useRef } from 'react';
import { getUnsyncedEntries, removeUnsyncedEntry } from '@utils/offlineStorage';
import { getAuthSession, isCurrentAuthSession } from '@utils/authSession';

const QUERY_KEY = ['journals'] as const;
const PAGE_SIZE = 20;

function mapEntry(item: JournalResponse): JournalEntry {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    tags: item.tags,
    date: new Date(item.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    created_at: item.created_at,
  };
}

export const useJournalEntries = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const entryInFlightRef = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/journals?page_size=${PAGE_SIZE}&cursor=${encodeURIComponent(pageParam)}`
        : `/journals?page_size=${PAGE_SIZE}`;
      const response = await api.get(url, journalListResponseSchema);
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: isAuthenticated && !authLoading,
    staleTime: 30_000,
  });

  const entries: JournalEntry[] = (query.data?.pages ?? [])
    .flatMap(page => page.items.map(mapEntry));

  const createMutation = useMutation({
    mutationFn: (entry: Omit<JournalEntry, 'id'>) =>
      api.post('/journals', { title: entry.title, content: entry.content, tags: entry.tags, created_at: entry.created_at }, journalResponseSchema),
    onMutate: async (_newEntry) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousData = queryClient.getQueryData<typeof query.data>(QUERY_KEY);
      return { previousData };
    },
    onError: (_err, _newEntry, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, content, tags, created_at }: Partial<JournalEntry> & { id: number | string }) =>
      api.put(`/journals/${id}`, { title, content, tags, created_at }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => api.delete(`/journals/${id}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {});
    },
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

  const syncUnsyncedEntries = useCallback(async (onIdMigrate?: (oldId: string | number, newId: string | number) => void) => {
    if (syncInFlightRef.current) return syncInFlightRef.current;
    const session = getAuthSession();
    if (session.generation === 0) return;

    const run = (async () => {
    const unsynced = getUnsyncedEntries();
    const ids = Object.keys(unsynced);
    if (ids.length === 0) return;

    for (const id of ids) {
      if (!isCurrentAuthSession(session)) break;
      if (entryInFlightRef.current.has(id.toString())) continue;
      const entry = unsynced[id];
      entryInFlightRef.current.add(id.toString());
      try {
        if (id.toString().startsWith('draft-')) {
          // Create new entry on the backend
          const created = await api.post('/journals', {
            title: entry.title,
            content: entry.content,
            tags: entry.tags,
            created_at: entry.created_at,
          }, journalResponseSchema);
          
          if (!isCurrentAuthSession(session)) break;
          removeUnsyncedEntry(id);
          if (onIdMigrate && isCurrentAuthSession(session)) {
            onIdMigrate(id, created.id);
          }
        } else {
          // Update existing entry
          await updateMutation.mutateAsync({
            id,
            title: entry.title,
            content: entry.content,
            tags: entry.tags,
            created_at: entry.created_at,
          });
          if (isCurrentAuthSession(session)) removeUnsyncedEntry(id);
        }
      } catch (error) {
        console.error(`Failed to sync entry ${id}:`, error);
      } finally {
        entryInFlightRef.current.delete(id.toString());
      }
    }
    if (isCurrentAuthSession(session)) queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {});
    })();
    syncInFlightRef.current = run;
    try { await run; } finally { if (syncInFlightRef.current === run) syncInFlightRef.current = null; }
  }, [updateMutation, queryClient]);

  return {
    entries,
    loading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    addEntry,
    updateEntry,
    deleteEntry,
    syncUnsyncedEntries,
    refreshEntries: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {}); },
  };
};
