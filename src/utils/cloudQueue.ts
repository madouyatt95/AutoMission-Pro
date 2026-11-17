import { supabase } from './supabase';
import { getLocalDatabase, type CloudChange } from './localDatabase';

type NewCloudChange = Omit<CloudChange, 'key' | 'version' | 'queuedAt'>;
let revision = 0;
let draining: Promise<void> | undefined;

export function getCloudRevision() {
  return revision;
}

export async function enqueueCloudChange(change: NewCloudChange) {
  revision += 1;
  const db = await getLocalDatabase();
  const key = `${change.table}:${change.id}`;
  const tx = db.transaction('outbox', 'readwrite');
  const current = await tx.store.get(key);
  // A legacy import must not replace an edit or deletion already queued by
  // the user while that import is running.
  if (!change.ignoreDuplicates || !current || current.ignoreDuplicates) await tx.store.put({
    ...change,
    key,
    version: crypto.randomUUID(),
    queuedAt: Date.now(),
  });
  await tx.done;
}

async function drain() {
  const db = await getLocalDatabase();
  for (;;) {
    const changes = (await db.getAll('outbox')).sort((a, b) => a.queuedAt - b.queuedAt);
    if (changes.length === 0) return;

    for (const change of changes) {
      const result = change.operation === 'delete'
        ? await supabase.from(change.table).delete().eq('id', change.id)
        : await supabase.from(change.table).upsert(change.data!, {
          onConflict: 'id', ignoreDuplicates: change.ignoreDuplicates ?? false,
        });
      if (result.error) throw result.error;

      // An edit can be queued while the preceding request is in flight.
      // Only acknowledge the exact version that reached the server.
      const tx = db.transaction('outbox', 'readwrite');
      const current = await tx.store.get(change.key);
      if (current?.version === change.version) await tx.store.delete(change.key);
      await tx.done;
    }
  }
}

export async function flushCloudQueue() {
  const db = await getLocalDatabase();
  do {
    draining ??= drain().finally(() => { draining = undefined; });
    await draining;
  } while (await db.count('outbox') > 0);
}
