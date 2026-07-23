import { useEffect, useRef } from 'react';

interface UseBackgroundSyncOptions {
  isAuthenticated: boolean;
  syncUnsyncedEntries: (onIdMigrate?: (oldId: string | number, newId: string | number) => void) => Promise<void>;
  navigate: (params: { selectedEntryId?: string | number | null }, action?: 'replace') => void;
}

export function useBackgroundSync({ isAuthenticated, syncUnsyncedEntries, navigate }: UseBackgroundSyncOptions) {
  const syncCancelRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    syncCancelRef.current = false;

    const handleIdMigrate = (oldId: string | number, newId: string | number) => {
      const entryParam = new URLSearchParams(window.location.search).get('entry');
      if (entryParam === oldId.toString()) {
        navigate({ selectedEntryId: newId }, 'replace');
      }
      window.dispatchEvent(new CustomEvent('journal:id-migrated', {
        detail: { oldId, newId }
      }));
    };

    const guardedSync = () => {
      if (syncCancelRef.current) return;
      syncUnsyncedEntries(handleIdMigrate);
    };

    guardedSync();

    window.addEventListener('online', guardedSync);
    window.addEventListener('focus', guardedSync);

    const interval = setInterval(() => {
      if (navigator.onLine && !syncCancelRef.current) {
        guardedSync();
      }
    }, 30000);

    return () => {
      syncCancelRef.current = true;
      window.removeEventListener('online', guardedSync);
      window.removeEventListener('focus', guardedSync);
      clearInterval(interval);
    };
  }, [isAuthenticated, syncUnsyncedEntries, navigate]);
}
