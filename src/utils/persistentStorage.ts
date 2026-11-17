import type { StateStorage } from 'zustand/middleware';
import { getLocalDatabase } from './localDatabase';

const writes = new Map<string, Promise<void>>();
const errors = new Map<string, { error: unknown; save: () => Promise<unknown> }>();

function writeInOrder(name: string, save: () => Promise<unknown>) {
  // Zustand does not await writes made by store actions. Keep them ordered and
  // expose failures to synchronization without creating unhandled rejections.
  const write = (writes.get(name) ?? Promise.resolve()).then(save).then(
    () => { errors.delete(name); },
    (error: unknown) => {
      errors.set(name, { error, save });
      console.error(`Unable to save local collection ${name}:`, error);
    },
  );
  writes.set(name, write);
  void write.then(() => {
    if (writes.get(name) === write) writes.delete(name);
  });
  return write;
}

export const persistentStorage: StateStorage = {
  async getItem(name) {
    const db = await getLocalDatabase();
    const saved = await db.get('state', name);
    if (saved !== undefined) return saved;

    const legacy = localStorage.getItem(name);
    if (legacy !== null) {
      // Never remove the original until the IndexedDB transaction commits.
      JSON.parse(legacy);
      await db.put('state', legacy, name);
      if (localStorage.getItem(name) === legacy) localStorage.removeItem(name);
    }
    return legacy;
  },
  setItem(name, value) {
    return writeInOrder(name, async () => (await getLocalDatabase()).put('state', value, name));
  },
  removeItem(name) {
    return writeInOrder(name, async () => {
      await (await getLocalDatabase()).delete('state', name);
      localStorage.removeItem(name);
    });
  },
};

export async function flushLocalWrites(retryFailed = false) {
  while (writes.size > 0) await Promise.all(writes.values());
  if (retryFailed && errors.size > 0) {
    await Promise.all([...errors].map(([name, { save }]) => writeInOrder(name, save)));
    while (writes.size > 0) await Promise.all(writes.values());
  }
  if (errors.size > 0) throw errors.values().next().value!.error;
}
