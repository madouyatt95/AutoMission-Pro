import { expect, it, vi } from 'vitest';

vi.mock('../src/utils/supabase', () => ({ isSupabaseConfigured: false, supabase: {} }));

import { hydrateLocalStores, useClientStore, useDocumentStore, useSettingsStore } from '../src/store';
import { getLocalDatabase } from '../src/utils/localDatabase';

it('hydrates existing local clients, documents and settings before the application starts', async () => {
  localStorage.setItem('automission-clients', JSON.stringify({ state: { clients: [{ id: 'local', nom: 'Offline work' }] }, version: 0 }));
  localStorage.setItem('automission-documents', JSON.stringify({ state: { documents: [{ id: 'doc', dataUrl: 'preserve-me' }] }, version: 0 }));
  localStorage.setItem('automission-settings', JSON.stringify({ state: { companyName: 'Existing settings', tva: 10 }, version: 0 }));
  expect(useClientStore.persist.hasHydrated()).toBe(false);
  expect(useClientStore.getState().clients).toEqual([]);
  await hydrateLocalStores();
  expect(useClientStore.getState().clients[0].nom).toBe('Offline work');
  expect(useDocumentStore.getState().documents[0].dataUrl).toBe('preserve-me');
  expect(useSettingsStore.getState().companyName).toBe('Existing settings');
  expect(useSettingsStore.getState().tva).toBe(10);
  expect(await (await getLocalDatabase()).get('state', 'automission-documents')).toContain('preserve-me');
  expect(localStorage.getItem('automission-documents')).toBeNull();
});
