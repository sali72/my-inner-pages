import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api, tagListResponseSchema, tagResponseSchema, TagResponse } from '@utils/api';

const ALL_TAGS_KEY = ['tags', 'all'] as const;
const JOURNALS_KEY = ['journals'] as const;

export function useAllTags() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ALL_TAGS_KEY,
    queryFn: async () => {
      const response = await api.get('/tags/all', tagListResponseSchema);
      return response.tags;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useRenameTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      await api.put(`/tags/${encodeURIComponent(oldName)}`, { new_name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: JOURNALS_KEY });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await api.delete(`/tags/${encodeURIComponent(name)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: JOURNALS_KEY });
    },
  });
}

export function useUpdateTagColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string | null }) => {
      const body: Record<string, unknown> = {};
      if (color !== null) body.color = color;
      return api.patch(`/tags/${encodeURIComponent(name)}`, body, tagResponseSchema);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TAGS_KEY });
    },
  });
}
