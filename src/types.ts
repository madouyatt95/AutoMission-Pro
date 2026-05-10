export type MissionStatus = 'a_facturer' | 'en_attente' | 'facture' | 'paye';
export type MissionType = 'Expertise' | 'Révision' | 'Rappel constructeur' | 'Nettoyage' | 'Transfert' | 'Pneus' | 'Convoyage' | 'Garage' | 'Vitrage' | 'État des lieux' | 'Restitution' | 'Livraison';
export type VehicleView = 'dessus' | 'avant' | 'arriere' | 'gauche' | 'droite';
export type DamageType = 'rayure' | 'impact' | 'enfonce' | 'casse' | 'fissure' | 'usure_pneus' | 'interieur' | 'autre';
export type VehicleCondition = 'excellent' | 'bon' | 'moyen' | 'mauvais';
export type DocumentType = 'carte_grise' | 'assurance' | 'bon_mission' | 'facture' | 'autre';
export type ReminderRepeat = 'unique' | 'hebdomadaire' | 'mensuelle';
export type FuelType = 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'GPL' | 'Autre';
export type GearboxType = 'Manuelle' | 'Automatique';
export type ClientType = 'particulier' | 'entreprise';

// ==================== VEHICLE ====================
export interface Vehicle {
  id: string;
  plaque: string;
  marque?: string;
  modele?: string;
  finition?: string;
  annee?: number;
  motorisation?: string;
  carburant?: FuelType;
  boiteVitesses?: GearboxType;
  couleur?: string;
  kilometrage?: number;
  vin?: string;
  createdAt: string;
}

// ==================== CUSTOM MISSION TYPES ====================
export interface CustomMissionType {
  id: string;
  nom: string;
  couleur: string;
}

// ==================== DEGATS ====================
export interface Degat {
  id: string;
  piece: string;
  vue: VehicleView;
  type: DamageType;
  commentaire?: string;
  photos: Photo[];
  x?: number;
  y?: number;
}

export interface Photo {
  id: string;
  dataUrl: string;
  timestamp: string;
  caption?: string;
}

export interface VoiceNote {
  id: string;
  dataUrl: string;
  duration: number;
  timestamp: string;
}

// ==================== PRESTATION FACTURATION ====================
export interface Prestation {
  id: string;
  type: string;
  prixTTC: number;
  clientId?: string;
  clientName?: string;
  statut: 'a_facturer' | 'facture' | 'paye';
}

// ==================== CLIENT FACTURATION ====================
export interface ClientFacturation {
  clientId: string;
  clientName: string;
  montantTTC: number;
  dateFacturation?: string;
  facturationDifferee: boolean;
  statut: 'a_facturer' | 'facture' | 'paye';
  notesInternes?: string;
}

// ==================== MISSION ====================
export interface Mission {
  id: string;
  plaque: string;
  types: string[]; // multiple types (built-in + custom)
  type: string; // kept for backward compat, = types[0]
  dateTime: string;
  vehicleId?: string;
  kilometrage?: number;
  couleur?: string;
  etatGeneral?: VehicleCondition;
  degats: Degat[];
  photos: Photo[];
  notesTexte?: string;
  notesVocales: VoiceNote[];
  prixTTC?: number;
  prixManuel?: boolean;
  geolocation?: { lat: number; lng: number; address?: string };
  statut: MissionStatus;
  clients: ClientFacturation[]; // Keeping this for backward compatibility and general mission clients
  prestations: Prestation[]; // The new detailed tasks for billing
  documents: AppDocument[];
  brouillon: boolean;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== PDF OPTIONS ====================
export interface PdfOptions {
  inclureNotes: boolean;
  inclurePrix: boolean;
  inclureVocales: boolean;
  inclureDocuments: boolean;
}

// ==================== SETTINGS ====================
export interface Settings {
  tva: number;
  companyName: string;
}

// ==================== CLIENT ====================
export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  notes?: string;
  type?: ClientType;
  conditionsPaiement?: string;
  siret?: string;
  createdAt: string;
}

// ==================== DOCUMENT ====================
export interface AppDocument {
  id: string;
  nom: string;
  type: DocumentType;
  dataUrl?: string;
  missionId?: string;
  vehiculePlaque?: string;
  clientId?: string;
  createdAt: string;
}

// ==================== RAPPEL ====================
export interface Rappel {
  id: string;
  titre: string;
  date: string;
  repetition: ReminderRepeat;
  missionId?: string;
  vehiculePlaque?: string;
  clientId?: string;
  completed: boolean;
  createdAt: string;
}

// ==================== CONSTANTS ====================
export const MISSION_TYPES: MissionType[] = [
  'Expertise', 'Révision', 'Rappel constructeur', 'Nettoyage',
  'Transfert', 'Pneus', 'Convoyage', 'Garage',
  'Vitrage', 'État des lieux', 'Restitution', 'Livraison'
];

export const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string }> = {
  a_facturer: { label: 'À facturer', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  en_attente: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  facture: { label: 'Facturé', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  paye: { label: 'Payé', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

export const DAMAGE_TYPES: Record<DamageType, string> = {
  rayure: 'Rayure',
  impact: 'Impact',
  enfonce: 'Enfoncé',
  casse: 'Cassé',
  fissure: 'Fissure',
  usure_pneus: 'Usure pneus',
  interieur: 'Intérieur',
  autre: 'Autre',
};

export const VEHICLE_PARTS: Record<VehicleView, string[]> = {
  droite: ['Porte avant droite', 'Porte arrière droite', 'Aile avant droite', 'Aile arrière droite', 'Bas de caisse droit', 'Rétroviseur droit'],
  gauche: ['Porte avant gauche', 'Porte arrière gauche', 'Aile avant gauche', 'Aile arrière gauche', 'Bas de caisse gauche', 'Rétroviseur gauche'],
  avant: ['Capot', 'Pare-choc avant', 'Phares', 'Calandre', 'Pare-brise'],
  arriere: ['Coffre', 'Pare-choc arrière', 'Feux arrière', 'Lunette arrière'],
  dessus: ['Toit', 'Capot', 'Coffre', 'Pare-brise', 'Vitres latérales'],
};

export const DOCUMENT_TYPES: Record<DocumentType, string> = {
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  bon_mission: 'Bon de mission',
  facture: 'Facture',
  autre: 'Autre document',
};

export const VEHICLE_COLORS = [
  'Blanc', 'Noir', 'Gris', 'Argent', 'Bleu', 'Rouge', 'Vert', 'Beige', 'Marron', 'Orange', 'Jaune', 'Autre'
];

export const FUEL_TYPES: FuelType[] = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL', 'Autre'];
export const GEARBOX_TYPES: GearboxType[] = ['Manuelle', 'Automatique'];

export const CAR_BRANDS = [
  'Renault', 'Peugeot', 'Citroën', 'Dacia', 'BMW', 'Mercedes', 'Audi',
  'Volkswagen', 'Toyota', 'Tesla', 'Ford', 'Opel', 'Fiat', 'Hyundai',
  'Kia', 'Nissan', 'Seat', 'Skoda', 'Volvo', 'Mini', 'Porsche', 'Autre'
];

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  excellent: 'Excellent',
  bon: 'Bon',
  moyen: 'Moyen',
  mauvais: 'Mauvais',
};
