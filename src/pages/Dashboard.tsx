import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, FileText, CreditCard, Car, ChevronRight, ClipboardList } from 'lucide-react';
import { useMissionStore, useClientStore, useRappelStore } from '../store';
import { STATUS_CONFIG } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

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

  // Revenue Last 6 Months (Chart Data)
  const last6MonthsData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const monthStr = d.toLocaleDateString('fr-FR', { month: 'short' });
    const monthMissions = missions.filter(m => {
      const md = new Date(m.dateTime);
      return md.getMonth() === d.getMonth() && md.getFullYear() === d.getFullYear();
    });
    const rev = monthMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
    return { name: monthStr, uv: rev };
  });

  // Status Distribution (Chart Data)
  const statusData = [
    { name: 'À facturer', value: byStatus.a_facturer, color: '#ef4444' },
    { name: 'En attente', value: byStatus.en_attente, color: '#f59e0b' },
    { name: 'Facturé', value: byStatus.facture, color: '#10b981' },
    { name: 'Payé', value: byStatus.paye, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  return (
    <div className="page">
      <div className="dash-welcome">
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="dash-ca card">
        <div className="stat-label">Chiffre d'affaires total</div>
        <div className="stat-value">{caTotal.toLocaleString('fr-FR')} €</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          Ce mois : {caMois.toLocaleString('fr-FR')} €
        </div>
      </div>

      <div className="section" style={{ marginTop: 20 }}>
        <h3 className="section-title">Évolution CA (6 mois)</h3>
        <div className="card" style={{ height: 220, padding: '16px 8px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last6MonthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: 'var(--surface3)', border: 'none', borderRadius: 8, color: 'var(--text)' }}
                itemStyle={{ color: 'var(--accent)' }}
              />
              <Bar dataKey="uv" name="CA (€)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section" style={{ marginTop: 20 }}>
        <h3 className="section-title">Répartition Missions ({missions.length})</h3>
        <div className="card" style={{ display: 'flex', alignItems: 'center', height: 180, padding: 16 }}>
          <div style={{ width: '50%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/missions')}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                <span style={{ color: 'var(--text2)', flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: 'bold' }}>{s.value}</span>
              </div>
            ))}
          </div>
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
