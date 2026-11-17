import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mission, Client, Vehicle } from '../src/types';

const backend = vi.hoisted(() => ({
  rows: new Map<string, Map<string, Record<string, unknown>>>(),
  offline: false,
  reads: 0,
  afterWrite: undefined as undefined | (() => Promise<void>),
  afterRead: undefined as undefined | ((table: string) => Promise<void>),
}));

vi.mock('../src/utils/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from(table: string) {
      if (!backend.rows.has(table)) backend.rows.set(table, new Map());
      const rows = backend.rows.get(table)!;
      return {
        async upsert(data: Record<string, unknown>, options: { ignoreDuplicates: boolean }) {
          if (backend.offline) return { error: new Error('Network unavailable') };
          if (!options.ignoreDuplicates || !rows.has(String(data.id))) {
            rows.set(String(data.id), structuredClone(data));
          }
          await backend.afterWrite?.();
          return { error: null };
        },
        delete() {
          return { async eq(_column: string, id: string) {
            if (backend.offline) return { error: new Error('Network unavailable') };
            rows.delete(id);
            return { error: null };
          } };
        },
        select() {
          const read = async () => {
            backend.reads += 1;
            const data = structuredClone([...rows.values()]);
            await backend.afterRead?.(table);
            return { data, error: backend.offline ? new Error('Network unavailable') : null };
          };
          return { order: read, then: (resolve: (value: unknown) => unknown) => read().then(resolve) };
        },
      };
    },
  },
}));

import { getLocalDatabase } from '../src/utils/localDatabase';
import { persistentStorage, flushLocalWrites } from '../src/utils/persistentStorage';
import {
  hydrateLocalStores, useClientStore, useMissionStore, useVehicleStore,
  useRappelStore, useCustomTypeStore,
} from '../src/store';
import {
  pullAllData, pushClient, pushMission, pushVehicle,
  deleteClientFromCloud, useSyncStore,
} from '../src/utils/supabaseSync';

const client = (nom = 'Test'): Client => ({ id: 'client-1', nom, createdAt: '2026-01-01T12:00:00Z' });
const mission = (): Mission => ({
  id: 'mission-1', plaque: 'TEST', dateTime: '2026-01-01T12:00:00Z', statut: 'a_facturer',
  brouillon: false, types: [], type: '', degats: [], photos: [], notesVocales: [], clients: [],
  prestations: [], documents: [], createdAt: '2026-01-01T12:00:00Z', updatedAt: '2026-01-02T12:00:00Z',
});

beforeAll(async () => {
  await hydrateLocalStores();
});

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  backend.rows.clear();
  backend.offline = false;
  backend.reads = 0;
  backend.afterWrite = undefined;
  backend.afterRead = undefined;
  await (await getLocalDatabase()).clear('outbox');
  useClientStore.setState({ clients: [] });
  useVehicleStore.setState({ vehicles: [] });
  useMissionStore.setState({ missions: [] });
  useRappelStore.setState({ rappels: [] });
  useCustomTypeStore.setState({ customTypes: [] });
  await persistentStorage.setItem('automission_supabase_migrated', 'true');
  await flushLocalWrites();
  useSyncStore.getState().setStatus('idle');
});

describe('cloud synchronization', () => {
  it('loads and persists photo data larger than the previous localStorage budget', async () => {
    backend.rows.set('missions', new Map([['mission-1', {
      id: 'mission-1', plaque: 'TEST', metadata: { photos: [{ dataUrl: 'x'.repeat(7 * 1024 * 1024) }] },
    }]]));
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('synced');
    expect(useMissionStore.getState().missions[0].photos[0].dataUrl.length).toBe(7 * 1024 * 1024);
    expect((await persistentStorage.getItem('automission-missions'))!.length).toBeGreaterThan(7 * 1024 * 1024);
  });

  it('retains local work and an incomplete migration when an upload fails, then retries', async () => {
    await persistentStorage.removeItem('automission_supabase_migrated');
    useClientStore.setState({ clients: [client('Offline client')] });
    backend.offline = true;
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useClientStore.getState().clients[0].nom).toBe('Offline client');
    expect(await persistentStorage.getItem('automission_supabase_migrated')).toBeNull();
    expect(backend.reads).toBe(0);
    expect(await (await getLocalDatabase()).count('outbox')).toBe(1);
    backend.offline = false;
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('synced');
    expect(backend.rows.get('clients')?.get('client-1')?.nom).toBe('Offline client');
    expect(await persistentStorage.getItem('automission_supabase_migrated')).toBe('true');
    expect(await (await getLocalDatabase()).count('outbox')).toBe(0);
  });

  it('replays a persisted deletion before pulling, so a deleted row is not resurrected', async () => {
    backend.rows.set('clients', new Map([['client-1', { id: 'client-1', nom: 'Deleted' }]]));
    backend.offline = true;
    expect(await deleteClientFromCloud('client-1')).toBe(false);
    const queued = await (await getLocalDatabase()).get('outbox', 'clients:client-1');
    expect(queued?.operation).toBe('delete');
    backend.offline = false;
    await pullAllData();
    expect(useClientStore.getState().clients).toEqual([]);
    expect(backend.rows.get('clients')?.size).toBe(0);
    expect(await (await getLocalDatabase()).count('outbox')).toBe(0);
  });

  it('preserves a pending user edit when an older legacy copy is imported', async () => {
    backend.offline = true;
    await pushClient(client('New local edit'));
    await pushClient(client('Old legacy copy'), true);
    expect((await (await getLocalDatabase()).get('outbox', 'clients:client-1'))?.data?.nom).toBe('New local edit');
    backend.offline = false;
    await pullAllData();
    expect(useClientStore.getState().clients[0].nom).toBe('New local edit');
  });

  it('does not acknowledge a newer edit when an older request completes', async () => {
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const firstRequest = new Promise<void>(resolve => { started = resolve; });
    backend.afterWrite = async () => { started(); await gate; };
    const first = pushClient(client('First'));
    await firstRequest;
    const second = pushClient(client('Latest'));
    await vi.waitFor(async () => {
      expect((await (await getLocalDatabase()).get('outbox', 'clients:client-1'))?.data?.nom).toBe('Latest');
    });
    release();
    await Promise.all([first, second]);
    expect(backend.rows.get('clients')?.get('client-1')?.nom).toBe('Latest');
    expect(await (await getLocalDatabase()).count('outbox')).toBe(0);
    expect(useSyncStore.getState().status).toBe('synced');
  });

  it('coalesces simultaneous full synchronizations', async () => {
    const first = pullAllData();
    expect(pullAllData()).toBe(first);
    await first;
    expect(backend.reads).toBe(5);
  });

  it('does not overwrite an edit made while a cloud snapshot is downloading', async () => {
    backend.rows.set('clients', new Map([['client-1', { id: 'client-1', nom: 'Old' }]]));
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const downloading = new Promise<void>(resolve => { started = resolve; });
    backend.afterRead = async (table) => {
      if (table === 'clients') { started(); await gate; }
    };
    const syncing = pullAllData();
    await downloading;
    useClientStore.setState({ clients: [client('New')] });
    await pushClient(client('New'));
    release();
    await syncing;
    expect(useClientStore.getState().clients[0].nom).toBe('New');
    expect(backend.reads).toBeGreaterThan(5);
  });

  it('merges missing legacy rows while preserving existing cloud records', async () => {
    await persistentStorage.removeItem('automission_supabase_migrated');
    backend.rows.set('clients', new Map([['client-1', { id: 'client-1', nom: 'Cloud latest' }]]));
    useClientStore.setState({ clients: [client('Stale copy'), { ...client('Local only'), id: 'client-2' }] });
    await pullAllData();
    expect(backend.rows.get('clients')?.get('client-1')?.nom).toBe('Cloud latest');
    expect(backend.rows.get('clients')?.get('client-2')?.nom).toBe('Local only');
    expect(useClientStore.getState().clients).toHaveLength(2);
  });

  it('round-trips itinerary and vehicle document metadata without changing creation dates', async () => {
    const data = { ...mission(), carteEssence: 'presente' as const, carteGriseFormat: 'original' as const,
      autresDocumentsSpecifique: 'Test document', pointDepart: 'A', pointArrivee: 'B' };
    const vehicle: Vehicle = { id: 'vehicle-1', plaque: 'TEST', kilometrage: 0,
      createdAt: data.createdAt, carteEssence: data.carteEssence, carteGriseFormat: data.carteGriseFormat,
      autresDocumentsSpecifique: data.autresDocumentsSpecifique };
    await pushMission(data);
    await pushVehicle(vehicle);
    await pullAllData();
    expect(useMissionStore.getState().missions[0]).toMatchObject({ carteEssence: 'presente',
      carteGriseFormat: 'original', autresDocumentsSpecifique: 'Test document', pointDepart: 'A', pointArrivee: 'B',
      createdAt: data.createdAt, updatedAt: data.updatedAt });
    expect(useVehicleStore.getState().vehicles[0]).toMatchObject(vehicle);
  });

  it('keeps the indicator red if a downloaded snapshot cannot be saved on the device', async () => {
    let full = true;
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
      if (full && this.name === 'state' && key === 'automission-missions') throw new Error('Device full');
      return put.call(this, value, key);
    });
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useSyncStore.getState().errorMessage).toBe('Device full');
    full = false;
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('synced');
  });
});
