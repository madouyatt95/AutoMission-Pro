export type MissionStatus = 'a_facturer' | 'en_attente' | 'facture' | 'paye';
export type MissionType = 'Expertise' | 'Révision' | 'Rappel constructeur' | 'Nettoyage' | 'Transfert' | 'Pneus' | 'Convoyage' | 'Garage' | 'Vitrage' | 'État des lieux' | 'Restitution' | 'Livraison';
export type VehicleView = 'dessus' | 'avant' | 'arriere' | 'gauche' | 'droite';
export type DamageType = 'rayure' | 'impact' | 'enfonce' | 'casse' | 'pare_brise' | 'usure_pneus' | 'interieur' | 'autre';
export type VehicleCondition = 'excellent' | 'bon' | 'moyen' | 'mauvais';
export type DocumentType = 'carte_grise' | 'assurance' | 'bon_mission' | 'facture' | 'autre';
export type ReminderRepeat = 'unique' | 'hebdomadaire' | 'mensuelle';

export interface Degat {
  id: string;
  piece: string;
  vue: VehicleView;
  type: DamageType;
  commentaire?: string;
  photoId?: string;
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

export interface ClientFacturation {
  clientId: string;
  clientName: string;
  montantTTC: number;
  dateFacturation?: string;
  facturationDifferee: boolean;
  statut: 'a_facturer' | 'facture' | 'paye';
  notesInternes?: string;
}

export interface Mission {
  id: string;
  plaque: string;
  type: MissionType;
  dateTime: string;
  kilometrage?: number;
  couleur?: string;
  etatGeneral?: VehicleCondition;
  degats: Degat[];
  photos: Photo[];
  notesTexte?: string;
  notesVocales: VoiceNote[];
  prixTTC?: number;
  geolocation?: { lat: number; lng: number; address?: string };
  statut: MissionStatus;
  clients: ClientFacturation[];
  documents: AppDocument[];
  brouillon: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  notes?: string;
  createdAt: string;
}

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
  pare_brise: 'Pare-brise',
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

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  excellent: 'Excellent',
  bon: 'Bon',
  moyen: 'Moyen',
  mauvais: 'Mauvais',
};
