import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Car, FileText, Bell, Clock, AlertTriangle, ChevronRight, Trash2, Upload, Edit2, Key, DollarSign, Wrench, CheckCircle } from 'lucide-react';
import { useMissionStore, useVehicleStore, useDocumentStore, useClientStore } from '../store';
import { STATUS_CONFIG, DAMAGE_TYPES, VEHICLE_TYPES, VehicleType, PHYSICAL_STATUS_CONFIG, TRAVAIL_STATUS_CONFIG, PhysicalStatus, TravailStatus, TravailReel } from '../types';
import SafeModal from '../components/SafeModal';
import { v4 as uuidv4 } from 'uuid';

export function formatDuration(startStr: string, endStr?: string) {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return '0 min';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return `${diffDays}j ${remainingHours}h`;
  }
  if (diffHours > 0) {
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  }
  return `${diffMins} min`;
}

export default function VehicleHistory() {
  const { plaque } = useParams();
  const navigate = useNavigate();
  const { missions } = useMissionStore();
  const { vehicles, updateVehicle } = useVehicleStore();
  const { documents } = useDocumentStore();
  const { clients } = useClientStore();

  const decodedPlaque = decodeURIComponent(plaque || '');
  const vehicle = vehicles.find(v => v.plaque === decodedPlaque);
  const vehicleMissions = missions
    .filter(m => m.plaque === decodedPlaque)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const vehicleDocs = documents.filter(d => d.vehiculePlaque === decodedPlaque);
  const allDegats = vehicleMissions.flatMap(m => m.degats);
  const totalCA = vehicleMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
  const unpaid = vehicleMissions.reduce((s, m) => s + m.clients.filter(c => c.statut !== 'paye').reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const allClientIds = [...new Set(vehicleMissions.flatMap(m => m.clients.map(c => c.clientId)))];
  const associatedClients = clients.filter(c => allClientIds.includes(c.id));
  const lastMission = vehicleMissions[0];
  const lastClient = lastMission?.clients[0]?.clientName;

  const [editing, setEditing] = useState(false);
  const carteGriseRef = useRef<HTMLInputElement>(null);
  const carteVerteRef = useRef<HTMLInputElement>(null);

  // States pour les travaux et statuts physiques
  const [showAddTravail, setShowAddTravail] = useState(false);
  const [newTravailType, setNewTravailType] = useState('Carrosserie');
  const [newTravailMontant, setNewTravailMontant] = useState('');
  const [newTravailCommentaire, setNewTravailCommentaire] = useState('');

  const [showChangerStatut, setShowChangerStatut] = useState(false);
  const [nouveauStatut, setNouveauStatut] = useState<PhysicalStatus>('en_possession');
  const [statutPrestataire, setStatutPrestataire] = useState('');
  const [statutCommentaire, setStatutCommentaire] = useState('');

  const handleUpload = (field: 'carteGrise' | 'carteVerte', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateVehicle(vehicle.id, { [field]: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Finance Calculations
  const totalAvances = vehicleMissions.reduce((s, m) => s + (m.avancesFrais?.reduce((ss, f) => ss + f.montant, 0) || 0), 0);
  const totalTravauxEngages = vehicle?.travauxReels?.filter(t => t.statut === 'fait').reduce((s, t) => s + t.montant, 0) || 0;
  const totalTravauxAFaire = vehicle?.travauxReels?.filter(t => t.statut === 'a_faire' || t.statut === 'en_cours' || t.statut === 'en_attente_devis').reduce((s, t) => s + t.montant, 0) || 0;
  
  // Total facturé client (les prestations facturées sur les missions du véhicule)
  const totalPrestationsFacturees = vehicleMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
  
  // Dans notre cas : general total dépensé pour remettre le véhicule en état
  const totalDepensesGenerales = totalAvances + totalTravauxEngages;

  const handleAddTravail = () => {
    if (!vehicle || !newTravailType) return;
    const nouveauTravail: TravailReel = {
      id: uuidv4(),
      type: newTravailType,
      montant: parseFloat(newTravailMontant) || 0,
      statut: 'a_faire',
      commentaire: newTravailCommentaire
    };
    const currentTravaux = vehicle.travauxReels || [];
    updateVehicle(vehicle.id, {
      travauxReels: [...currentTravaux, nouveauTravail]
    });
    setNewTravailType('Carrosserie');
    setNewTravailMontant('');
    setNewTravailCommentaire('');
    setShowAddTravail(false);
  };

  const handleChangerStatutPhysique = () => {
    if (!vehicle || !nouveauStatut) return;
    
    // On passe les variables temporaires de prestataire et commentaire
    updateVehicle(vehicle.id, {
      statutPhysique: nouveauStatut,
      _prestataire: statutPrestataire,
      _commentaire: statutCommentaire
    } as any);

    setStatutPrestataire('');
    setStatutCommentaire('');
    setShowChangerStatut(false);
  };

  const toggleTravailStatut = (travailId: string, currentStatut: TravailStatus) => {
    if (!vehicle) return;
    const statuts: TravailStatus[] = ['a_faire', 'en_cours', 'fait', 'ne_pas_faire'];
    const currentIndex = statuts.indexOf(currentStatut);
    const nextIndex = (currentIndex + 1) % statuts.length;
    const nextStatut = statuts[nextIndex];

    const currentTravaux = vehicle.travauxReels || [];
    const updated = currentTravaux.map(t => 
      t.id === travailId ? { ...t, statut: nextStatut } : t
    );
    updateVehicle(vehicle.id, { travauxReels: updated });
  };

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-icon btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 800, flex: 1 }}>Fiche Véhicule</h1>
        {vehicle && <button className="btn-icon btn-secondary" onClick={() => setEditing(true)}><Edit2 size={18} /></button>}
        {vehicleMissions.length === 0 && vehicle && (
          <button className="btn-icon btn-secondary" style={{ color: 'var(--red)' }} onClick={() => {
            useVehicleStore.getState().deleteVehicle(vehicle.id);
            navigate(-1);
          }}><Trash2 size={20} /></button>
        )}
      </div>

      {/* Vehicle Header */}
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,85,0,0.05), rgba(0,191,255,0.05))', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,85,0,0.1)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Car size={32} color="var(--accent)" />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>{decodedPlaque}</div>
          {vehicle && (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{vehicle.marque} {vehicle.modele}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                {vehicle.typeVehicule && <span style={{ padding: '2px 10px', borderRadius: 8, background: 'rgba(0,191,255,0.1)', color: 'var(--blue)', fontWeight: 700 }}>{vehicle.typeVehicule}</span>}
                {vehicle.annee && <span>{vehicle.annee}</span>}
                {vehicle.couleur && <span>• {vehicle.couleur}</span>}
                {vehicle.carburant && <span>• {vehicle.carburant}</span>}
                {vehicle.boiteVitesses && <span>• {vehicle.boiteVitesses}</span>}
              </div>
              
              {/* Badges logistiques premium */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16, marginBottom: 12 }}>
                {/* Clés */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${
                  (vehicle.keysPossessed ?? 1) === 0 ? 'var(--red)' : (vehicle.keysPossessed ?? 1) === 1 ? 'var(--accent)' : 'var(--green)'
                }`, fontSize: 12, fontWeight: 700 }}>
                  <Key size={12} color={(vehicle.keysPossessed ?? 1) === 0 ? 'var(--red)' : 'var(--accent)'} />
                  <span>
                    {(vehicle.keysPossessed ?? 1) === 0 ? '0 clé ❌' : Array(vehicle.keysPossessed ?? 1).fill('🔑').join('')}
                    {(vehicle.keysPossessed ?? 1) >= 3 ? ' +' : ''}
                  </span>
                </div>

                {/* Documents */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: vehicle.docsInPossession?.includes('carte_grise') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: vehicle.docsInPossession?.includes('carte_grise') ? 'var(--green)' : 'var(--red)', fontSize: 11, fontWeight: 700 }}>
                    CG {vehicle.docsInPossession?.includes('carte_grise') ? '✓' : '✗'}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: vehicle.docsInPossession?.includes('assurance') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: vehicle.docsInPossession?.includes('assurance') ? 'var(--green)' : 'var(--red)', fontSize: 11, fontWeight: 700 }}>
                    Verte {vehicle.docsInPossession?.includes('assurance') ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {/* Localisation / Statut actuel */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: 1 }}>LOCALISATION / STATUT :</span>
                <button 
                  className="chip active animate-hover" 
                  onClick={() => {
                    setNouveauStatut(vehicle.statutPhysique || 'en_possession');
                    setShowChangerStatut(true);
                  }}
                  style={{
                    background: PHYSICAL_STATUS_CONFIG[vehicle.statutPhysique || 'en_possession'].bg,
                    color: PHYSICAL_STATUS_CONFIG[vehicle.statutPhysique || 'en_possession'].color,
                    border: `1px solid ${PHYSICAL_STATUS_CONFIG[vehicle.statutPhysique || 'en_possession'].color}`,
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontWeight: 850,
                    fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {PHYSICAL_STATUS_CONFIG[vehicle.statutPhysique || 'en_possession'].label} ⚡ Modifier
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 14, display: 'flex', gap: 12, justifyContent: 'center' }}>
                {vehicle.kilometrage && <span>{vehicle.kilometrage.toLocaleString('fr-FR')} km</span>}
                {vehicle.dimensionsPneus && <span>• Pneus: {vehicle.dimensionsPneus}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>{vehicleMissions.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>MISSIONS</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>{totalPrestationsFacturees.toLocaleString('fr-FR')}€</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>CA TOTAL</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: allDegats.length > 0 ? 'var(--red)' : 'var(--green)' }}>{allDegats.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>DÉGÂTS</div>
        </div>
      </div>

      {/* Extra info row */}
      {(lastClient || lastMission) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {lastClient && (
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>DERNIER CLIENT</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{lastClient}</div>
            </div>
          )}
          {lastMission && (
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>DERNIER PASSAGE</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(lastMission.dateTime).toLocaleDateString('fr-FR')}</div>
            </div>
          )}
        </div>
      )}

      {/* Synthèse Financière Premium */}
      <div className="section">
        <h3 className="section-title"><DollarSign size={18} /> Synthèse Financière</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Avances de frais (Bleu) */}
          <div className="card" style={{ padding: 16, position: 'relative', borderLeft: '4px solid var(--blue)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: 0.5 }}>AVANCES DE FRAIS</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--blue)', marginTop: 4 }}>{totalAvances.toLocaleString('fr-FR')} €</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>Carburant, péage, parking...</div>
          </div>
          
          {/* Travaux réels (Violet) */}
          <div className="card" style={{ padding: 16, position: 'relative', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: 0.5 }}>TRAVAUX RÉELS</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6', marginTop: 4 }}>{totalTravauxEngages.toLocaleString('fr-FR')} €</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>Carrosserie, vitrage faits</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text2)' }}>CA prestations facturé client</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>{totalPrestationsFacturees.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text2)' }}>Dépenses logistiques (Avances + Travaux)</span>
              <span style={{ fontWeight: 700, color: 'var(--red)' }}>-{totalDepensesGenerales.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text2)' }}>Travaux restants à engager</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{totalTravauxAFaire.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'var(--text1)' }}>Marge opérationnelle estimée</span>
              <span style={{ color: (totalPrestationsFacturees - totalDepensesGenerales) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {(totalPrestationsFacturees - totalDepensesGenerales).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Travaux à effectuer */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}><Wrench size={18} /> Travaux à effectuer / réalisés</h3>
          <button className="btn btn-secondary btn-sm animate-hover" onClick={() => setShowAddTravail(true)} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> Ajouter
          </button>
        </div>
        
        <div className="card" style={{ padding: 16 }}>
          {(!vehicle?.travauxReels || vehicle.travauxReels.length === 0) ? (
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '10px 0' }}>Aucun travail planifié ou réalisé</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vehicle.travauxReels.map((t) => {
                const tCfg = TRAVAIL_STATUS_CONFIG[t.statut];
                return (
                  <div key={t.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 750 }}>{t.type}</div>
                      {t.commentaire && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t.commentaire}</div>}
                      <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginTop: 2 }}>{t.montant.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => toggleTravailStatut(t.id, t.statut)}
                        className="animate-hover"
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 12,
                          background: tCfg.bg,
                          color: tCfg.color,
                          border: `1px solid ${tCfg.color}`,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {tCfg.label}
                      </button>
                      <button 
                        onClick={() => {
                          const current = vehicle.travauxReels || [];
                          updateVehicle(vehicle.id, { travauxReels: current.filter(x => x.id !== t.id) });
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline des ateliers */}
      <div className="section">
        <h3 className="section-title"><Clock size={18} /> Timeline de présence en Atelier</h3>
        <div className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
          {(!vehicle?.historiqueStatuts || vehicle.historiqueStatuts.length === 0) ? (
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '10px 0' }}>Aucun séjour en atelier enregistré</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
              {/* Ligne verticale */}
              <div style={{ position: 'absolute', top: 8, bottom: 8, left: 7, width: 2, background: 'rgba(255,255,255,0.06)' }} />
              
              {vehicle.historiqueStatuts.map((h) => {
                const cfg = PHYSICAL_STATUS_CONFIG[h.statut];
                const duration = formatDuration(h.start, h.end);
                return (
                  <div key={h.id} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                    {/* Point d'étape */}
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: cfg.color, border: '4px solid var(--card-bg)', boxShadow: '0 0 8px rgba(0,0,0,0.3)', marginTop: 2, flexShrink: 0 }} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text3)', fontWeight: 600 }}>{duration}</span>
                      </div>
                      
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {new Date(h.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {h.end && ` ➔ ${new Date(h.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                      
                      {(h.prestataire || h.commentaire) && (
                        <div style={{ fontSize: 12, color: 'var(--text3)', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: 6, marginTop: 6, borderLeft: `2px solid ${cfg.color}` }}>
                          {h.prestataire && <strong>{h.prestataire}</strong>}
                          {h.commentaire && `${h.prestataire ? ' : ' : ''}${h.commentaire}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Documents Upload */}
      <div className="section">
        <h3 className="section-title" style={{ marginBottom: 12 }}><FileText size={18} /> Documents véhicule</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div className="card" onClick={() => carteGriseRef.current?.click()} style={{ padding: 14, cursor: 'pointer', textAlign: 'center', borderStyle: vehicle?.carteGrise ? 'solid' : 'dashed' }}>
            <Upload size={20} color={vehicle?.carteGrise ? 'var(--green)' : 'var(--text2)'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: vehicle?.carteGrise ? 'var(--green)' : 'var(--text2)' }}>{vehicle?.carteGrise ? 'Carte grise ✓' : 'Carte grise'}</div>
          </div>
          <div className="card" onClick={() => carteVerteRef.current?.click()} style={{ padding: 14, cursor: 'pointer', textAlign: 'center', borderStyle: vehicle?.carteVerte ? 'solid' : 'dashed' }}>
            <Upload size={20} color={vehicle?.carteVerte ? 'var(--green)' : 'var(--text2)'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: vehicle?.carteVerte ? 'var(--green)' : 'var(--text2)' }}>{vehicle?.carteVerte ? 'Carte verte ✓' : 'Carte verte'}</div>
          </div>
        </div>
        <input ref={carteGriseRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleUpload('carteGrise', e)} />
        <input ref={carteVerteRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleUpload('carteVerte', e)} />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, scrollbarWidth: 'none' }}>
        <button className="chip active" onClick={() => navigate('/terrain')} style={{ whiteSpace: 'nowrap' }}><Plus size={14} /> Nouvelle mission</button>
        <button className="chip" onClick={() => navigate('/documents')} style={{ whiteSpace: 'nowrap' }}><FileText size={14} /> Documents</button>
        <button className="chip" onClick={() => navigate('/rappels')} style={{ whiteSpace: 'nowrap' }}><Bell size={14} /> Rappel</button>
      </div>

      {unpaid > 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20, background: 'rgba(255,51,102,0.05)', borderColor: 'rgba(255,51,102,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} color="var(--red)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{unpaid.toLocaleString('fr-FR')} € à encaisser</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Montant restant impayé</div>
          </div>
        </div>
      )}

      {/* Mission History */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title"><Clock size={18} /> Historique</h3>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{vehicleMissions.length}</span>
        </div>
        {vehicleMissions.map((m) => {
          const cfg = STATUS_CONFIG[m.statut];
          return (
            <div key={m.id} className="card" onClick={() => navigate(`/mission/${m.id}`)} style={{ padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  {(m.types || [m.type]).join(' + ')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {new Date(m.dateTime).toLocaleDateString('fr-FR')} • {(m.prixTTC || 0).toLocaleString('fr-FR')} €
                  {m.degats.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>• {m.degats.length} dégât{m.degats.length > 1 ? 's' : ''}</span>}
                </div>
                {m.clients[0] && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.clients.map(c => c.clientName).join(', ')}</div>}
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{cfg.label}</span>
              <ChevronRight size={16} color="var(--text3)" />
            </div>
          );
        })}
      </div>

      {allDegats.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}><AlertTriangle size={18} /> Dégâts enregistrés</h3>
          <div className="card" style={{ padding: '0 16px' }}>
            {allDegats.slice(0, 10).map((d, i) => (
              <div key={d.id} style={{ padding: '12px 0', borderBottom: i < Math.min(allDegats.length, 10) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.piece}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{DAMAGE_TYPES[d.type]}{d.commentaire ? ` — ${d.commentaire}` : ''}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,51,102,0.1)', color: 'var(--red)', fontWeight: 700 }}>{d.vue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {associatedClients.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}>Clients associés</h3>
          {associatedClients.map(c => (
            <div key={c.id} className="card" onClick={() => navigate(`/client/${c.id}`)} style={{ padding: '14px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.nom}</div>
                {c.email && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.email}</div>}
              </div>
              <ChevronRight size={16} color="var(--text3)" />
            </div>
          ))}
        </div>
      )}

      {vehicleMissions.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Car size={48} />
          <p style={{ marginTop: 12 }}>Aucune mission pour ce véhicule</p>
          <button className="btn btn-primary" onClick={() => navigate('/terrain')} style={{ marginTop: 16 }}><Plus size={16} /> Créer une mission</button>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      <SafeModal isOpen={editing} onClose={() => setEditing(false)} title="Modifier le véhicule" actions={<button className="btn btn-primary btn-full animate-hover" onClick={() => setEditing(false)}>Enregistrer</button>}>
        {vehicle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="input-group"><label className="input-label">Type de véhicule</label>
              <select className="input" value={vehicle.typeVehicule || ''} onChange={e => updateVehicle(vehicle.id, { typeVehicule: e.target.value as VehicleType })}>
                <option value="">—</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="input-group"><label className="input-label">Dimensions pneus</label>
              <input className="input" value={vehicle.dimensionsPneus || ''} onChange={e => updateVehicle(vehicle.id, { dimensionsPneus: e.target.value })} placeholder="205/55R16" />
            </div>
            <div className="input-group"><label className="input-label">Kilométrage</label>
              <input className="input" type="number" value={vehicle.kilometrage || ''} onChange={e => updateVehicle(vehicle.id, { kilometrage: parseInt(e.target.value) || undefined })} />
            </div>
            
            {/* Clés & Documents logistiques */}
            <div className="input-group"><label className="input-label">Nombre de clés en possession</label>
              <select className="input" value={vehicle.keysPossessed ?? 1} onChange={e => updateVehicle(vehicle.id, { keysPossessed: parseInt(e.target.value) as any })}>
                <option value="0">0 clé (Manquante)</option>
                <option value="1">1 clé</option>
                <option value="2">2 clés</option>
                <option value="3">3 clés ou plus</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ marginBottom: 6 }}>Documents reçus</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={vehicle.docsInPossession?.includes('carte_grise') || false} 
                    onChange={e => {
                      const docs = vehicle.docsInPossession || [];
                      const nextDocs = e.target.checked ? [...docs, 'carte_grise'] : docs.filter(x => x !== 'carte_grise');
                      updateVehicle(vehicle.id, { docsInPossession: nextDocs });
                    }}
                  />
                  Carte grise (originale ou copie)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={vehicle.docsInPossession?.includes('assurance') || false} 
                    onChange={e => {
                      const docs = vehicle.docsInPossession || [];
                      const nextDocs = e.target.checked ? [...docs, 'assurance'] : docs.filter(x => x !== 'assurance');
                      updateVehicle(vehicle.id, { docsInPossession: nextDocs });
                    }}
                  />
                  Carte verte / Assurance
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={vehicle.docsInPossession?.includes('autre') || false} 
                    onChange={e => {
                      const docs = vehicle.docsInPossession || [];
                      const nextDocs = e.target.checked ? [...docs, 'autre'] : docs.filter(x => x !== 'autre');
                      updateVehicle(vehicle.id, { docsInPossession: nextDocs });
                    }}
                  />
                  Autres documents
                </label>
              </div>
            </div>
          </div>
        )}
      </SafeModal>

      {/* Modal Changer Statut */}
      <SafeModal 
        isOpen={showChangerStatut} 
        onClose={() => setShowChangerStatut(false)} 
        title="Localisation & Statut du véhicule" 
        actions={
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowChangerStatut(false)}>Annuler</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangerStatutPhysique}>Mettre à jour</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">Nouveau statut / atelier</label>
            <select className="input" value={nouveauStatut} onChange={e => setNouveauStatut(e.target.value as PhysicalStatus)}>
              {Object.entries(PHYSICAL_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Prestataire / Lieu</label>
            <input className="input" placeholder="ex: Carglass Paris, Speedy..." value={statutPrestataire} onChange={e => setStatutPrestataire(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Commentaire</label>
            <textarea className="input" style={{ height: 70 }} placeholder="Notes de transfert, devis..." value={statutCommentaire} onChange={e => setStatutCommentaire(e.target.value)} />
          </div>
        </div>
      </SafeModal>

      {/* Modal Ajouter Travail */}
      <SafeModal 
        isOpen={showAddTravail} 
        onClose={() => setShowAddTravail(false)} 
        title="Planifier une intervention" 
        actions={
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddTravail(false)}>Annuler</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddTravail}>Planifier</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">Type d'intervention</label>
            <select className="input" value={newTravailType} onChange={e => setNewTravailType(e.target.value)}>
              <option value="Carrosserie">Carrosserie</option>
              <option value="Débosselage">Débosselage</option>
              <option value="Vitrage">Vitrage</option>
              <option value="Pneus">Pneus</option>
              <option value="Mécanique">Mécanique</option>
              <option value="Entretien">Entretien</option>
              <option value="Peinture">Peinture</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Montant réel (€)</label>
            <input className="input" type="number" placeholder="0.00" value={newTravailMontant} onChange={e => setNewTravailMontant(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Commentaire / Devis</label>
            <textarea className="input" style={{ height: 70 }} placeholder="Détails de l'intervention..." value={newTravailCommentaire} onChange={e => setNewTravailCommentaire(e.target.value)} />
          </div>
        </div>
      </SafeModal>
    </div>
  );
}
