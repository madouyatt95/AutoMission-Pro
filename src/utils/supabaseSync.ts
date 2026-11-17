import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';
import { Mission, Client, Vehicle, Rappel, CustomMissionType } from '../types';
import { enqueueCloudChange, flushCloudQueue, getCloudRevision } from './cloudQueue';
import { flushLocalWrites, persistentStorage } from './persistentStorage';
import type { CloudTable } from './localDatabase';
import {
  hydrateLocalStores,
  useMissionStore,
  useClientStore,
  useVehicleStore,
  useRappelStore,
  useCustomTypeStore
} from '../store';

// ==================== SYNC STATE STORE ====================
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'not_configured';

interface SyncStore {
  status: SyncStatus;
  lastSynced: string | null;
  errorMessage: string | null;
  setStatus: (status: SyncStatus, errorMessage?: string | null) => void;
  setLastSynced: (timestamp: string) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: isSupabaseConfigured ? 'idle' : 'not_configured',
  lastSynced: null,
  errorMessage: null,
  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
  setLastSynced: (lastSynced) => set({ lastSynced, status: 'synced', errorMessage: null }),
}));

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return fallback;
}

let activeWrites = 0;
let pullInFlight: Promise<void> | undefined;

async function saveCloudChange(table: CloudTable, id: string, data?: Record<string, unknown>, ignoreDuplicates = false) {
  if (!isSupabaseConfigured) return true;
  const syncStore = useSyncStore.getState();
  activeWrites += 1;
  syncStore.setStatus('syncing');
  try {
    // Persist the outbox before attempting the request, including deletions.
    await enqueueCloudChange({ table, id, operation: data ? 'upsert' : 'delete', data, ignoreDuplicates });
    await flushLocalWrites();
    await flushCloudQueue();
    if (activeWrites === 1 && !pullInFlight) syncStore.setLastSynced(new Date().toISOString());
    return true;
  } catch (error: unknown) {
    console.error(`Unable to synchronize ${table}:`, error);
    syncStore.setStatus('error', errorMessage(error, 'Envoi en attente. Réessayez la synchronisation.'));
    return false;
  } finally {
    activeWrites -= 1;
  }
}

// ==================== HYBRID HELPER FUNCTIONS ====================

/**
 * Performs a one-time secure upload of existing offline data from this device to Supabase.
 * Uses UUIDs to safely merge all data without collisions.
 */
export async function mergeLocalDataToCloud() {
  if (!isSupabaseConfigured) return;
  await hydrateLocalStores();
  const isMigrated = await persistentStorage.getItem('automission_supabase_migrated') === 'true';
  if (isMigrated) return;

  const syncStore = useSyncStore.getState();
  syncStore.setStatus('syncing');

  try {
    console.log('Starting secure one-time local-to-cloud data merge...');

    // 1. Upload Clients
    const localClients = useClientStore.getState().clients || [];
    for (const client of localClients) {
      if (!await pushClient(client, true)) throw new Error(useSyncStore.getState().errorMessage || 'Échec de l’envoi des clients');
    }

    // 2. Upload Vehicles
    const localVehicles = useVehicleStore.getState().vehicles || [];
    for (const vehicle of localVehicles) {
      if (!await pushVehicle(vehicle, true)) throw new Error(useSyncStore.getState().errorMessage || 'Échec de l’envoi des véhicules');
    }

    // 3. Upload Missions
    const localMissions = useMissionStore.getState().missions || [];
    for (const mission of localMissions) {
      if (!await pushMission(mission, true)) throw new Error(useSyncStore.getState().errorMessage || 'Échec de l’envoi des missions');
    }

    // 4. Upload Rappels
    const localRappels = useRappelStore.getState().rappels || [];
    for (const rappel of localRappels) {
      if (!await pushRappel(rappel, true)) throw new Error(useSyncStore.getState().errorMessage || 'Échec de l’envoi des rappels');
    }

    // 5. Upload Custom Mission Types
    const localCustomTypes = useCustomTypeStore.getState().customTypes || [];
    for (const t of localCustomTypes) {
      if (!await pushCustomType(t, true)) throw new Error(useSyncStore.getState().errorMessage || 'Échec de l’envoi des types de mission');
    }

    console.log('One-time local-to-cloud data merge completed successfully!');
    await persistentStorage.setItem('automission_supabase_migrated', 'true');
    await flushLocalWrites();
  } catch (error) {
    console.error('Error during local-to-cloud data merge:', error);
    throw error;
  }
}

/**
 * Hydrates all local Zustand stores from Supabase
 */
export function pullAllData() {
  if (!pullInFlight) {
    pullInFlight = synchronizeAllData().finally(() => { pullInFlight = undefined; });
  }
  return pullInFlight;
}

async function synchronizeAllData() {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  syncStore.setStatus('syncing');

  try {
    await hydrateLocalStores();
    await flushLocalWrites(true);
    await flushCloudQueue();
    // Only mark the initial merge complete after every upload succeeds.
    // Existing cloud records win over stale copies from another device.
    await mergeLocalDataToCloud();

    for (;;) {
      await flushCloudQueue();
      const revision = getCloudRevision();
      // 2. Fetch Clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // 3. Fetch Vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // 4. Fetch Missions
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      // 5. Fetch Rappels
      const { data: rappelsData, error: rappelsError } = await supabase
        .from('rappels')
        .select('*')
        .order('created_at', { ascending: false });

      if (rappelsError) throw rappelsError;

      // 6. Fetch Custom Types
      const { data: customTypesData, error: customTypesError } = await supabase
        .from('custom_mission_types')
        .select('*');

      if (customTypesError) throw customTypesError;

      // Do not overwrite edits made while this snapshot was downloading.
      if (revision !== getCloudRevision()) continue;

      // Map database models to typescript interfaces
      const clients: Client[] = (clientsData || []).map(c => ({
        id: c.id,
        nom: c.nom,
        email: c.email || undefined,
        telephone: c.telephone || undefined,
        adresse: c.adresse || undefined,
        notes: c.notes || undefined,
        type: c.type || undefined,
        siret: c.siret || undefined,
        conditionsPaiement: c.conditions_paiement || undefined,
        createdAt: c.created_at,
      }));

      const vehicles: Vehicle[] = (vehiclesData || []).map(v => {
        const meta = v.metadata || {};
        return {
          id: v.id,
          plaque: v.plaque,
          marque: v.marque || undefined,
          modele: v.modele || undefined,
          couleur: v.couleur || undefined,
          kilometrage: v.kilometrage ?? undefined,
          statutPhysique: v.statut_physique || undefined,
          finition: meta.finition,
          annee: meta.annee,
          motorisation: meta.motorisation,
          carburant: meta.carburant,
          boiteVitesses: meta.boiteVitesses,
          vin: meta.vin,
          typeVehicule: meta.typeVehicule,
          dimensionsPneus: meta.dimensionsPneus,
          carteGrise: meta.carteGrise,
          carteVerte: meta.carteVerte,
          keysPossessed: meta.keysPossessed,
          docsInPossession: meta.docsInPossession,
          historiqueStatuts: meta.historiqueStatuts,
          travauxReels: meta.travauxReels,
          carteEssence: meta.carteEssence,
          carteGriseFormat: meta.carteGriseFormat,
          autresDocumentsSpecifique: meta.autresDocumentsSpecifique,
          createdAt: v.created_at,
        };
      });

      const missions: Mission[] = (missionsData || []).map(m => {
        const meta = m.metadata || {};
        return {
          id: m.id,
          plaque: m.plaque,
          dateTime: m.date_time,
          statut: m.statut,
          brouillon: m.brouillon,
          types: meta.types || [],
          type: meta.type || '',
          vehicleId: meta.vehicleId,
          kilometrage: meta.kilometrage,
          couleur: meta.couleur,
          etatGeneral: meta.etatGeneral,
          degats: meta.degats || [],
          photos: meta.photos || [],
          notesTexte: meta.notesTexte,
          notesVocales: meta.notesVocales || [],
          prixTTC: meta.prixTTC,
          prixManuel: meta.prixManuel,
          geolocation: meta.geolocation,
          clients: meta.clients || [],
          prestations: meta.prestations || [],
          documents: meta.documents || [],
          signature: meta.signature,
          usurePneus: meta.usurePneus || [],
          avancesFrais: meta.avancesFrais || [],
          keysPossessed: meta.keysPossessed,
          docsInPossession: meta.docsInPossession,
          statutPhysique: meta.statutPhysique,
          historiqueStatuts: meta.historiqueStatuts,
          travauxReels: meta.travauxReels,
          carteEssence: meta.carteEssence,
          carteGriseFormat: meta.carteGriseFormat,
          autresDocumentsSpecifique: meta.autresDocumentsSpecifique,
          pointDepart: meta.pointDepart,
          pointArrivee: meta.pointArrivee,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        };
      });

      const rappels: Rappel[] = (rappelsData || []).map(r => {
        const meta = r.metadata || {};
        return {
          id: r.id,
          titre: r.titre,
          date: r.date,
          completed: r.completed,
          repetition: meta.repetition || 'unique',
          missionId: meta.missionId,
          vehiculePlaque: meta.vehiculePlaque,
          clientId: meta.clientId,
          createdAt: r.created_at,
        };
      });

      const customTypes: CustomMissionType[] = (customTypesData || []).map(t => ({
        id: t.id,
        nom: t.nom,
        couleur: t.couleur,
      }));

      // Update Zustand Stores directly!
      useClientStore.setState({ clients });
      useVehicleStore.setState({ vehicles });
      useMissionStore.setState({ missions });
      useRappelStore.setState({ rappels });
      useCustomTypeStore.setState({ customTypes });

      await flushLocalWrites();
      if (revision !== getCloudRevision()) continue;
      syncStore.setLastSynced(new Date().toISOString());
      return;
    }
  } catch (error: unknown) {
    console.error('Error fetching data from Supabase:', error);
    syncStore.setStatus('error', errorMessage(error, 'Erreur de connexion'));
  }
}

// ==================== MISSION SYNC ====================
export function pushMission(mission: Mission, ignoreDuplicates = false) {
  const metadata = {
    types: mission.types,
    type: mission.type,
    vehicleId: mission.vehicleId,
    kilometrage: mission.kilometrage,
    couleur: mission.couleur,
    etatGeneral: mission.etatGeneral,
    degats: mission.degats,
    photos: mission.photos,
    notesTexte: mission.notesTexte,
    notesVocales: mission.notesVocales,
    prixTTC: mission.prixTTC,
    prixManuel: mission.prixManuel,
    geolocation: mission.geolocation,
    clients: mission.clients,
    prestations: mission.prestations,
    documents: mission.documents,
    signature: mission.signature,
    usurePneus: mission.usurePneus,
    avancesFrais: mission.avancesFrais,
    keysPossessed: mission.keysPossessed,
    docsInPossession: mission.docsInPossession,
    statutPhysique: mission.statutPhysique,
    historiqueStatuts: mission.historiqueStatuts,
    travauxReels: mission.travauxReels,
    carteEssence: mission.carteEssence,
    carteGriseFormat: mission.carteGriseFormat,
    autresDocumentsSpecifique: mission.autresDocumentsSpecifique,
    pointDepart: mission.pointDepart,
    pointArrivee: mission.pointArrivee,
  };
  return saveCloudChange('missions', mission.id, {
    id: mission.id,
    plaque: mission.plaque,
    date_time: mission.dateTime,
    statut: mission.statut,
    brouillon: mission.brouillon,
    metadata,
    created_at: mission.createdAt,
    updated_at: mission.updatedAt,
  }, ignoreDuplicates);
}

export function deleteMissionFromCloud(id: string) {
  return saveCloudChange('missions', id);
}

// ==================== VEHICLE SYNC ====================
export function pushVehicle(vehicle: Vehicle, ignoreDuplicates = false) {
  const metadata = {
    finition: vehicle.finition,
    annee: vehicle.annee,
    motorisation: vehicle.motorisation,
    carburant: vehicle.carburant,
    boiteVitesses: vehicle.boiteVitesses,
    vin: vehicle.vin,
    typeVehicule: vehicle.typeVehicule,
    dimensionsPneus: vehicle.dimensionsPneus,
    carteGrise: vehicle.carteGrise,
    carteVerte: vehicle.carteVerte,
    keysPossessed: vehicle.keysPossessed,
    docsInPossession: vehicle.docsInPossession,
    historiqueStatuts: vehicle.historiqueStatuts,
    travauxReels: vehicle.travauxReels,
    carteEssence: vehicle.carteEssence,
    carteGriseFormat: vehicle.carteGriseFormat,
    autresDocumentsSpecifique: vehicle.autresDocumentsSpecifique,
  };
  return saveCloudChange('vehicles', vehicle.id, {
    id: vehicle.id,
    plaque: vehicle.plaque,
    marque: vehicle.marque,
    modele: vehicle.modele,
    couleur: vehicle.couleur,
    kilometrage: vehicle.kilometrage,
    statut_physique: vehicle.statutPhysique,
    metadata,
    created_at: vehicle.createdAt,
  }, ignoreDuplicates);
}

export function deleteVehicleFromCloud(id: string) {
  return saveCloudChange('vehicles', id);
}

// ==================== CLIENT SYNC ====================
export function pushClient(client: Client, ignoreDuplicates = false) {
  return saveCloudChange('clients', client.id, {
    id: client.id,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone,
    adresse: client.adresse,
    notes: client.notes,
    type: client.type,
    siret: client.siret,
    conditions_paiement: client.conditionsPaiement,
    created_at: client.createdAt,
  }, ignoreDuplicates);
}

export function deleteClientFromCloud(id: string) {
  return saveCloudChange('clients', id);
}

// ==================== RAPPEL SYNC ====================
export function pushRappel(rappel: Rappel, ignoreDuplicates = false) {
  return saveCloudChange('rappels', rappel.id, {
    id: rappel.id,
    titre: rappel.titre,
    date: rappel.date,
    completed: rappel.completed,
    metadata: {
      repetition: rappel.repetition,
      missionId: rappel.missionId,
      vehiculePlaque: rappel.vehiculePlaque,
      clientId: rappel.clientId,
    },
    created_at: rappel.createdAt,
  }, ignoreDuplicates);
}

export function deleteRappelFromCloud(id: string) {
  return saveCloudChange('rappels', id);
}

// ==================== CUSTOM TYPE SYNC ====================
export function pushCustomType(type: CustomMissionType, ignoreDuplicates = false) {
  return saveCloudChange('custom_mission_types', type.id, {
    id: type.id,
    nom: type.nom,
    couleur: type.couleur,
  }, ignoreDuplicates);
}

export function deleteCustomTypeFromCloud(id: string) {
  return saveCloudChange('custom_mission_types', id);
}
