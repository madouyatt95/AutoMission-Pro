import { Mission, Client, Rappel, AppDocument, MissionType, MissionStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

const clientsData: Client[] = [
  { id: 'c1', nom: 'ALD Automotive', email: 'contact@ald.fr', telephone: '01 44 55 66 77', adresse: '14 Rue de la Paix, Paris', notes: 'Contrat cadre flotte', createdAt: '2026-01-15T08:00:00Z' },
  { id: 'c2', nom: 'Arval France', email: 'missions@arval.fr', telephone: '01 33 22 11 00', adresse: '22 Avenue des Champs, Lyon', notes: 'Facturation mensuelle', createdAt: '2026-02-01T09:00:00Z' },
  { id: 'c3', nom: 'LeasePlan', email: 'service@leaseplan.fr', telephone: '01 55 44 33 22', adresse: '8 Rue du Lac, Marseille', notes: '', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'c4', nom: 'Alphabet France', email: 'fleet@alphabet.fr', telephone: '01 66 77 88 99', adresse: '5 Boulevard Haussmann, Paris', notes: 'Client prioritaire', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'c5', nom: 'Particulier - M. Dupont', email: 'jean.dupont@email.fr', telephone: '06 12 34 56 78', adresse: '12 Rue des Lilas, Nantes', notes: '', createdAt: '2026-03-15T14:00:00Z' },
];

const plaques = ['AB-123-CD', 'EF-456-GH', 'IJ-789-KL', 'MN-012-OP', 'QR-345-ST', 'UV-678-WX', 'YZ-901-AB', 'CD-234-EF', 'GH-567-IJ', 'KL-890-MN'];
const couleurs = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Argent'];
const types: MissionType[] = ['Expertise', 'Révision', 'Transfert', 'Pneus', 'Convoyage', 'État des lieux', 'Restitution', 'Livraison', 'Nettoyage', 'Vitrage'];
const statuts: MissionStatus[] = ['a_facturer', 'en_attente', 'facture', 'paye'];
const etats: ('excellent' | 'bon' | 'moyen' | 'mauvais')[] = ['excellent', 'bon', 'moyen', 'mauvais'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function generateMissions(): Mission[] {
  const missions: Mission[] = [];

  const missionConfigs = [
    { plaque: 'AB-123-CD', type: 'Expertise' as MissionType, statut: 'a_facturer' as MissionStatus, prix: 150, client: 'c1', couleur: 'Blanc', etat: 'bon' as const, km: 45230, days: 0, degats: [
      { id: uuidv4(), piece: 'Porte avant droite', vue: 'droite' as const, type: 'rayure' as const, commentaire: 'Rayure 15cm sur poignée' },
      { id: uuidv4(), piece: 'Pare-choc avant', vue: 'avant' as const, type: 'impact' as const, commentaire: 'Impact léger coin gauche' },
    ]},
    { plaque: 'EF-456-GH', type: 'Restitution' as MissionType, statut: 'facture' as MissionStatus, prix: 85, client: 'c2', couleur: 'Noir', etat: 'moyen' as const, km: 78450, days: 2, degats: [
      { id: uuidv4(), piece: 'Aile arrière gauche', vue: 'gauche' as const, type: 'enfonce' as const, commentaire: 'Enfoncement parking' },
    ]},
    { plaque: 'IJ-789-KL', type: 'Transfert' as MissionType, statut: 'paye' as MissionStatus, prix: 200, client: 'c1', couleur: 'Gris', etat: 'excellent' as const, km: 12300, days: 5, degats: [] },
    { plaque: 'MN-012-OP', type: 'Pneus' as MissionType, statut: 'en_attente' as MissionStatus, prix: 320, client: 'c3', couleur: 'Bleu', etat: 'bon' as const, km: 55000, days: 1, degats: [
      { id: uuidv4(), piece: 'Toit', vue: 'dessus' as const, type: 'rayure' as const },
    ]},
    { plaque: 'QR-345-ST', type: 'Convoyage' as MissionType, statut: 'a_facturer' as MissionStatus, prix: 180, client: 'c4', couleur: 'Rouge', etat: 'bon' as const, km: 33000, days: 0, degats: [] },
    { plaque: 'AB-123-CD', type: 'Nettoyage' as MissionType, statut: 'paye' as MissionStatus, prix: 65, client: 'c1', couleur: 'Blanc', etat: 'bon' as const, km: 45100, days: 15, degats: [] },
    { plaque: 'UV-678-WX', type: 'État des lieux' as MissionType, statut: 'facture' as MissionStatus, prix: 120, client: 'c2', couleur: 'Argent', etat: 'moyen' as const, km: 89000, days: 3, degats: [
      { id: uuidv4(), piece: 'Pare-brise', vue: 'avant' as const, type: 'pare_brise' as const, commentaire: 'Impact étoilé côté passager' },
      { id: uuidv4(), piece: 'Rétroviseur gauche', vue: 'gauche' as const, type: 'casse' as const, commentaire: 'Coque cassée' },
    ]},
    { plaque: 'YZ-901-AB', type: 'Livraison' as MissionType, statut: 'paye' as MissionStatus, prix: 95, client: 'c5', couleur: 'Noir', etat: 'excellent' as const, km: 5200, days: 7, degats: [] },
    { plaque: 'CD-234-EF', type: 'Vitrage' as MissionType, statut: 'en_attente' as MissionStatus, prix: 450, client: 'c3', couleur: 'Blanc', etat: 'mauvais' as const, km: 102000, days: 1, degats: [
      { id: uuidv4(), piece: 'Pare-brise', vue: 'avant' as const, type: 'pare_brise' as const, commentaire: 'Fissure traversante' },
    ]},
    { plaque: 'GH-567-IJ', type: 'Révision' as MissionType, statut: 'a_facturer' as MissionStatus, prix: 280, client: 'c4', couleur: 'Gris', etat: 'bon' as const, km: 67800, days: 0, degats: [] },
    { plaque: 'EF-456-GH', type: 'Expertise' as MissionType, statut: 'a_facturer' as MissionStatus, prix: 150, client: 'c2', couleur: 'Noir', etat: 'moyen' as const, km: 78500, days: 0, degats: [
      { id: uuidv4(), piece: 'Coffre', vue: 'arriere' as const, type: 'enfonce' as const, commentaire: 'Léger enfoncement' },
    ]},
    { plaque: 'KL-890-MN', type: 'Rappel constructeur' as MissionType, statut: 'facture' as MissionStatus, prix: 0, client: 'c1', couleur: 'Bleu', etat: 'bon' as const, km: 23400, days: 10, degats: [] },
    { plaque: 'AB-123-CD', type: 'Transfert' as MissionType, statut: 'paye' as MissionStatus, prix: 175, client: 'c1', couleur: 'Blanc', etat: 'bon' as const, km: 44800, days: 30, degats: [] },
    { plaque: 'MN-012-OP', type: 'Garage' as MissionType, statut: 'facture' as MissionStatus, prix: 90, client: 'c3', couleur: 'Bleu', etat: 'bon' as const, km: 54500, days: 20, degats: [] },
    { plaque: 'QR-345-ST', type: 'Nettoyage' as MissionType, statut: 'paye' as MissionStatus, prix: 55, client: 'c4', couleur: 'Rouge', etat: 'bon' as const, km: 32800, days: 25, degats: [] },
  ];

  for (const cfg of missionConfigs) {
    const dt = new Date();
    dt.setDate(dt.getDate() - cfg.days);
    dt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    
    const mission: Mission = {
      id: uuidv4(),
      plaque: cfg.plaque,
      type: cfg.type,
      dateTime: dt.toISOString(),
      kilometrage: cfg.km,
      couleur: cfg.couleur,
      etatGeneral: cfg.etat,
      degats: cfg.degats,
      photos: [],
      notesTexte: cfg.degats.length > 0 ? 'Dégâts constatés lors de l\'inspection.' : 'RAS - Véhicule en bon état.',
      notesVocales: [],
      prixTTC: cfg.prix,
      geolocation: { lat: 48.8566 + (Math.random() - 0.5) * 0.1, lng: 2.3522 + (Math.random() - 0.5) * 0.1 },
      statut: cfg.statut,
      clients: [{ clientId: cfg.client, clientName: clientsData.find(c => c.id === cfg.client)?.nom || '', montantTTC: cfg.prix, facturationDifferee: false, statut: cfg.statut === 'paye' ? 'paye' : cfg.statut === 'facture' ? 'facture' : 'a_facturer', notesInternes: '' }],
      documents: [],
      brouillon: false,
      createdAt: dt.toISOString(),
      updatedAt: dt.toISOString(),
    };
    missions.push(mission);
  }

  return missions;
}

function generateRappels(): Rappel[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    { id: uuidv4(), titre: 'Facturer mission AB-123-CD', date: today.toISOString().split('T')[0], repetition: 'unique', vehiculePlaque: 'AB-123-CD', completed: false, createdAt: yesterday.toISOString() },
    { id: uuidv4(), titre: 'Relance paiement Arval', date: yesterday.toISOString().split('T')[0], repetition: 'unique', clientId: 'c2', completed: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: uuidv4(), titre: 'Récupérer véhicule MN-012-OP', date: tomorrow.toISOString().split('T')[0], repetition: 'unique', vehiculePlaque: 'MN-012-OP', completed: false, createdAt: today.toISOString() },
    { id: uuidv4(), titre: 'Rapport hebdomadaire', date: nextWeek.toISOString().split('T')[0], repetition: 'hebdomadaire', completed: false, createdAt: today.toISOString() },
    { id: uuidv4(), titre: 'Vérifier statut CD-234-EF', date: today.toISOString().split('T')[0], repetition: 'unique', vehiculePlaque: 'CD-234-EF', completed: true, createdAt: yesterday.toISOString() },
  ];
}

function generateDocuments(): AppDocument[] {
  return [
    { id: uuidv4(), nom: 'CG_AB123CD.pdf', type: 'carte_grise', vehiculePlaque: 'AB-123-CD', createdAt: '2026-01-15T10:00:00Z' },
    { id: uuidv4(), nom: 'Assurance_EF456GH.pdf', type: 'assurance', vehiculePlaque: 'EF-456-GH', clientId: 'c2', createdAt: '2026-02-01T09:00:00Z' },
    { id: uuidv4(), nom: 'BonMission_20260510.pdf', type: 'bon_mission', missionId: 'will-be-linked', vehiculePlaque: 'IJ-789-KL', createdAt: '2026-05-05T08:00:00Z' },
    { id: uuidv4(), nom: 'Facture_ALD_Mars.pdf', type: 'facture', clientId: 'c1', createdAt: '2026-03-31T16:00:00Z' },
    { id: uuidv4(), nom: 'Facture_Arval_Avril.pdf', type: 'facture', clientId: 'c2', createdAt: '2026-04-30T16:00:00Z' },
  ];
}

export const seedData = {
  clients: clientsData,
  missions: generateMissions(),
  rappels: generateRappels(),
  documents: generateDocuments(),
};

export function initializeSeedData() {
  const isSeeded = localStorage.getItem('automission-seeded');
  if (isSeeded) return false;

  const missionStore = JSON.parse(localStorage.getItem('automission-missions') || '{"state":{"missions":[]}}');
  const clientStore = JSON.parse(localStorage.getItem('automission-clients') || '{"state":{"clients":[]}}');
  const rappelStore = JSON.parse(localStorage.getItem('automission-rappels') || '{"state":{"rappels":[]}}');
  const docStore = JSON.parse(localStorage.getItem('automission-documents') || '{"state":{"documents":[]}}');

  if (missionStore.state.missions.length === 0) {
    missionStore.state.missions = seedData.missions;
    localStorage.setItem('automission-missions', JSON.stringify(missionStore));
  }
  if (clientStore.state.clients.length === 0) {
    clientStore.state.clients = seedData.clients;
    localStorage.setItem('automission-clients', JSON.stringify(clientStore));
  }
  if (rappelStore.state.rappels.length === 0) {
    rappelStore.state.rappels = seedData.rappels;
    localStorage.setItem('automission-rappels', JSON.stringify(rappelStore));
  }
  if (docStore.state.documents.length === 0) {
    docStore.state.documents = seedData.documents;
    localStorage.setItem('automission-documents', JSON.stringify(docStore));
  }

  localStorage.setItem('automission-seeded', 'true');
  return true;
}
