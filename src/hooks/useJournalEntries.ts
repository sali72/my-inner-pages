import { useState, useEffect } from 'react';
import { JournalEntry } from '@types/index';
import { api } from '@utils/api';

interface BackendJournal {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const useJournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries from backend on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ items: BackendJournal[] }>('/api/v0/journals');
      const mappedEntries: JournalEntry[] = response.items.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        tags: item.tags,
        date: new Date(item.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }));
      setEntries(mappedEntries);
    } catch (error) {
      console.error('Failed to load journals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    try {
      const response = await api.post<BackendJournal>('/api/v0/journals', {
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
      });

      const newEntry: JournalEntry = {
        id: response.id,
        title: response.title,
        content: response.content,
        tags: response.tags,
        date: new Date(response.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      setEntries([...entries, newEntry]);
      return newEntry;
    } catch (error) {
      console.error('Failed to create journal:', error);
      throw error;
    }
  };

  const updateEntry = async (id: number | string, updates: Partial<JournalEntry>) => {
    try {
      await api.put(`/api/v0/journals/${id}`, {
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
      });

      setEntries(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    } catch (error) {
      console.error('Failed to update journal:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: number | string) => {
    try {
      await api.delete(`/api/v0/journals/${id}`);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete journal:', error);
      throw error;
    }
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: loadEntries,
  };
};
