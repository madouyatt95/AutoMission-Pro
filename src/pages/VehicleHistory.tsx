import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Car, FileText, Bell, Copy, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { useMissionStore, useVehicleStore, useDocumentStore, useClientStore } from '../store';
import { STATUS_CONFIG, DAMAGE_TYPES } from '../types';

export default function VehicleHistory() {
  const { plaque } = useParams();
  const navigate = useNavigate();
  const { missions } = useMissionStore();
  const { vehicles } = useVehicleStore();
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

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-icon btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 800, flex: 1 }}>Fiche Véhicule</h1>
      </div>

      {/* Vehicle Header Card */}
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
              <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {vehicle.annee && <span>{vehicle.annee}</span>}
                {vehicle.couleur && <span>• {vehicle.couleur}</span>}
                {vehicle.carburant && <span>• {vehicle.carburant}</span>}
                {vehicle.boiteVitesses && <span>• {vehicle.boiteVitesses}</span>}
              </div>
              {vehicle.kilometrage && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{vehicle.kilometrage.toLocaleString('fr-FR')} km</div>}
              {vehicle.vin && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--mono)' }}>VIN: {vehicle.vin}</div>}
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
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>{totalCA.toLocaleString('fr-FR')}€</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>CA TOTAL</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: allDegats.length > 0 ? 'var(--red)' : 'var(--green)' }}>{allDegats.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>DÉGÂTS</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, scrollbarWidth: 'none' }}>
        <button className="chip active" onClick={() => navigate('/terrain')} style={{ whiteSpace: 'nowrap' }}><Plus size={14} /> Nouvelle mission</button>
        <button className="chip" onClick={() => navigate('/documents')} style={{ whiteSpace: 'nowrap' }}><FileText size={14} /> Documents</button>
        <button className="chip" onClick={() => navigate('/rappels')} style={{ whiteSpace: 'nowrap' }}><Bell size={14} /> Rappel</button>
      </div>

      {/* Unpaid warning */}
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

      {/* Active Damages */}
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

      {/* Associated Clients */}
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

      {/* Documents */}
      {vehicleDocs.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}><FileText size={18} /> Documents ({vehicleDocs.length})</h3>
          <div className="card" style={{ padding: '0 16px' }}>
            {vehicleDocs.slice(0, 5).map((d, i) => (
              <div key={d.id} style={{ padding: '12px 0', borderBottom: i < Math.min(vehicleDocs.length, 5) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{d.nom}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vehicleMissions.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Car size={48} />
          <p style={{ marginTop: 12 }}>Aucune mission pour ce véhicule</p>
          <button className="btn btn-primary" onClick={() => navigate('/terrain')} style={{ marginTop: 16 }}><Plus size={16} /> Créer une mission</button>
        </div>
      )}
    </div>
  );
}
