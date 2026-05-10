import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, FileText, CreditCard, Car, ChevronRight, ClipboardList } from 'lucide-react';
import { useMissionStore, useClientStore, useRappelStore } from '../store';
import { STATUS_CONFIG } from '../types';

export default function Dashboard() {
  const { missions } = useMissionStore();
  const { clients } = useClientStore();
  const { rappels } = useRappelStore();
  const navigate = useNavigate();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const caTotal = missions.reduce((s, m) => s + (m.prixTTC || 0), 0);
  const caMois = missions.filter(m => { const d = new Date(m.dateTime); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, m) => s + (m.prixTTC || 0), 0);
  const byStatus = {
    a_facturer: missions.filter(m => m.statut === 'a_facturer').length,
    en_attente: missions.filter(m => m.statut === 'en_attente').length,
    facture: missions.filter(m => m.statut === 'facture').length,
    paye: missions.filter(m => m.statut === 'paye').length,
  };

  const today = now.toISOString().split('T')[0];
  const rappelsToday = rappels.filter(r => r.date === today && !r.completed);
  const rappelsOverdue = rappels.filter(r => r.date < today && !r.completed);

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {};
  missions.forEach(m => {
    m.clients.forEach(c => {
      clientRevenue[c.clientId] = (clientRevenue[c.clientId] || 0) + c.montantTTC;
    });
  });
  const topClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, rev]) => ({ name: clients.find(c => c.id === id)?.nom || 'Inconnu', revenue: rev }));

  // Recent vehicles
  const recentVehicles = [...new Set(missions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(m => m.plaque))].slice(0, 5);

  return (
    <div className="page">
      <div className="dash-welcome">
        <h1>AutoMission Pro</h1>
        <p>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="dash-ca card">
        <div className="stat-label">Chiffre d'affaires total</div>
        <div className="stat-value">{caTotal.toLocaleString('fr-FR')} €</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          Ce mois : {caMois.toLocaleString('fr-FR')} €
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/missions?status=a_facturer')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{byStatus.a_facturer}</div>
          <div className="stat-label">À facturer</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/missions?status=en_attente')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: 'var(--orange)' }}>{byStatus.en_attente}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/missions?status=facture')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{byStatus.facture}</div>
          <div className="stat-label">Facturées</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/missions?status=paye')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{byStatus.paye}</div>
          <div className="stat-label">Payées</div>
        </div>
        <div className="stat-card wide">
          <div><div className="stat-value">{missions.length}</div><div className="stat-label">Total missions</div></div>
          <ClipboardList size={28} color="var(--text3)" />
        </div>
      </div>

      {(rappelsOverdue.length > 0 || rappelsToday.length > 0) && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">⚠️ Alertes</h3>
            <button className="section-link" onClick={() => navigate('/rappels')}>Voir tout</button>
          </div>
          {rappelsOverdue.map(r => (
            <div key={r.id} className="reminder-card overdue">
              <div className="reminder-info">
                <div className="reminder-title">{r.titre}</div>
                <div className="reminder-date" style={{ color: 'var(--red)' }}>En retard — {new Date(r.date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          ))}
          {rappelsToday.map(r => (
            <div key={r.id} className="reminder-card today">
              <div className="reminder-info">
                <div className="reminder-title">{r.titre}</div>
                <div className="reminder-date" style={{ color: 'var(--orange)' }}>Aujourd'hui</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {topClients.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Top clients</h3>
            <button className="section-link" onClick={() => navigate('/clients')}>Tous</button>
          </div>
          <div className="card">
            <ul className="top-clients">
              {topClients.map((c, i) => (
                <li key={i}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{c.revenue.toLocaleString('fr-FR')} €</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Derniers véhicules</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {recentVehicles.map(plaque => (
            <div key={plaque} className="card" style={{ flexShrink: 0, cursor: 'pointer', padding: '10px 16px' }} onClick={() => navigate(`/vehicule/${encodeURIComponent(plaque)}`)}>
              <div className="mission-plaque" style={{ fontSize: 14 }}>{plaque}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
