import { useState } from 'react';
import { JournalEntry } from '@types/index';
import { INITIAL_ENTRIES } from '@constants/initialEntries';

export const useJournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);

  const addEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: entries.length + 1,
    };
    setEntries([...entries, newEntry]);
    return newEntry;
  };

  const updateEntry = (id: number | string, updates: Partial<JournalEntry>) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteEntry = (id: number | string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
  };
};
