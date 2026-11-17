import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type Mission, type Client, type Vehicle } from '../src/types';

const backend = vi.hoisted(() => ({
  rows: new Map<string, Map<string, Record<string, unknown>>>(),
  offline: false,
  reads: 0,
  failedReads: new Set<string>(),
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
          const read = async (start = 0, end = Number.MAX_SAFE_INTEGER) => {
            backend.reads += 1;
            const data = structuredClone([...rows.values()].slice(start, end + 1));
            await backend.afterRead?.(table);
            return { data, error: backend.offline || backend.failedReads.has(table) ? new Error(`Unable to read ${table}`) : null };
          };
          const query = { order: () => query, range: read };
          return query;
        },
      };
    },
  },
}));

import { getLocalDatabase } from '../src/utils/localDatabase';
import { persistentStorage, flushLocalWrites } from '../src/utils/persistentStorage';
import {
  hydrateLocalStores, useClientStore, useMissionStore, useVehicleStore,
  useRappelStore, useCustomTypeStore, useDocumentStore, useSettingsStore, useExpenseTypeStore,
} from '../src/store';
import {
  pullAllData, pushClient, pushMission, pushVehicle,
  deleteClientFromCloud, deleteDocumentFromCloud, useSyncStore,
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
  backend.failedReads.clear();
  backend.afterWrite = undefined;
  backend.afterRead = undefined;
  await (await getLocalDatabase()).clear('outbox');
  useClientStore.setState({ clients: [] });
  useVehicleStore.setState({ vehicles: [] });
  useMissionStore.setState({ missions: [] });
  useRappelStore.setState({ rappels: [] });
  useCustomTypeStore.setState({ customTypes: [] });
  useDocumentStore.setState({ documents: [] });
  useSettingsStore.setState(DEFAULT_SETTINGS);
  useExpenseTypeStore.setState({ customExpenseTypes: [] });
  await persistentStorage.setItem('automission_supabase_migrated', 'true');
  await persistentStorage.setItem('automission_full_backup_v1', 'true');
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
    expect(backend.reads).toBe(8);
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
    expect(backend.reads).toBeGreaterThan(8);
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

  it('uploads legacy documents, settings and expense types even after the older migration completed', async () => {
    await persistentStorage.removeItem('automission_full_backup_v1');
    useDocumentStore.setState({ documents: [{ id: 'doc-1', nom: 'Saved.txt', type: 'autre',
      dataUrl: 'data:text/plain;base64,U0FWRUQ=', mimeType: 'text/plain', size: 5,
      clientId: 'client-1', vehiculePlaque: 'TEST', createdAt: '2026-01-01T12:00:00Z' }] });
    useSettingsStore.setState({ companyName: 'Existing company', tva: 0, autoAlertDaysFacturation: 2, autoAlertDaysRelance: 9 });
    useExpenseTypeStore.setState({ customExpenseTypes: ['Recharge électrique', 'Frais divers'] });
    await pullAllData();
    expect(backend.rows.get('documents')?.get('doc-1')).toMatchObject({ data_url: 'data:text/plain;base64,U0FWRUQ=', size_bytes: 5, client_id: 'client-1' });
    expect(backend.rows.get('app_settings')?.get('global')).toMatchObject({ company_name: 'Existing company', tva: 0, auto_alert_days_relance: 9 });
    expect([...backend.rows.get('custom_expense_types')!.keys()]).toEqual(['Recharge électrique', 'Frais divers']);
    expect(await persistentStorage.getItem('automission_full_backup_v1')).toBe('true');
    expect(useSyncStore.getState().status).toBe('synced');
  });

  it('keeps a failed document import pending and retains its contents until retry succeeds', async () => {
    await persistentStorage.removeItem('automission_full_backup_v1');
    useDocumentStore.setState({ documents: [{ id: 'doc-1', nom: 'Offline.txt', type: 'autre',
      dataUrl: 'data:text/plain;base64,U0FWRUQ=', createdAt: '2026-01-01T12:00:00Z' }] });
    backend.offline = true;
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useDocumentStore.getState().documents[0].dataUrl).toBe('data:text/plain;base64,U0FWRUQ=');
    expect(await persistentStorage.getItem('automission_full_backup_v1')).toBeNull();
    backend.offline = false;
    await pullAllData();
    expect(backend.rows.get('documents')?.get('doc-1')?.data_url).toBe('data:text/plain;base64,U0FWRUQ=');
    expect(useSyncStore.getState().status).toBe('synced');
  });

  it('does not overwrite cloud settings during the import of an older device', async () => {
    await persistentStorage.removeItem('automission_full_backup_v1');
    backend.rows.set('app_settings', new Map([['global', { id: 'global', company_name: 'Latest company',
      tva: 5.5, auto_alert_days_facturation: 4, auto_alert_days_relance: 12 }]]));
    useSettingsStore.setState({ companyName: 'Stale device' });
    await pullAllData();
    expect(useSettingsStore.getState().companyName).toBe('Latest company');
    expect(useSettingsStore.getState().tva).toBe(5.5);
  });

  it('keeps document deletions pending offline and applies them before restoring documents', async () => {
    backend.rows.set('documents', new Map([['doc-1', { id: 'doc-1', nom: 'Deleted', type: 'autre' }]]));
    backend.offline = true;
    expect(await deleteDocumentFromCloud('doc-1')).toBe(false);
    backend.offline = false;
    await pullAllData();
    expect(useDocumentStore.getState().documents).toEqual([]);
    expect(backend.rows.get('documents')?.size).toBe(0);
  });

  it('keeps the indicator red and existing local data intact if any backup category cannot be read', async () => {
    useDocumentStore.setState({ documents: [{ id: 'doc-1', nom: 'Keep locally', type: 'autre', createdAt: '2026-01-01T12:00:00Z' }] });
    backend.failedReads.add('documents');
    await pullAllData();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useDocumentStore.getState().documents[0].nom).toBe('Keep locally');
  });

  it('restores every row across the API page limit', async () => {
    backend.rows.set('clients', new Map(Array.from({ length: 1201 }, (_, i) => [String(i), { id: String(i), nom: 'Client ' + i }])));
    await pullAllData();
    expect(useClientStore.getState().clients).toHaveLength(1201);
    expect(backend.reads).toBe(10);
  });

  it('restores all eight stores, including exact attachment contents, into a completely fresh installation', async () => {
    const file = 'data:text/plain;base64,U0FWRUQgRE9DVU1FTlQ=';
    const image = 'data:image/png;base64,aW1hZ2UtYnl0ZXM=';
    const savedClient = useClientStore.getState().addClient({ nom: 'Saved company' });
    const savedVehicle = useVehicleStore.getState().addVehicle({ plaque: 'RESTORE', carteGrise: file, carteVerte: image });
    const savedMission = useMissionStore.getState().addMission({ plaque: 'RESTORE', vehicleId: savedVehicle.id,
      photos: [{ id: 'photo', dataUrl: image, timestamp: '2026-01-01T12:00:00Z' }],
      notesVocales: [{ id: 'voice', dataUrl: 'data:audio/webm;base64,YXVkaW8=', duration: 1, timestamp: '2026-01-01T12:00:00Z' }],
      signature: image, documents: [{ id: 'attached', nom: 'Attached.txt', type: 'autre', dataUrl: file, createdAt: '2026-01-01T12:00:00Z' }] });
    const savedDocument = useDocumentStore.getState().addDocument({ nom: 'Saved.txt', type: 'autre', dataUrl: file,
      mimeType: 'text/plain', size: 14, clientId: savedClient.id, missionId: savedMission.id, vehiculePlaque: 'RESTORE' });
    useRappelStore.getState().addRappel({ titre: 'Saved reminder', date: '2026-12-01', repetition: 'mensuelle', missionId: savedMission.id });
    useCustomTypeStore.getState().addType({ nom: 'Saved mission type', couleur: '#ff5500' });
    useSettingsStore.getState().updateSettings({ companyName: 'Restored settings', tva: 0,
      autoAlertDaysFacturation: 0, autoAlertDaysRelance: 15 });
    useExpenseTypeStore.getState().addExpenseType('Saved expense type');
    await vi.waitFor(() => {
      expect(backend.rows.get('documents')?.get(savedDocument.id)?.data_url).toBe(file);
      expect(useSyncStore.getState().status).toBe('synced');
    });
    await pullAllData();
    await flushLocalWrites();
    // A second browser has no IndexedDB, no localStorage and no migration flags.
    const db = await getLocalDatabase();
    await db.clear('state');
    await db.clear('outbox');
    localStorage.clear();
    vi.resetModules();
    const secondDevice = await import('../src/store');
    const secondSync = await import('../src/utils/supabaseSync');
    expect(secondDevice.useDocumentStore.getState().documents).toEqual([]);
    expect(secondDevice.useSettingsStore.getState().companyName).toBe(DEFAULT_SETTINGS.companyName);
    await secondSync.pullAllData();
    expect(secondSync.useSyncStore.getState().status).toBe('synced');
    expect(secondDevice.useClientStore.getState().clients[0].nom).toBe('Saved company');
    expect(secondDevice.useVehicleStore.getState().vehicles[0]).toMatchObject({ carteGrise: file, carteVerte: image });
    expect(secondDevice.useMissionStore.getState().missions[0]).toMatchObject({ signature: image,
      photos: [{ dataUrl: image }], notesVocales: [{ dataUrl: 'data:audio/webm;base64,YXVkaW8=' }], documents: [{ dataUrl: file }] });
    expect(secondDevice.useDocumentStore.getState().documents[0]).toMatchObject({ id: savedDocument.id, dataUrl: file,
      mimeType: 'text/plain', size: 14, clientId: savedClient.id, missionId: savedMission.id });
    expect(secondDevice.useRappelStore.getState().rappels[0].titre).toBe('Saved reminder');
    expect(secondDevice.useCustomTypeStore.getState().customTypes[0].nom).toBe('Saved mission type');
    expect(secondDevice.useSettingsStore.getState()).toMatchObject({ companyName: 'Restored settings', tva: 0,
      autoAlertDaysFacturation: 0, autoAlertDaysRelance: 15 });
    expect(secondDevice.useExpenseTypeStore.getState().customExpenseTypes).toEqual(['Saved expense type']);
    expect(backend.rows.get('app_settings')?.get('global')?.company_name).toBe('Restored settings');
  });
});
