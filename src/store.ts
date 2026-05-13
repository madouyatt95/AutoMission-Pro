import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, Client, AppDocument, Rappel, MissionStatus, Vehicle, CustomMissionType, VehicleType } from './types';
import { v4 as uuidv4 } from 'uuid';

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
          usurePneus: data.usurePneus || [],
          avancesFrais: data.avancesFrais || [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ missions: [mission, ...state.missions] }));
        return mission;
      },
      updateMission: (id, updates) => {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      deleteMission: (id) => {
        set((state) => ({ missions: state.missions.filter((m) => m.id !== id) }));
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
        return dup;
      },
      getMissionsByPlaque: (plaque) => get().missions.filter((m) => m.plaque === plaque.toUpperCase()),
      getMissionsByStatus: (status) => get().missions.filter((m) => m.statut === status),
      getMissionsByClient: (clientId) => get().missions.filter((m) => m.clients.some((c) => c.clientId === clientId)),
    }),
    { name: 'automission-missions' }
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
        return client;
      },
      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },
      deleteClient: (id) => {
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
      },
    }),
    { name: 'automission-clients' }
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
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
        return vehicle;
      },
      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        }));
      },
      deleteVehicle: (id) => {
        set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) }));
      },
      getByPlaque: (plaque) => get().vehicles.find((v) => v.plaque === plaque.toUpperCase().trim()),
    }),
    { name: 'automission-vehicles' }
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
        return t;
      },
      updateType: (id, updates) => {
        set((state) => ({
          customTypes: state.customTypes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },
      deleteType: (id) => {
        set((state) => ({ customTypes: state.customTypes.filter((t) => t.id !== id) }));
      },
    }),
    { name: 'automission-custom-types' }
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
          missionId: data.missionId,
          vehiculePlaque: data.vehiculePlaque,
          clientId: data.clientId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ documents: [doc, ...state.documents] }));
        return doc;
      },
      deleteDocument: (id) => {
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
      },
    }),
    { name: 'automission-documents' }
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
        return rappel;
      },
      updateRappel: (id, updates) => {
        set((state) => ({
          rappels: state.rappels.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },
      deleteRappel: (id) => {
        set((state) => ({ rappels: state.rappels.filter((r) => r.id !== id) }));
      },
      toggleComplete: (id) => {
        set((state) => ({
          rappels: state.rappels.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
        }));
      },
    }),
    { name: 'automission-rappels' }
  )
);

// ==================== SETTINGS STORE ====================
interface SettingsStore {
  tva: number;
  companyName: string;
  autoAlertDaysFacturation: number;
  autoAlertDaysRelance: number;
  updateSettings: (updates: Partial<{ tva: number; companyName: string; autoAlertDaysFacturation: number; autoAlertDaysRelance: number }>) => void;
}

// ==================== EXPENSE TYPE STORE ====================
interface ExpenseTypeStore {
  customExpenseTypes: string[];
  addExpenseType: (name: string) => void;
}

export const useExpenseTypeStore = create<ExpenseTypeStore>()(
  persist(
    (set) => ({
      customExpenseTypes: [],
      addExpenseType: (name) => {
        set((state) => ({
          customExpenseTypes: state.customExpenseTypes.includes(name)
            ? state.customExpenseTypes
            : [...state.customExpenseTypes, name],
        }));
      },
    }),
    { name: 'automission-expense-types' }
  )
);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      tva: 20,
      companyName: 'AutoMission Services',
      autoAlertDaysFacturation: 1,
      autoAlertDaysRelance: 3,
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    { name: 'automission-settings' }
  )
);
