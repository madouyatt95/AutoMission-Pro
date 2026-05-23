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
export type VehicleType = 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire' | '4x4' | 'Coupé' | 'Cabriolet' | 'Monospace' | 'Poids lourd' | 'Moto' | 'Autre';
export type TireCondition = 'excellent' | 'bon' | 'moyen' | 'a_remplacer';
export type TirePosition = 'avant_gauche' | 'avant_droit' | 'arriere_gauche' | 'arriere_droit';
export type ExpenseType = 'Carburant' | 'Garage' | 'Speedy' | 'Lavage' | 'Péage' | 'Parking' | 'Autre';

export type PhysicalStatus = 'en_possession' | 'carrosserie' | 'debosselage' | 'speedy' | 'carglass' | 'garage' | 'controle_technique' | 'restitue' | 'autre';
export type TravailStatus = 'a_faire' | 'fait' | 'ne_pas_faire' | 'en_attente_devis' | 'en_cours';

export interface StatusHistoryEntry {
  id: string;
  statut: PhysicalStatus;
  start: string;
  end?: string;
  prestataire?: string;
  commentaire?: string;
}

export interface TravailReel {
  id: string;
  type: string;
  montant: number;
  statut: TravailStatus;
  commentaire?: string;
}

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
  typeVehicule?: VehicleType;
  dimensionsPneus?: string;
  carteGrise?: string; // dataUrl
  carteVerte?: string; // dataUrl
  createdAt: string;
  // Améliorations logistiques
  keysPossessed?: 0 | 1 | 2;
  docsInPossession?: string[];
  statutPhysique?: PhysicalStatus;
  historiqueStatuts?: StatusHistoryEntry[];
  travauxReels?: TravailReel[];
  carteEssence?: 'presente' | 'absente';
  carteGriseFormat?: 'original' | 'photocopie';
  autresDocumentsSpecifique?: string;
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
  statutAction?: 'a_faire' | 'aucune' | 'fait';
  typeReparation?: string;
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

// ==================== USURE PNEUS ====================
export interface UsurePneu {
  id: string;
  position: TirePosition;
  profondeur?: number; // mm
  etat: TireCondition;
  commentaire?: string;
  photos: Photo[];
}

// ==================== AVANCE DE FRAIS ====================
export interface AvanceFrais {
  id: string;
  type: string;
  montant: number;
  commentaire?: string;
  justificatif?: string; // dataUrl
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
  usurePneus?: UsurePneu[];
  avancesFrais?: AvanceFrais[];
  createdAt: string;
  updatedAt: string;
  // Améliorations logistiques partagées
  keysPossessed?: 0 | 1 | 2;
  docsInPossession?: string[];
  statutPhysique?: PhysicalStatus;
  historiqueStatuts?: StatusHistoryEntry[];
  travauxReels?: TravailReel[];
  carteEssence?: 'presente' | 'absente';
  carteGriseFormat?: 'original' | 'photocopie';
  autresDocumentsSpecifique?: string;
  pointDepart?: string;
  pointArrivee?: string;
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

export const VEHICLE_TYPES: VehicleType[] = [
  'Citadine', 'Berline', 'SUV', 'Utilitaire', '4x4', 'Coupé', 'Cabriolet', 'Monospace', 'Poids lourd', 'Moto', 'Autre'
];

export const TIRE_POSITIONS: { key: TirePosition; label: string }[] = [
  { key: 'avant_gauche', label: 'Avant gauche' },
  { key: 'avant_droit', label: 'Avant droit' },
  { key: 'arriere_gauche', label: 'Arrière gauche' },
  { key: 'arriere_droit', label: 'Arrière droit' },
];

export const TIRE_CONDITIONS: Record<TireCondition, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#10b981' },
  bon: { label: 'Bon', color: '#3b82f6' },
  moyen: { label: 'Moyen', color: '#f59e0b' },
  a_remplacer: { label: 'À remplacer', color: '#ef4444' },
};

export const EXPENSE_TYPES: string[] = [
  'Carburant', 'Garage', 'Speedy', 'Lavage', 'Péage', 'Parking', 'Autre'
];

export const PHYSICAL_STATUS_CONFIG: Record<PhysicalStatus, { label: string; color: string; bg: string }> = {
  en_possession: { label: 'En ma possession', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  carrosserie: { label: 'Carrosserie', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  debosselage: { label: 'Débosselage', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  speedy: { label: 'Speedy', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  carglass: { label: 'Carglass', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  garage: { label: 'Garage', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  controle_technique: { label: 'Contrôle technique', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  restitue: { label: 'Restitué', color: '#10b981', bg: 'rgba(16,185,129,0.25)' },
  autre: { label: 'Autre', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

export const TRAVAIL_STATUS_CONFIG: Record<TravailStatus, { label: string; color: string; bg: string }> = {
  a_faire: { label: 'À faire', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  fait: { label: 'Terminé', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ne_pas_faire: { label: 'Ne pas faire', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  en_attente_devis: { label: 'En attente devis', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  en_cours: { label: 'En cours', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};


