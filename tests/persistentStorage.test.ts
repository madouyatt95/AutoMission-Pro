import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocalDatabase } from '../src/utils/localDatabase';
import { flushLocalWrites, persistentStorage } from '../src/utils/persistentStorage';

beforeEach(async () => {
  localStorage.clear();
  await (await getLocalDatabase()).clear('state');
});

describe('IndexedDB persistence', () => {
  it('migrates legacy data only after the new copy is saved', async () => {
    const legacy = JSON.stringify({ state: { missions: [{ id: 'offline-work' }] }, version: 0 });
    localStorage.setItem('automission-missions', legacy);
    expect(await persistentStorage.getItem('automission-missions')).toBe(legacy);
    expect(await (await getLocalDatabase()).get('state', 'automission-missions')).toBe(legacy);
    expect(localStorage.getItem('automission-missions')).toBeNull();
  });

  it('preserves the legacy copy if migration cannot be committed', async () => {
    const legacy = JSON.stringify({ state: { vehicles: [{ id: 'keep-me' }] }, version: 0 });
    localStorage.setItem('automission-vehicles', legacy);
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('No space', 'QuotaExceededError');
    });
    await expect(persistentStorage.getItem('automission-vehicles')).rejects.toThrow('No space');
    expect(localStorage.getItem('automission-vehicles')).toBe(legacy);
  });

  it('persists and reloads collections exceeding the old 5 MiB budget', async () => {
    const data = JSON.stringify({ state: { photos: ['x'.repeat(7 * 1024 * 1024)] }, version: 0 });
    const legacyWrite = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('localStorage quota exceeded', 'QuotaExceededError');
    });
    await persistentStorage.setItem('automission-missions', data);
    await flushLocalWrites();
    expect(await persistentStorage.getItem('automission-missions')).toBe(data);
    expect(legacyWrite).not.toHaveBeenCalled();
  });

  it('keeps rapid writes in order and surfaces failed persistence until retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => { throw new Error('Device full'); });
    await persistentStorage.setItem('automission-missions', 'first');
    await expect(flushLocalWrites()).rejects.toThrow('Device full');
    await Promise.all([
      persistentStorage.setItem('automission-missions', 'second'),
      persistentStorage.setItem('automission-missions', 'latest'),
    ]);
    await flushLocalWrites();
    expect(await persistentStorage.getItem('automission-missions')).toBe('latest');
  });
});
