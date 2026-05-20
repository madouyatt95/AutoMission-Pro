import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';
import { Mission, Client, Vehicle, Rappel, CustomMissionType } from '../types';
import { 
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

// ==================== HYBRID HELPER FUNCTIONS ====================

/**
 * Performs a one-time secure upload of existing offline data from this device to Supabase.
 * Uses UUIDs to safely merge all data without collisions.
 */
export async function mergeLocalDataToCloud() {
  if (!isSupabaseConfigured) return;
  
  const isMigrated = localStorage.getItem('automission_supabase_migrated') === 'true';
  if (isMigrated) return;

  const syncStore = useSyncStore.getState();
  syncStore.setStatus('syncing');

  try {
    console.log('Starting secure one-time local-to-cloud data merge...');
    
    // 1. Upload Clients
    const localClients = useClientStore.getState().clients || [];
    for (const client of localClients) {
      await pushClient(client);
    }

    // 2. Upload Vehicles
    const localVehicles = useVehicleStore.getState().vehicles || [];
    for (const vehicle of localVehicles) {
      await pushVehicle(vehicle);
    }

    // 3. Upload Missions
    const localMissions = useMissionStore.getState().missions || [];
    for (const mission of localMissions) {
      await pushMission(mission);
    }

    // 4. Upload Rappels
    const localRappels = useRappelStore.getState().rappels || [];
    for (const rappel of localRappels) {
      await pushRappel(rappel);
    }

    // 5. Upload Custom Mission Types
    const localCustomTypes = useCustomTypeStore.getState().customTypes || [];
    for (const t of localCustomTypes) {
      await pushCustomType(t);
    }

    console.log('One-time local-to-cloud data merge completed successfully!');
    localStorage.setItem('automission_supabase_migrated', 'true');
  } catch (error) {
    console.error('Error during local-to-cloud data merge:', error);
  }
}

/**
 * Hydrates all local Zustand stores from Supabase
 */
export async function pullAllData() {
  if (!isSupabaseConfigured) return;
  
  // 1. First, merge any existing local offline data on this device to the cloud
  await mergeLocalDataToCloud();
  
  const syncStore = useSyncStore.getState();
  syncStore.setStatus('syncing');

  try {
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
        kilometrage: v.kilometrage || undefined,
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

    syncStore.setLastSynced(new Date().toISOString());
  } catch (error: any) {
    console.error('Error fetching data from Supabase:', error);
    syncStore.setStatus('error', error.message || 'Erreur de connexion');
  }
}

// ==================== MISSION SYNC ====================
export async function pushMission(mission: Mission) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const meta = {
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
    };

    const { error } = await supabase
      .from('missions')
      .upsert({
        id: mission.id,
        plaque: mission.plaque,
        date_time: mission.dateTime,
        statut: mission.statut,
        brouillon: mission.brouillon,
        metadata: meta,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error syncing mission ${mission.id}:`, error);
    syncStore.setStatus('error', 'Erreur synchro mission');
  }
}

export async function deleteMissionFromCloud(id: string) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error deleting mission ${id}:`, error);
    syncStore.setStatus('error', 'Erreur suppression mission');
  }
}

// ==================== VEHICLE SYNC ====================
export async function pushVehicle(vehicle: Vehicle) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const meta = {
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
    };

    const { error } = await supabase
      .from('vehicles')
      .upsert({
        id: vehicle.id,
        plaque: vehicle.plaque,
        marque: vehicle.marque,
        modele: vehicle.modele,
        couleur: vehicle.couleur,
        kilometrage: vehicle.kilometrage,
        statut_physique: vehicle.statutPhysique,
        metadata: meta,
      });

    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error syncing vehicle ${vehicle.id}:`, error);
    syncStore.setStatus('error', 'Erreur synchro véhicule');
  }
}

export async function deleteVehicleFromCloud(id: string) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error deleting vehicle ${id}:`, error);
    syncStore.setStatus('error', 'Erreur suppression véhicule');
  }
}

// ==================== CLIENT SYNC ====================
export async function pushClient(client: Client) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase
      .from('clients')
      .upsert({
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
      });

    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error syncing client ${client.id}:`, error);
    syncStore.setStatus('error', 'Erreur synchro client');
  }
}

export async function deleteClientFromCloud(id: string) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error deleting client ${id}:`, error);
    syncStore.setStatus('error', 'Erreur suppression client');
  }
}

// ==================== RAPPEL SYNC ====================
export async function pushRappel(rappel: Rappel) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const meta = {
      repetition: rappel.repetition,
      missionId: rappel.missionId,
      vehiculePlaque: rappel.vehiculePlaque,
      clientId: rappel.clientId,
    };

    const { error } = await supabase
      .from('rappels')
      .upsert({
        id: rappel.id,
        titre: rappel.titre,
        date: rappel.date,
        completed: rappel.completed,
        metadata: meta,
        created_at: rappel.createdAt,
      });

    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error syncing rappel ${rappel.id}:`, error);
    syncStore.setStatus('error', 'Erreur synchro rappel');
  }
}

export async function deleteRappelFromCloud(id: string) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase.from('rappels').delete().eq('id', id);
    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error deleting rappel ${id}:`, error);
    syncStore.setStatus('error', 'Erreur suppression rappel');
  }
}

// ==================== CUSTOM TYPE SYNC ====================
export async function pushCustomType(type: CustomMissionType) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase
      .from('custom_mission_types')
      .upsert({
        id: type.id,
        nom: type.nom,
        couleur: type.couleur,
      });

    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error syncing custom type ${type.id}:`, error);
    syncStore.setStatus('error', 'Erreur synchro type mission');
  }
}

export async function deleteCustomTypeFromCloud(id: string) {
  if (!isSupabaseConfigured) return;
  const syncStore = useSyncStore.getState();
  try {
    const { error } = await supabase.from('custom_mission_types').delete().eq('id', id);
    if (error) throw error;
    syncStore.setStatus('synced');
  } catch (error: any) {
    console.error(`Error deleting custom type ${id}:`, error);
    syncStore.setStatus('error', 'Erreur suppression type mission');
  }
}
