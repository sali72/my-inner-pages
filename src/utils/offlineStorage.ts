import { JournalEntry } from '@/types';

const STORAGE_KEY = 'my-inner-pages-unsynced-journals';

export function getUnsyncedEntries(): Record<string | number, JournalEntry> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to parse unsynced journals:', e);
    return {};
  }
}

export function saveUnsyncedEntry(entry: JournalEntry): void {
  try {
    const current = getUnsyncedEntries();
    current[entry.id] = {
      ...entry,
      created_at: entry.created_at || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save unsynced journal:', e);
  }
}

export function removeUnsyncedEntry(id: string | number): void {
  try {
    const current = getUnsyncedEntries();
    delete current[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to remove unsynced journal:', e);
  }
}

export function isEntryUnsynced(id: string | number): boolean {
  const current = getUnsyncedEntries();
  return !!current[id];
}
