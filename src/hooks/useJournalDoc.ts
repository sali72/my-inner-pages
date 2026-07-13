import { useEffect, useState, useMemo, useRef } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

interface UseJournalDocResult {
  ydoc: Y.Doc;
  isLoaded: boolean;
}

export function useJournalDoc(
  entryId: string | number,
  initialTitle: string
): UseJournalDocResult {
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep initialTitle in a ref to avoid triggering effect cleanups on title updates
  const initialTitleRef = useRef(initialTitle);
  useEffect(() => {
    initialTitleRef.current = initialTitle;
  }, [initialTitle]);

  // Create a stable Y.Doc instance for the entire lifecycle of this editor component.
  // Using an empty dependency array ensures the Y.Doc is never recreated, preventing Tiptap remounts.
  const ydoc = useMemo(() => new Y.Doc(), []);

  useEffect(() => {
    setIsLoaded(false);

    const dbName = `my-inner-pages-journal-${entryId}`;
    const persistence = new IndexeddbPersistence(dbName, ydoc);

    const handleSynced = () => {
      const titleText = ydoc.getText('title');
      const hasLocalTitle = titleText.length > 0;

      if (!hasLocalTitle && initialTitleRef.current) {
        ydoc.transact(() => {
          titleText.insert(0, initialTitleRef.current);
        });
      }

      setIsLoaded(true);
    };

    if (persistence.synced) {
      handleSynced();
    } else {
      persistence.on('synced', handleSynced);
    }

    return () => {
      persistence.off('synced', handleSynced);
      persistence.destroy();
    };
  }, [ydoc, entryId]);

  return { ydoc, isLoaded };
}
