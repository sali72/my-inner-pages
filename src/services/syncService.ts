import { api } from '@utils/api';
import { journalResponseSchema } from '@/types/schemas';
import { getUnsyncedEntries, removeUnsyncedEntry } from '@utils/offlineStorage';
import { getAuthSession, isCurrentAuthSession } from '@utils/authSession';

export async function syncUnsyncedEntries(
  onIdMigrate?: (oldId: string | number, newId: string | number) => void,
  onSyncComplete?: () => void,
): Promise<void> {
  const session = getAuthSession();
  if (session.generation === 0) return;

  const unsynced = getUnsyncedEntries();
  const ids = Object.keys(unsynced);
  if (ids.length === 0) return;

  const inFlight = new Set<string>();

  for (const id of ids) {
    if (!isCurrentAuthSession(session)) break;
    if (inFlight.has(id.toString())) continue;
    const entry = unsynced[id];
    inFlight.add(id.toString());
    try {
      if (id.toString().startsWith('draft-')) {
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
        await api.put(`/journals/${id}`, {
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
      inFlight.delete(id.toString());
    }
  }
  onSyncComplete?.();
}
