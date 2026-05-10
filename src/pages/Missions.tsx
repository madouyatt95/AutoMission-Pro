import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, User, Car, ChevronRight, TrendingUp } from 'lucide-react';
import { useMissionStore, useClientStore, useVehicleStore } from '../store';
import { STATUS_CONFIG } from '../types';

export default function Missions() {
  const { missions } = useMissionStore();
  const { clients } = useClientStore();
  const { vehicles } = useVehicleStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Group missions by plaque
  const grouped = useMemo(() => {
    const map = new Map<string, typeof missions>();
    missions.forEach(m => {
      const list = map.get(m.plaque) || [];
      list.push(m);
      map.set(m.plaque, list);
    });

    let entries = Array.from(map.entries()).map(([plaque, missionList]) => {
      const sorted = [...missionList].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      const vehicle = vehicles.find(v => v.plaque === plaque);
      const totalCA = missionList.reduce((s, m) => s + (m.prixTTC || 0), 0);
      const lastDate = sorted[0]?.dateTime;
      const allClients = [...new Set(missionList.flatMap(m => m.clients.map(c => c.clientName)))];
      const globalStatus = missionList.some(m => m.statut === 'a_facturer') ? 'a_facturer'
        : missionList.some(m => m.statut === 'en_attente') ? 'en_attente'
        : missionList.some(m => m.statut === 'facture') ? 'facture' : 'paye';

      return { plaque, missions: sorted, vehicle, totalCA, lastDate, allClients, globalStatus, count: missionList.length };
    });

    // Sort by last mission date
    entries.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    // Filter
    if (search) {
      const q = search.toUpperCase();
      entries = entries.filter(e =>
        e.plaque.includes(q) ||
        (e.vehicle?.marque || '').toUpperCase().includes(q) ||
        (e.vehicle?.modele || '').toUpperCase().includes(q) ||
        e.allClients.some(c => c.toUpperCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      entries = entries.filter(e => e.globalStatus === statusFilter);
    }

    return entries;
  }, [missions, vehicles, search, statusFilter]);

  const statusFilters = [
    { value: 'all', label: 'Tous' },
    { value: 'a_facturer', label: 'À facturer' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'facture', label: 'Facturé' },
    { value: 'paye', label: 'Payé' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="page-header">
        <div className="page-header-flex">
          <div>
            <h1 className="page-title">Véhicules</h1>
            <p className="page-subtitle">{grouped.length} véhicule{grouped.length > 1 ? 's' : ''} • {missions.length} mission{missions.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder="Plaque, marque, client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none', paddingBottom: 4 }}>
        {statusFilters.map(f => (
          <button key={f.value} className={`chip ${statusFilter === f.value ? 'active' : ''}`} onClick={() => setStatusFilter(f.value)} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped vehicle cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {grouped.map(entry => {
          const cfg = STATUS_CONFIG[entry.globalStatus as keyof typeof STATUS_CONFIG];
          return (
            <div key={entry.plaque} className="card" onClick={() => navigate(`/vehicule/${encodeURIComponent(entry.plaque)}`)} style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}>
              {/* Top bar with status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>{entry.plaque}</span>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: cfg?.bg, color: cfg?.color, fontWeight: 700 }}>{cfg?.label}</span>
              </div>

              {/* Content */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Vehicle info */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,85,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Car size={24} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                    {entry.vehicle ? `${entry.vehicle.marque || ''} ${entry.vehicle.modele || ''}`.trim() || 'Véhicule' : 'Véhicule'}
                    {entry.vehicle?.annee && <span style={{ color: 'var(--text3)', fontWeight: 500, marginLeft: 6 }}>{entry.vehicle.annee}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)' }}>
                    <span>{entry.count} mission{entry.count > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{entry.totalCA.toLocaleString('fr-FR')} €</span>
                  </div>
                  {entry.allClients.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.allClients.slice(0, 2).join(', ')}{entry.allClients.length > 2 ? ` +${entry.allClients.length - 2}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(entry.lastDate).toLocaleDateString('fr-FR')}</div>
                  <ChevronRight size={16} color="var(--text3)" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {grouped.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Car size={48} />
          <p style={{ marginTop: 12 }}>Aucun véhicule trouvé</p>
        </div>
      )}

      <button className="fab" onClick={() => navigate('/terrain')}>
        <Plus />
      </button>
    </div>
  );
}
