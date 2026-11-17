import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from './utils/persistentStorage';
import { Mission, Client, AppDocument, Rappel, MissionStatus, Vehicle, CustomMissionType, Settings, DEFAULT_SETTINGS } from './types';
import { v4 as uuidv4 } from 'uuid';
import {
  pushMission,
  deleteMissionFromCloud,
  pushVehicle,
  deleteVehicleFromCloud,
  pushClient,
  deleteClientFromCloud,
  pushRappel,
  deleteRappelFromCloud,
  pushCustomType,
  deleteCustomTypeFromCloud,
  pushDocument,
  deleteDocumentFromCloud,
  pushSettings,
  pushExpenseType,
} from './utils/supabaseSync';

// ==================== MISSION STORE ====================
interface MissionStore {
  missions: Mission[];
  addMission: (mission: Partial<Mission> & { plaque: string }) => Mission;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  duplicateMission: (id: string) => Mission | null;
  getMissionsByPlaque: (plaque: string) => Mission[];
  getMissionsByStatus: (status: MissionStatus) => Mission[];
  getMissionsByClient: (clientId: string) => Mission[];
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      missions: [],
      addMission: (data) => {
        const now = new Date().toISOString();
        const types = data.types || (data.type ? [data.type] : []);
        const initialStatus = data.statutPhysique || 'en_possession';
        const initialHistory = data.historiqueStatuts || [
          {
            id: uuidv4(),
            statut: initialStatus,
            start: now
          }
        ];

        const mission: Mission = {
          id: uuidv4(),
          plaque: data.plaque.toUpperCase().trim(),
          types,
          type: types[0] || '',
          dateTime: data.dateTime || now,
          vehicleId: data.vehicleId,
          kilometrage: data.kilometrage,
          couleur: data.couleur,
          etatGeneral: data.etatGeneral,
          degats: data.degats || [],
          photos: data.photos || [],
          notesTexte: data.notesTexte || '',
          notesVocales: data.notesVocales || [],
          prixTTC: data.prixTTC,
          prixManuel: data.prixManuel,
          geolocation: data.geolocation,
          statut: data.statut || 'a_facturer',
          clients: data.clients || [],
          prestations: data.prestations || [],
          documents: data.documents || [],
          brouillon: data.brouillon ?? true,
          signature: data.signature,
          usurePneus: data.usurePneus || [],
          avancesFrais: data.avancesFrais || [],
          createdAt: now,
          updatedAt: now,
          keysPossessed: data.keysPossessed ?? 1,
          docsInPossession: data.docsInPossession || [],
          statutPhysique: initialStatus,
          historiqueStatuts: initialHistory,
          travauxReels: data.travauxReels || [],
          carteEssence: data.carteEssence || 'absente',
          carteGriseFormat: data.carteGriseFormat,
          autresDocumentsSpecifique: data.autresDocumentsSpecifique,
          pointDepart: data.pointDepart,
          pointArrivee: data.pointArrivee,
        };
        set((state) => ({ missions: [mission, ...state.missions] }));
        
        // Cloud Sync
        pushMission(mission);
        
        return mission;
      },
      updateMission: (id, updates) => {
        set((state) => {
          const nextMissions = state.missions.map((m) => {
            if (m.id !== id) return m;

            const newStatus = updates.statutPhysique;
            let updatedHistory = [...(m.historiqueStatuts || [])];

            if (newStatus && newStatus !== m.statutPhysique) {
              const now = new Date().toISOString();
              updatedHistory = updatedHistory.map(h => 
                !h.end ? { ...h, end: now } : h
              );
              updatedHistory.push({
                id: uuidv4(),
                statut: newStatus,
                start: now,
                prestataire: (updates as any)._prestataire || '',
                commentaire: (updates as any)._commentaire || ''
              });
            }

            const cleanedUpdates = { ...updates };
            delete (cleanedUpdates as any)._prestataire;
            delete (cleanedUpdates as any)._commentaire;

            return {
              ...m,
              ...cleanedUpdates,
              historiqueStatuts: updatedHistory,
              updatedAt: new Date().toISOString()
            };
          });

          const updated = nextMissions.find(m => m.id === id);
          if (updated) {
            // Cloud Sync
            pushMission(updated);
          }

          return { missions: nextMissions };
        });
      },
      deleteMission: (id) => {
        set((state) => ({ missions: state.missions.filter((m) => m.id !== id) }));
        
        // Cloud Sync
        deleteMissionFromCloud(id);
      },
      duplicateMission: (id) => {
        const mission = get().missions.find((m) => m.id === id);
        if (!mission) return null;
        const now = new Date().toISOString();
        const dup: Mission = {
          ...mission,
          id: uuidv4(),
          dateTime: now,
          statut: 'a_facturer',
          brouillon: true,
          prestations: mission.prestations.map(p => ({ ...p, id: uuidv4() })),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ missions: [dup, ...state.missions] }));
        
        // Cloud Sync
        pushMission(dup);
        
        return dup;
      },
      getMissionsByPlaque: (plaque) => get().missions.filter((m) => m.plaque === plaque.toUpperCase()),
      getMissionsByStatus: (status) => get().missions.filter((m) => m.statut === status),
      getMissionsByClient: (clientId) => get().missions.filter((m) => m.clients.some((c) => c.clientId === clientId)),
    }),
    { name: 'automission-missions', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== CLIENT STORE ====================
interface ClientStore {
  clients: Client[];
  addClient: (data: Partial<Client> & { nom: string }) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      clients: [],
      addClient: (data) => {
        const client: Client = {
          id: uuidv4(),
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          notes: data.notes,
          type: data.type || 'entreprise',
          conditionsPaiement: data.conditionsPaiement,
          siret: data.siret,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ clients: [client, ...state.clients] }));
        
        // Cloud Sync
        pushClient(client);
        
        return client;
      },
      updateClient: (id, updates) => {
        set((state) => {
          const nextClients = state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c));
          const updated = nextClients.find(c => c.id === id);
          if (updated) {
            // Cloud Sync
            pushClient(updated);
          }
          return { clients: nextClients };
        });
      },
      deleteClient: (id) => {
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
        
        // Cloud Sync
        deleteClientFromCloud(id);
      },
    }),
    { name: 'automission-clients', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== VEHICLE STORE ====================
interface VehicleStore {
  vehicles: Vehicle[];
  addVehicle: (data: Partial<Vehicle> & { plaque: string }) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getByPlaque: (plaque: string) => Vehicle | undefined;
}

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
      vehicles: [],
      addVehicle: (data) => {
        const now = new Date().toISOString();
        const initialStatus = data.statutPhysique || 'en_possession';
        const initialHistory = data.historiqueStatuts || [
          {
            id: uuidv4(),
            statut: initialStatus,
            start: now
          }
        ];

        const vehicle: Vehicle = {
          id: uuidv4(),
          plaque: data.plaque.toUpperCase().trim(),
          marque: data.marque,
          modele: data.modele,
          finition: data.finition,
          annee: data.annee,
          motorisation: data.motorisation,
          carburant: data.carburant,
          boiteVitesses: data.boiteVitesses,
          couleur: data.couleur,
          kilometrage: data.kilometrage,
          vin: data.vin,
          typeVehicule: data.typeVehicule,
          dimensionsPneus: data.dimensionsPneus,
          carteGrise: data.carteGrise,
          carteVerte: data.carteVerte,
          createdAt: now,
          keysPossessed: data.keysPossessed ?? 1,
          docsInPossession: data.docsInPossession || [],
          statutPhysique: initialStatus,
          historiqueStatuts: initialHistory,
          travauxReels: data.travauxReels || [],
          carteEssence: data.carteEssence || 'absente',
          carteGriseFormat: data.carteGriseFormat,
          autresDocumentsSpecifique: data.autresDocumentsSpecifique,
        };
        set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
        
        // Cloud Sync
        pushVehicle(vehicle);
        
        return vehicle;
      },
      updateVehicle: (id, updates) => {
        set((state) => {
          const nextVehicles = state.vehicles.map((v) => {
            if (v.id !== id) return v;

            const newStatus = updates.statutPhysique;
            let updatedHistory = [...(v.historiqueStatuts || [])];

            if (newStatus && newStatus !== v.statutPhysique) {
              const now = new Date().toISOString();
              updatedHistory = updatedHistory.map(h => 
                !h.end ? { ...h, end: now } : h
              );
              updatedHistory.push({
                id: uuidv4(),
                statut: newStatus,
                start: now,
                prestataire: (updates as any)._prestataire || '',
                commentaire: (updates as any)._commentaire || ''
              });
            }

            const cleanedUpdates = { ...updates };
            delete (cleanedUpdates as any)._prestataire;
            delete (cleanedUpdates as any)._commentaire;

            return {
              ...v,
              ...cleanedUpdates,
              historiqueStatuts: updatedHistory
            };
          });

          const updated = nextVehicles.find(v => v.id === id);
          if (updated) {
            // Cloud Sync
            pushVehicle(updated);
          }

          return { vehicles: nextVehicles };
        });
      },
      deleteVehicle: (id) => {
        set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) }));
        
        // Cloud Sync
        deleteVehicleFromCloud(id);
      },
      getByPlaque: (plaque) => get().vehicles.find((v) => v.plaque === plaque.toUpperCase().trim()),
    }),
    { name: 'automission-vehicles', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== CUSTOM TYPE STORE ====================
interface CustomTypeStore {
  customTypes: CustomMissionType[];
  addType: (data: Omit<CustomMissionType, 'id'>) => CustomMissionType;
  updateType: (id: string, updates: Partial<CustomMissionType>) => void;
  deleteType: (id: string) => void;
}

export const useCustomTypeStore = create<CustomTypeStore>()(
  persist(
    (set) => ({
      customTypes: [],
      addType: (data) => {
        const t: CustomMissionType = { id: uuidv4(), ...data };
        set((state) => ({ customTypes: [...state.customTypes, t] }));
        
        // Cloud Sync
        pushCustomType(t);
        
        return t;
      },
      updateType: (id, updates) => {
        set((state) => {
          const nextTypes = state.customTypes.map((t) => (t.id === id ? { ...t, ...updates } : t));
          const updated = nextTypes.find(t => t.id === id);
          if (updated) {
            // Cloud Sync
            pushCustomType(updated);
          }
          return { customTypes: nextTypes };
        });
      },
      deleteType: (id) => {
        set((state) => ({ customTypes: state.customTypes.filter((t) => t.id !== id) }));
        
        // Cloud Sync
        deleteCustomTypeFromCloud(id);
      },
    }),
    { name: 'automission-custom-types', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== DOCUMENT STORE ====================
interface DocumentStore {
  documents: AppDocument[];
  addDocument: (data: Partial<AppDocument> & { nom: string; type: AppDocument['type'] }) => AppDocument;
  deleteDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      documents: [],
      addDocument: (data) => {
        const doc: AppDocument = {
          id: uuidv4(),
          nom: data.nom,
          type: data.type,
          dataUrl: data.dataUrl,
          mimeType: data.mimeType,
          size: data.size,
          missionId: data.missionId,
          vehiculePlaque: data.vehiculePlaque,
          clientId: data.clientId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ documents: [doc, ...state.documents] }));
        void pushDocument(doc);
        return doc;
      },
      deleteDocument: (id) => {
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
        void deleteDocumentFromCloud(id);
      },
    }),
    { name: 'automission-documents', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== RAPPEL STORE ====================
interface RappelStore {
  rappels: Rappel[];
  addRappel: (data: Partial<Rappel> & { titre: string; date: string }) => Rappel;
  updateRappel: (id: string, updates: Partial<Rappel>) => void;
  deleteRappel: (id: string) => void;
  toggleComplete: (id: string) => void;
}

export const useRappelStore = create<RappelStore>()(
  persist(
    (set) => ({
      rappels: [],
      addRappel: (data) => {
        const rappel: Rappel = {
          id: uuidv4(),
          titre: data.titre,
          date: data.date,
          repetition: data.repetition || 'unique',
          missionId: data.missionId,
          vehiculePlaque: data.vehiculePlaque,
          clientId: data.clientId,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ rappels: [rappel, ...state.rappels] }));
        
        // Cloud Sync
        pushRappel(rappel);
        
        return rappel;
      },
      updateRappel: (id, updates) => {
        set((state) => {
          const nextRappels = state.rappels.map((r) => (r.id === id ? { ...r, ...updates } : r));
          const updated = nextRappels.find(r => r.id === id);
          if (updated) {
            // Cloud Sync
            pushRappel(updated);
          }
          return { rappels: nextRappels };
        });
      },
      deleteRappel: (id) => {
        set((state) => ({ rappels: state.rappels.filter((r) => r.id !== id) }));
        
        // Cloud Sync
        deleteRappelFromCloud(id);
      },
      toggleComplete: (id) => {
        set((state) => {
          const nextRappels = state.rappels.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
          const updated = nextRappels.find(r => r.id === id);
          if (updated) {
            // Cloud Sync
            pushRappel(updated);
          }
          return { rappels: nextRappels };
        });
      },
    }),
    { name: 'automission-rappels', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== SETTINGS STORE ====================
interface SettingsStore extends Settings {
  updateSettings: (updates: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (updates) => {
        set((state) => ({ ...state, ...updates }));
        void pushSettings(get());
      },
    }),
    { name: 'automission-settings', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

// ==================== EXPENSE TYPE STORE ====================
interface ExpenseTypeStore {
  customExpenseTypes: string[];
  addExpenseType: (name: string) => void;
}

export const useExpenseTypeStore = create<ExpenseTypeStore>()(
  persist(
    (set, get) => ({
      customExpenseTypes: [],
      addExpenseType: (name) => {
        name = name.trim();
        if (!name || get().customExpenseTypes.includes(name)) return;
        set((state) => ({
          customExpenseTypes: state.customExpenseTypes.includes(name)
            ? state.customExpenseTypes
            : [...state.customExpenseTypes, name],
        }));
        void pushExpenseType(name);
      },
    }),
    { name: 'automission-expense-types', storage: createJSONStorage(() => persistentStorage), skipHydration: true }
  )
);

let hydration: Promise<void> | undefined;

export function hydrateLocalStores() {
  hydration ??= (async () => {
    const stores = [useMissionStore, useClientStore, useVehicleStore, useCustomTypeStore,
      useDocumentStore, useRappelStore, useSettingsStore, useExpenseTypeStore];
    await Promise.all(stores.map(async (store) => {
      await store.persist.rehydrate();
      if (!store.persist.hasHydrated()) {
        throw new Error('Impossible de charger les données locales. Réessayez sans effacer les données du navigateur.');
      }
    }));
  })().catch((error: unknown) => {
    hydration = undefined;
    throw error;
  });
  return hydration;
}
