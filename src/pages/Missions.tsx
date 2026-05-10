import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Clock, User, Settings2, MoreHorizontal } from 'lucide-react';
import { useMissionStore, useClientStore } from '../store';
import { STATUS_CONFIG, MISSION_TYPES } from '../types';

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
      list = list.filter(m => m.plaque.includes(q) || (m.types || [m.type]).some(t => t.toUpperCase().includes(q)) || m.clients.some(c => c.clientName.toUpperCase().includes(q)));
    }
    if (statusFilter !== 'all') list = list.filter(m => m.statut === statusFilter);
    if (typeFilter !== 'all') list = list.filter(m => (m.types || [m.type]).includes(typeFilter));
    return list;
  }, [missions, search, statusFilter, typeFilter]);

  const statusFilters = [
    { value: 'all', label: 'Toutes' },
    { value: 'a_facturer', label: 'À facturer' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'facture', label: 'Facturées' },
    { value: 'paye', label: 'Payées' },
  ];

  const getStatusCount = (status: string) => {
    if (status === 'all') return missions.length;
    return missions.filter(m => m.statut === status).length;
  };

  const carImages = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1503376713246-ce3e7e296838?auto=format&fit=crop&q=80&w=600'
  ];

  return (
    <div className="page">
      <div className="page-header page-header-flex">
        <div>
          <h1 className="page-title">Missions</h1>
          <p className="page-subtitle">{missions.length} missions</p>
        </div>
        <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, border: 'none', background: 'rgba(255,255,255,0.05)' }}>
          <span style={{ display: 'flex', gap: 2, height: 12, alignItems: 'flex-end' }}>
            <span style={{ width: 3, height: '40%', background: 'var(--accent)', borderRadius: 2 }}></span>
            <span style={{ width: 3, height: '70%', background: 'var(--accent)', borderRadius: 2 }}></span>
            <span style={{ width: 3, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></span>
          </span>
          Stats
        </button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder="Rechercher plaque, type, client..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="filter-btn"><Settings2 size={18} /></button>
      </div>

      <div className="filter-tabs">
        {statusFilters.map(f => (
          <button key={f.value} className={`filter-tab ${statusFilter === f.value ? 'active' : ''}`} onClick={() => setStatusFilter(f.value)}>
            {f.label} <span style={{ marginLeft: 6, opacity: statusFilter === f.value ? 1 : 0.5, fontWeight: statusFilter === f.value ? 800 : 500 }}>{getStatusCount(f.value)}</span>
          </button>
        ))}
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Tous types</button>
        {MISSION_TYPES.map(t => (
          <button key={t} className={`filter-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
        <button className="filter-tab"><MoreHorizontal size={14} /></button>
      </div>

      <div style={{ paddingBottom: 80 }}>
        {filtered.map((mission, idx) => {
          const cfg = STATUS_CONFIG[mission.statut];
          const dt = new Date(mission.dateTime);
          const carImg = carImages[idx % carImages.length];
          
          return (
            <div key={mission.id} className="mission-card" onClick={() => navigate(`/mission/${mission.id}`)}>
              <div className="mission-card-bg" style={{ backgroundImage: `url(${carImg})` }}></div>
              <div className="mission-status-top">
                <span className={`status-badge status-${mission.statut}`}>{cfg.label}</span>
                <MoreHorizontal size={20} color="var(--text2)" />
              </div>
              
              <div className="mission-card-content">
                <div className="mission-plaque">{mission.plaque}</div>
                <div className="mission-type-tags">
                  {(mission.types || [mission.type]).map((t, ti) => (
                    <span key={ti} className="mission-type-badge">🚘 {t}</span>
                  ))}
                  {mission.brouillon && <span className="mission-type-badge rappel">⚠️ BROUILLON</span>}
                </div>
                
                {mission.prixTTC != null && mission.prixTTC > 0 && (
                  <div className="mission-price">{mission.prixTTC.toLocaleString('fr-FR')} €</div>
                )}
                
                <div className="mission-meta">
                  <span className="mission-meta-item"><Clock size={14} />{dt.toLocaleDateString('fr-FR')} • {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {mission.clients[0] && <span className="mission-meta-item"><User size={14} />{mission.clients[0].clientName}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p style={{fontSize: 18, fontWeight: 700, color: 'var(--text)'}}>Aucune mission trouvée</p>
          </div>
        )}
      </div>

      <button className="fab" onClick={() => navigate('/terrain')}>
        <Plus />
      </button>
    </div>
  );
}
