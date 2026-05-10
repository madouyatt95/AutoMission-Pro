import { Mission, Client, Rappel, AppDocument, MissionStatus, Vehicle } from './types';
import { v4 as uuidv4 } from 'uuid';

const clientNames = [
  'ALD Automotive', 'Arval France', 'LeasePlan', 'Alphabet France', 'Sixt', 
  'Hertz', 'Avis', 'Europcar', 'Entreprise Dupont', 'SARL Martin', 
  'Garage de la Gare', 'Concession Peugeot', 'Concession Renault', 'Société Générale Fleet', 
  'BNP Paribas Mobility', 'Particulier - J. Martin', 'Particulier - P. Dubois', 
  'Particulier - M. Leroy', 'Particulier - S. Roux', 'Particulier - L. Morel'
];

const clientsData: Client[] = clientNames.map((nom, i) => ({
  id: `c${i + 1}`,
  nom,
  email: `contact@${nom.toLowerCase().replace(/ /g, '').replace(/particulier-/g, '')}.fr`,
  telephone: `0${Math.floor(600000000 + Math.random() * 100000000)}`.replace(/(\d{2})(?=\d)/g, '$1 '),
  adresse: `${Math.floor(Math.random() * 100) + 1} Rue de Paris, ${['Paris', 'Lyon', 'Marseille', 'Nantes', 'Bordeaux', 'Lille'][Math.floor(Math.random() * 6)]}`,
  notes: Math.random() > 0.5 ? 'Client prioritaire' : '',
  type: (nom.startsWith('Particulier') ? 'particulier' : 'entreprise') as 'particulier' | 'entreprise',
  conditionsPaiement: ['30 jours', '45 jours', '60 jours', 'Paiement immédiat'][Math.floor(Math.random() * 4)],
  siret: nom.startsWith('Particulier') ? undefined : `${Math.floor(10000000000000 + Math.random() * 89999999999999)}`,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
}));

const plaques = Array.from({ length: 40 }, () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  return `${chars[Math.floor(Math.random()*26)]}${chars[Math.floor(Math.random()*26)]}-${nums[Math.floor(Math.random()*10)]}${nums[Math.floor(Math.random()*10)]}${nums[Math.floor(Math.random()*10)]}-${chars[Math.floor(Math.random()*26)]}${chars[Math.floor(Math.random()*26)]}`;
});

const marques = ['Renault', 'Peugeot', 'Citroën', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Tesla', 'Dacia'];
const modeles: Record<string, string[]> = {
  'Renault': ['Clio V', 'Mégane', 'Captur', 'Kadjar', 'Zoé'],
  'Peugeot': ['208', '308', '3008', '5008', '2008'],
  'Citroën': ['C3', 'C4', 'C5 Aircross', 'Berlingo'],
  'BMW': ['Série 1', 'Série 3', 'X1', 'X3', 'X5'],
  'Mercedes': ['Classe A', 'Classe C', 'GLA', 'GLC', 'Vito'],
  'Audi': ['A1', 'A3', 'A4', 'Q3', 'Q5'],
  'Volkswagen': ['Golf 8', 'Polo', 'T-Roc', 'Tiguan', 'ID.4'],
  'Toyota': ['Yaris', 'Corolla', 'C-HR', 'RAV4'],
  'Tesla': ['Model 3', 'Model Y', 'Model S'],
  'Dacia': ['Sandero', 'Duster', 'Spring', 'Jogger'],
};

const vehiclesData: Vehicle[] = plaques.map((plaque, i) => {
  const marque = marques[i % marques.length];
  const modList = modeles[marque] || ['Standard'];
  return {
    id: `v${i + 1}`,
    plaque,
    marque,
    modele: modList[Math.floor(Math.random() * modList.length)],
    annee: 2018 + Math.floor(Math.random() * 7),
    carburant: (['Essence', 'Diesel', 'Hybride', 'Électrique'] as const)[Math.floor(Math.random() * 4)],
    boiteVitesses: (Math.random() > 0.4 ? 'Automatique' : 'Manuelle') as 'Manuelle' | 'Automatique',
    couleur: ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Argent'][Math.floor(Math.random() * 6)],
    kilometrage: Math.floor(Math.random() * 150000) + 1000,
    vin: Math.random() > 0.5 ? `VF1${Math.random().toString(36).substring(2, 15).toUpperCase()}` : undefined,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
  };
});

const couleurs = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Argent'];
const types = ['Expertise', 'Révision', 'Rappel constructeur', 'Nettoyage', 'Transfert', 'Pneus', 'Convoyage', 'Garage', 'Vitrage', 'État des lieux', 'Restitution', 'Livraison'];
const statuts: MissionStatus[] = ['a_facturer', 'en_attente', 'facture', 'paye'];
const etats: ('excellent' | 'bon' | 'moyen' | 'mauvais')[] = ['excellent', 'bon', 'moyen', 'mauvais'];

function generateMissions(): Mission[] {
  const missions: Mission[] = [];
  
  for (let i = 0; i < 80; i++) {
    const dt = new Date();
    dt.setDate(dt.getDate() - Math.floor(Math.random() * 60));
    dt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    
    const hasDegats = Math.random() > 0.6;
    const degatsList = [];
    if (hasDegats) {
      const numDegats = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numDegats; j++) {
        degatsList.push({
          id: uuidv4(),
          piece: ['Pare-choc avant', 'Porte avant gauche', 'Aile arrière droite', 'Pare-brise', 'Coffre'][Math.floor(Math.random() * 5)],
          vue: ['avant', 'arriere', 'gauche', 'droite', 'dessus'][Math.floor(Math.random() * 5)] as any,
          type: ['rayure', 'impact', 'enfonce', 'casse', 'fissure', 'usure_pneus', 'interieur', 'autre'][Math.floor(Math.random() * 8)] as any,
          commentaire: Math.random() > 0.5 ? 'Dommage constaté sur place' : '',
          photos: []
        });
      }
    }

    const numClients = Math.random() > 0.7 ? 2 : 1;
    const missionClients = [];
    const statut = statuts[Math.floor(Math.random() * statuts.length)];
    const prix = Math.floor(Math.random() * 400) + 50;
    
    for (let c = 0; c < numClients; c++) {
      const clientId = clientsData[Math.floor(Math.random() * clientsData.length)].id;
      const montant = numClients > 1 ? Math.floor(prix / numClients) : prix;
      missionClients.push({
        clientId,
        clientName: clientsData.find(cl => cl.id === clientId)?.nom || '',
        montantTTC: montant,
        facturationDifferee: false,
        statut: (statut === 'paye' ? 'paye' : statut === 'facture' ? 'facture' : 'a_facturer') as any,
        notesInternes: ''
      });
    }

    const numTypes = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 2 : 1;
    const missionTypes: string[] = [];
    for (let t = 0; t < numTypes; t++) {
      const typ = types[Math.floor(Math.random() * types.length)];
      if (!missionTypes.includes(typ)) missionTypes.push(typ);
    }

    const vehicleIdx = Math.floor(Math.random() * vehiclesData.length);
    const vehicle = vehiclesData[vehicleIdx];

    missions.push({
      id: uuidv4(),
      plaque: vehicle.plaque,
      types: missionTypes,
      type: missionTypes[0],
      dateTime: dt.toISOString(),
      vehicleId: vehicle.id,
      kilometrage: vehicle.kilometrage,
      couleur: vehicle.couleur,
      etatGeneral: etats[Math.floor(Math.random() * etats.length)],
      degats: degatsList,
      photos: [],
      notesTexte: hasDegats ? 'Véhicule avec dommages, voir photos.' : 'Véhicule en bon état général.',
      notesVocales: [],
      prixTTC: prix,
      geolocation: { lat: 48.8566 + (Math.random() - 0.5) * 0.5, lng: 2.3522 + (Math.random() - 0.5) * 0.5 },
      statut: statut,
      clients: missionClients,
      documents: [],
      brouillon: false,
      createdAt: dt.toISOString(),
      updatedAt: dt.toISOString(),
    });
  }
  return missions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

function generateRappels(): Rappel[] {
  const rappels: Rappel[] = [];
  const today = new Date();
  
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + (Math.floor(Math.random() * 20) - 5));
    
    rappels.push({
      id: uuidv4(),
      titre: ['Facturer mission', 'Relance paiement client', 'Récupérer véhicule', 'Appeler assurance', 'Envoyer rapport d\'expertise'][Math.floor(Math.random() * 5)] + ' ' + (Math.random() > 0.5 ? plaques[Math.floor(Math.random() * plaques.length)] : ''),
      date: d.toISOString().split('T')[0],
      repetition: ['unique', 'hebdomadaire', 'mensuelle'][Math.floor(Math.random() * 3)] as any,
      vehiculePlaque: Math.random() > 0.7 ? plaques[Math.floor(Math.random() * plaques.length)] : undefined,
      clientId: Math.random() > 0.7 ? clientsData[Math.floor(Math.random() * clientsData.length)].id : undefined,
      completed: d < today ? Math.random() > 0.3 : false,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
    });
  }
  return rappels;
}

function generateDocuments(): AppDocument[] {
  const docs: AppDocument[] = [];
  for (let i = 0; i < 50; i++) {
    docs.push({
      id: uuidv4(),
      nom: `Document_${Math.floor(Math.random()*1000)}.pdf`,
      type: ['carte_grise', 'assurance', 'bon_mission', 'facture', 'autre'][Math.floor(Math.random()*5)] as any,
      vehiculePlaque: Math.random() > 0.4 ? plaques[Math.floor(Math.random() * plaques.length)] : undefined,
      clientId: Math.random() > 0.4 ? clientsData[Math.floor(Math.random() * clientsData.length)].id : undefined,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString()
    });
  }
  return docs;
}

export const seedData = {
  clients: clientsData,
  missions: generateMissions(),
  rappels: generateRappels(),
  documents: generateDocuments(),
  vehicles: vehiclesData,
};

export function initializeSeedData() {
  const isSeeded = localStorage.getItem('automission-seeded-v3');
  if (isSeeded) return false;

  // Clear old seed
  localStorage.removeItem('automission-seeded-v2');

  const missionStore = { state: { missions: seedData.missions } };
  const clientStore = { state: { clients: seedData.clients } };
  const rappelStore = { state: { rappels: seedData.rappels } };
  const docStore = { state: { documents: seedData.documents } };
  const vehicleStore = { state: { vehicles: seedData.vehicles } };

  localStorage.setItem('automission-missions', JSON.stringify(missionStore));
  localStorage.setItem('automission-clients', JSON.stringify(clientStore));
  localStorage.setItem('automission-rappels', JSON.stringify(rappelStore));
  localStorage.setItem('automission-documents', JSON.stringify(docStore));
  localStorage.setItem('automission-vehicles', JSON.stringify(vehicleStore));

  localStorage.setItem('automission-seeded-v3', 'true');
  return true;
}
