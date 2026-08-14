import { useState, useRef, useEffect, useCallback } from 'react';
import { JournalEntry } from '@/types';
import { isEntryUnsynced, saveUnsyncedEntry, removeUnsyncedEntry } from '@utils/offlineStorage';

export type SaveStatus = 'error' | 'unsynced' | null;

interface UseJournalAutosaveParams {
  entry: JournalEntry;
  isNew: boolean;
  title: string;
  content: string;
  contentJson: unknown;
  editor: any;
  allTags: string[];
  entryDate: string;
  onCreate?: (title: string, content: string, tags: string[], created_at?: string, content_json?: unknown) => Promise<number | string>;
  onUpdate?: (updates: Partial<JournalEntry>) => void;
  onUpdateById?: (id: string | number, updates: Partial<JournalEntry>) => Promise<void>;
}

function isRealId(v: string | number | null): boolean {
  return v !== null && v !== 'pending' && !v.toString().startsWith('draft-');
}

export function useJournalAutosave({
  entry,
  isNew,
  title,
  content,
  contentJson,
  editor,
  allTags,
  entryDate,
  onCreate,
  onUpdate,
  onUpdateById,
}: UseJournalAutosaveParams) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => {
    return isEntryUnsynced(entry.id) ? 'unsynced' : null;
  });

  const entryIdRef = useRef<string | number | null>(isNew ? null : entry.id);
  const creationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creationPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    const handleIdMigrated = (e: Event) => {
      const { oldId, newId } = (e as CustomEvent).detail;
      const currentActiveId = isNew ? entryIdRef.current : entry.id;
      if (currentActiveId === oldId) {
        entryIdRef.current = newId;
      }
    };
    window.addEventListener('journal:id-migrated', handleIdMigrated);
    return () => window.removeEventListener('journal:id-migrated', handleIdMigrated);
  }, [entry.id, isNew]);

  useEffect(() => {
    if (saveStatus === 'unsynced' && !isEntryUnsynced(entry.id)) {
      setSaveStatus(null);
    }
  }, [entry.id, saveStatus]);

  const save = useCallback(async (customTags?: string[]) => {
    if (creationPromiseRef.current) {
      try {
        await creationPromiseRef.current;
      } catch {}
    }

    const isoDate = entryDate ? new Date(entryDate).toISOString() : undefined;
    const currentJson = editor ? editor.getJSON() : contentJson;
    const draftCheckId = entryIdRef.current;
    const targetTags = customTags || allTags;

    if (isNew && (draftCheckId === null || draftCheckId === undefined)) {
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      const hasContentToSave = trimmedTitle !== '' || trimmedContent !== '' || targetTags.length > 0;
      if (!hasContentToSave) return;

      entryIdRef.current = 'pending';

      creationPromiseRef.current = (async () => {
        try {
          const id = await onCreate!(trimmedTitle, trimmedContent, targetTags, isoDate, currentJson);
          entryIdRef.current = id;
          return id;
        } catch {
          const tempId = `draft-${Date.now()}`;
          entryIdRef.current = tempId;
          const updatedEntry: JournalEntry = {
            id: tempId,
            title: trimmedTitle,
            content: trimmedContent,
            content_json: currentJson,
            tags: targetTags,
            created_at: isoDate,
            date: entryDate || new Date().toLocaleString(),
          };
          saveUnsyncedEntry(updatedEntry);
          setSaveStatus('unsynced');

          if (onUpdateById) {
            await onUpdateById(tempId, updatedEntry);
          }
          return tempId;
        } finally {
          creationPromiseRef.current = null;
        }
      })();

      await creationPromiseRef.current;
      return;
    }

    if (draftCheckId === 'pending') {
      return;
    }

    if (draftCheckId && draftCheckId.toString().startsWith('draft-')) {
      const updatedEntry: JournalEntry = {
        id: draftCheckId,
        title: title.trim(),
        content: content.trim(),
        content_json: currentJson,
        tags: targetTags,
        created_at: isoDate,
        date: entryDate || new Date().toLocaleString(),
      };
      saveUnsyncedEntry(updatedEntry);
      setSaveStatus('unsynced');
      return;
    }

    const currentActiveId = isNew ? entryIdRef.current : entry.id;
    if (isRealId(currentActiveId)) {
      const realId = currentActiveId as string | number;
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      try {
        if (onUpdateById) {
          await onUpdateById(realId, {
            title: trimmedTitle,
            content_json: currentJson,
            content: trimmedContent,
            tags: targetTags,
            created_at: isoDate
          });
        } else if (onUpdate) {
          await onUpdate({
            title: trimmedTitle,
            content_json: currentJson,
            content: trimmedContent,
            tags: targetTags,
            created_at: isoDate
          });
        }
        removeUnsyncedEntry(realId);
      } catch {
        const updatedEntry: JournalEntry = {
          id: realId,
          title: trimmedTitle,
          content: trimmedContent,
          content_json: currentJson,
          tags: targetTags,
          created_at: isoDate,
          date: entryDate || new Date().toLocaleString(),
        };
        saveUnsyncedEntry(updatedEntry);
        setSaveStatus('unsynced');
      }
      return;
    }
  }, [isNew, title, content, contentJson, editor, allTags, entryDate, entry, onCreate, onUpdate, onUpdateById]);

  const handleRetry = useCallback(async () => {
    if (isNew && entryIdRef.current?.toString().startsWith('draft-')) {
      entryIdRef.current = null;
    }
    await save();
  }, [isNew, save]);

  const persistLocally = useCallback(() => {
    const id = isNew ? entryIdRef.current : entry.id;
    if (!id || id === 'pending') return;

    const isoDate = entryDate ? new Date(entryDate).toISOString() : undefined;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const currentJson = editor ? editor.getJSON() : contentJson;
    const dateChanged = !isNew && isoDate
      ? !entry.created_at || Math.abs(new Date(isoDate).getTime() - new Date(entry.created_at).getTime()) > 1000
      : false;
    const hasChanges = isNew
      ? trimmedTitle !== '' || trimmedContent !== '' || allTags.length > 0
      : trimmedTitle !== entry.title ||
        trimmedContent !== entry.content ||
        JSON.stringify(allTags) !== JSON.stringify(entry.tags) ||
        dateChanged;
    if (!hasChanges) return;

    saveUnsyncedEntry({
      ...(isNew ? {} : entry),
      id,
      title: trimmedTitle,
      content: trimmedContent,
      content_json: currentJson,
      tags: allTags,
      created_at: isoDate || entry.created_at,
      date: entryDate || entry.date,
    });
  }, [isNew, title, content, contentJson, editor, allTags, entryDate, entry]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (isNew && entryIdRef.current === null) {
      if (title.trim() || content.trim()) {
        if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
        creationTimerRef.current = setTimeout(() => saveRef.current(), 600);
      }
      return () => {
        if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
      };
    }

    const timer = setTimeout(() => saveRef.current(), 1200);
    return () => clearTimeout(timer);
  }, [title, content, contentJson, isNew]);

  useEffect(() => {
    const handleBeforeUnload = () => { persistLocally(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') persistLocally();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [persistLocally]);

  useEffect(() => {
    return () => {
      if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
    };
  }, []);

  return {
    saveStatus,
    save,
    handleRetry,
    persistLocally,
  };
}
