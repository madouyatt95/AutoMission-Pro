import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, Camera, User } from 'lucide-react';
import { useMissionStore, useDocumentStore } from '../store';
import { STATUS_CONFIG, DAMAGE_TYPES } from '../types';

export default function VehicleHistory() {
  const { plaque } = useParams();
  const navigate = useNavigate();
  const { missions } = useMissionStore();
  const { documents } = useDocumentStore();

  const decodedPlaque = decodeURIComponent(plaque || '');
  const vehicleMissions = missions.filter(m => m.plaque === decodedPlaque).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const vehicleDocs = documents.filter(d => d.vehiculePlaque === decodedPlaque);
  const totalCA = vehicleMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
  const allDegats = vehicleMissions.flatMap(m => m.degats);
  const allPhotos = vehicleMissions.flatMap(m => m.photos);
  const latestColor = vehicleMissions.find(m => m.couleur)?.couleur;
  const latestKm = vehicleMissions.find(m => m.kilometrage)?.kilometrage;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn-icon btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="page-title">Fiche véhicule</h1>
      </div>

      <div className="vehicle-header">
        <div className="vehicle-plaque-big">{decodedPlaque}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>
          {latestColor && <span>🎨 {latestColor}</span>}
          {latestKm && <span>🔧 {latestKm.toLocaleString('fr-FR')} km</span>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-value">{totalCA.toLocaleString('fr-FR')} €</div>
          <div className="stat-label">Chiffre d'affaires</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{vehicleMissions.length}</div>
          <div className="stat-label">Missions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{allDegats.length}</div>
          <div className="stat-label">Dégâts signalés</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{vehicleDocs.length}</div>
          <div className="stat-label">Documents</div>
        </div>
      </div>

      {allDegats.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 8 }}>Dégâts historiques</h3>
          {allDegats.map(d => (
            <div key={d.id} className="damage-item">
              <AlertTriangle size={16} color="var(--orange)" />
              <div className="damage-item-info">
                <div className="damage-item-piece">{d.piece}</div>
                <div className="damage-item-type">{DAMAGE_TYPES[d.type]}{d.commentaire ? ` — ${d.commentaire}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <h3 className="section-title" style={{ marginBottom: 8 }}>Missions ({vehicleMissions.length})</h3>
        {vehicleMissions.map(m => {
          const cfg = STATUS_CONFIG[m.statut];
          const dt = new Date(m.dateTime);
          return (
            <div key={m.id} className="card mission-card" onClick={() => navigate(`/mission/${m.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mission-type-badge">{m.type}</span>
                <span className={`status-badge status-${m.statut}`}>{cfg.label}</span>
              </div>
              <div className="mission-meta">
                <span className="mission-meta-item"><Clock size={14} />{dt.toLocaleDateString('fr-FR')}</span>
                {m.clients[0] && <span className="mission-meta-item"><User size={14} />{m.clients[0].clientName}</span>}
                {m.photos.length > 0 && <Camera size={14} color="var(--text3)" />}
              </div>
              {m.prixTTC != null && <div className="mission-price" style={{ marginTop: 6 }}>{m.prixTTC.toLocaleString('fr-FR')} €</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
