import { useNavigate } from 'react-router-dom';
import { TrendingUp, FileText, ChevronRight, Bell, RefreshCw, Car } from 'lucide-react';
import { useMissionStore, useClientStore, useRappelStore } from '../store';
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
  const alertes = [...rappelsOverdue, ...rappelsToday].slice(0, 3); // Max 3 on dashboard

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {};
  missions.forEach(m => {
    m.clients.forEach(c => {
      clientRevenue[c.clientId] = (clientRevenue[c.clientId] || 0) + c.montantTTC;
    });
  });
  const topClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, rev]) => {
      const c = clients.find(cl => cl.id === id);
      return { id: c?.id, name: c?.nom || 'Inconnu', revenue: rev, domain: c?.email?.split('@')[1] || '' };
    });

  // Recent vehicles
  const recentVehicles = [...new Set(missions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(m => m.plaque))].slice(0, 3);
  const carImages = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=400'
  ];

  // Revenue Last 6 Months (Chart Data)
  const last6MonthsData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const monthStr = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
    const monthMissions = missions.filter(m => {
      const md = new Date(m.dateTime);
      return md.getMonth() === d.getMonth() && md.getFullYear() === d.getFullYear();
    });
    const rev = monthMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
    return { name: monthStr, uv: rev };
  });

  // Status Distribution (Chart Data)
  const statusData = [
    { name: 'À facturer', value: byStatus.a_facturer, color: '#ff3366' },
    { name: 'En attente', value: byStatus.en_attente, color: '#ff9900' },
    { name: 'Facturé', value: byStatus.facture, color: '#00e676' },
    { name: 'Payé', value: byStatus.paye, color: '#00bfff' }
  ].filter(d => d.value > 0);

  return (
    <div className="page">
      <div className="dash-welcome">
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          Bonjour 👋<br/>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </p>
      </div>

      <div className="dash-ca">
        <div className="dash-ca-left">
          <div className="stat-label">CHIFFRE D'AFFAIRES TOTAL</div>
          <div className="stat-value">{caTotal.toLocaleString('fr-FR')} €</div>
          <div className="dash-ca-month">Ce mois : {caMois.toLocaleString('fr-FR')} €</div>
          <div className="dash-ca-tag"><TrendingUp size={14} /> +34% <span style={{fontSize: 10, opacity: 0.8, marginLeft: 4, fontWeight: 500}}>vs mois dernier</span></div>
        </div>
        <div className="dash-ca-icon">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z" stroke="white" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M35 60L50 45L60 55L75 40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M65 40H75V50" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div className="section" style={{ marginTop: 20 }}>
        <div className="section-header">
          <h3 className="section-title">Évolution CA (6 mois)</h3>
          <select style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, padding: '4px 10px', fontSize: 11, outline: 'none' }}>
            <option>6 mois</option>
          </select>
        </div>
        <div className="card" style={{ height: 240, padding: '16px 8px 0 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last6MonthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: 'var(--accent)' }}
              />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#ff0044" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <Bar dataKey="uv" name="CA (€)" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section" style={{ marginTop: 20 }}>
        <h3 className="section-title">Répartition Missions ({missions.length})</h3>
        <div className="card" style={{ display: 'flex', alignItems: 'center', height: 200, padding: 16 }}>
          <div style={{ width: '50%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="rgba(0,0,0,0.5)" strokeWidth={2}>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/missions')}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                <span style={{ color: 'var(--text2)', flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: '800', color: 'var(--text)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/missions')}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Voir le détail des missions</span>
          <ChevronRight size={18} color="var(--accent)" />
        </div>
      </div>

      {alertes.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title"><Bell size={20} /> Alertes</h3>
            <button className="section-link" onClick={() => navigate('/rappels')}>Voir tout</button>
          </div>
          {alertes.map(r => (
            <div key={r.id} className="alert-card" onClick={() => navigate('/rappels')}>
              <div className="alert-icon">
                {r.titre.includes('Relance') ? <RefreshCw /> : <FileText />}
              </div>
              <div className="alert-info">
                <div className="alert-title">{r.titre}</div>
                <div className="alert-date" style={r.date < today ? { color: 'var(--red)' } : {}}>Aujourd'hui</div>
              </div>
              <ChevronRight size={18} color="var(--text2)" />
            </div>
          ))}
        </div>
      )}

      {topClients.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title" style={{textShadow: '0 0 15px rgba(255,255,255,0.2)'}}>👑 Top clients</h3>
            <button className="section-link" onClick={() => navigate('/clients')}>Tous</button>
          </div>
          <div className="card" style={{ padding: '8px 16px' }}>
            {topClients.map((c, i) => (
              <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: i < topClients.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => navigate('/clients')}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.domain ? <img src={`https://logo.clearbit.com/${c.domain}`} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${c.name}&background=random` }} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} alt={c.name} /> : <div style={{width: 24, height: 24, background: 'var(--accent)', borderRadius: '50%'}}></div>}
                </div>
                <span style={{ fontWeight: 700, flex: 1, fontSize: 15 }}>{c.name}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 15 }}>{c.revenue.toLocaleString('fr-FR')} €</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h3 className="section-title"><Car size={20} /> Derniers véhicules</h3>
        </div>
        <div className="recent-vehicles-scroll">
          {recentVehicles.map((plaque, i) => (
            <div key={plaque} className="vehicle-card-mini" style={{ backgroundImage: `url(${carImages[i % carImages.length]})` }} onClick={() => navigate(`/vehicule/${encodeURIComponent(plaque)}`)}>
              <div className="vehicle-card-plaque">{plaque}</div>
              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: 4, background: 'var(--accent-gradient)', borderRadius: 2, boxShadow: 'var(--accent-glow)' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
