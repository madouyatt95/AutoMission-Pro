import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Camera, AlertTriangle, FileText, Clock, User } from 'lucide-react';
import { useMissionStore, useClientStore } from '../store';
import { STATUS_CONFIG, MISSION_TYPES, MissionStatus, MissionType } from '../types';

export default function Missions() {
  const { missions } = useMissionStore();
  const { clients } = useClientStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = [...missions].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    if (search) {
      const q = search.toUpperCase();
      list = list.filter(m => m.plaque.includes(q) || m.type.toUpperCase().includes(q) || m.clients.some(c => c.clientName.toUpperCase().includes(q)));
    }
    if (statusFilter !== 'all') list = list.filter(m => m.statut === statusFilter);
    if (typeFilter !== 'all') list = list.filter(m => m.type === typeFilter);
    return list;
  }, [missions, search, statusFilter, typeFilter]);

  const statusFilters = [
    { value: 'all', label: 'Toutes' },
    { value: 'a_facturer', label: `À facturer (${missions.filter(m => m.statut === 'a_facturer').length})` },
    { value: 'en_attente', label: `En attente (${missions.filter(m => m.statut === 'en_attente').length})` },
    { value: 'facture', label: `Facturées (${missions.filter(m => m.statut === 'facture').length})` },
    { value: 'paye', label: `Payées (${missions.filter(m => m.statut === 'paye').length})` },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Missions</h1>
        <p className="page-subtitle">{filtered.length} mission{filtered.length > 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <Search />
        <input className="input" placeholder="Rechercher plaque, type, client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-tabs">
        {statusFilters.map(f => (
          <button key={f.value} className={`filter-tab ${statusFilter === f.value ? 'active' : ''}`} onClick={() => setStatusFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      <div className="filter-tabs" style={{ marginBottom: 12 }}>
        <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Tous types</button>
        {MISSION_TYPES.map(t => (
          <button key={t} className={`filter-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
      </div>

      {filtered.map(mission => {
        const cfg = STATUS_CONFIG[mission.statut];
        const dt = new Date(mission.dateTime);
        return (
          <div key={mission.id} className="card mission-card" onClick={() => navigate(`/mission/${mission.id}`)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span className="mission-plaque">{mission.plaque}</span>
                <span className="mission-type-badge" style={{ marginLeft: 10 }}>{mission.type}</span>
              </div>
              <span className={`status-badge status-${mission.statut}`}>{cfg.label}</span>
            </div>
            <div className="mission-meta">
              <span className="mission-meta-item"><Clock size={14} />{dt.toLocaleDateString('fr-FR')} {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              {mission.clients[0] && <span className="mission-meta-item"><User size={14} />{mission.clients[0].clientName}</span>}
              <div className="mission-icons">
                {mission.photos.length > 0 && <Camera size={16} />}
                {mission.degats.length > 0 && <AlertTriangle size={16} />}
                {mission.documents.length > 0 && <FileText size={16} />}
              </div>
            </div>
            <div className="mission-bottom">
              {mission.prixTTC != null && <span className="mission-price">{mission.prixTTC.toLocaleString('fr-FR')} €</span>}
              {mission.brouillon && <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>Brouillon</span>}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>Aucune mission trouvée</p>
        </div>
      )}

      <button className="fab" onClick={() => navigate('/terrain')}>
        <Plus />
      </button>
    </div>
  );
}

function ClipboardList(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
}
