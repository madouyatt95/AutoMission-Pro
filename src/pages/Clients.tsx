import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Briefcase, Car, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { useClientStore, useMissionStore, useVehicleStore } from '../store';
import { STATUS_CONFIG } from '../types';
import SafeModal from '../components/SafeModal';

type ViewMode = 'clients' | 'vehicules';

export default function Clients() {
  const { clients, addClient } = useClientStore();
  const { missions } = useMissionStore();
  const { vehicles } = useVehicleStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });
  const [view, setView] = useState<ViewMode>('clients');

  const filteredClients = search ? clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())) : clients;
  const getClientCA = (id: string) => missions.reduce((s, m) => s + m.clients.filter(c => c.clientId === id).reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const getClientMissions = (id: string) => missions.filter(m => m.clients.some(c => c.clientId === id)).length;

  const filteredVehicles = search
    ? vehicles.filter(v => v.plaque.toUpperCase().includes(search.toUpperCase()) || (v.marque || '').toUpperCase().includes(search.toUpperCase()) || (v.modele || '').toUpperCase().includes(search.toUpperCase()))
    : vehicles;

  const getVehicleStats = (plaque: string) => {
    const vMissions = missions.filter(m => m.plaque === plaque);
    const ca = vMissions.reduce((s, m) => s + (m.prixTTC || 0), 0);
    const lastMission = vMissions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
    const lastClient = lastMission?.clients[0]?.clientName;
    const lastDate = lastMission?.dateTime;
    return { count: vMissions.length, ca, lastClient, lastDate };
  };

  const getLogo = (name: string, email?: string) => {
    const brandMap: Record<string, string> = {
      'avis': 'avis.com', 'hertz': 'hertz.com', 'sixt': 'sixt.com',
      'europcar': 'europcar.com', 'rent a car': 'rentacar.fr', 'ada': 'ada.fr',
      'ald': 'aldautomotive.com', 'arval': 'arval.com', 'leaseplan': 'leaseplan.com',
      'alphabet': 'alphabet.com', 'peugeot': 'peugeot.com', 'renault': 'renault.com',
      'mercedes': 'mercedes-benz.com', 'bmw': 'bmw.com', 'audi': 'audi.com',
      'volkswagen': 'volkswagen.com', 'tesla': 'tesla.com', 'toyota': 'toyota.com',
      'bnp': 'bnpparibas.com', 'société générale': 'societegenerale.com', 'fleet': 'aldautomotive.com'
    };
    const key = name.toLowerCase();
    const foundDomain = Object.keys(brandMap).find(k => key.includes(k));
    const domain = foundDomain ? brandMap[foundDomain] : email?.split('@')[1];
    if (domain && !['gmail.com', 'outlook.fr', 'orange.fr', 'wanadoo.fr', 'free.fr'].includes(domain)) {
      return `https://logo.clearbit.com/${domain}?size=128`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a0e14&color=fff&size=128&bold=true`;
  };

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    addClient(form);
    setForm({ nom: '', email: '', telephone: '', adresse: '' });
    setAdding(false);
  };

  return (
    <div className="page">
      {/* Segmented Control */}
      <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 14, padding: 4, marginBottom: 16, border: '1px solid var(--border)' }}>
        <button onClick={() => setView('clients')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', background: view === 'clients' ? 'var(--accent)' : 'transparent', color: view === 'clients' ? '#000' : 'var(--text2)', transition: 'all 0.2s' }}>
          Clients ({clients.length})
        </button>
        <button onClick={() => setView('vehicules')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', background: view === 'vehicules' ? 'var(--accent)' : 'transparent', color: view === 'vehicules' ? '#000' : 'var(--text2)', transition: 'all 0.2s' }}>
          Véhicules ({vehicles.length})
        </button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder={view === 'clients' ? 'Rechercher un client...' : 'Rechercher par plaque, marque...'} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* CLIENTS VIEW */}
      {view === 'clients' && (
        <div style={{ paddingBottom: 80 }}>
          {filteredClients.map(client => {
            const isTop = getClientCA(client.id) > 1000;
            return (
              <div key={client.id} className="client-card" onClick={() => navigate(`/client/${client.id}`)}>
                <div className="client-left">
                  <div className="client-logo-wrapper">
                    <img src={getLogo(client.nom, client.email)} className="client-logo" alt={client.nom} />
                    {isTop && (<div className="client-badge" style={{background: 'var(--orange)'}}><Briefcase size={8} color="white" /></div>)}
                  </div>
                  <div className="client-info">
                    <div className="client-name">{client.nom}</div>
                    <div className="client-contact">{client.telephone && <span>{client.telephone}</span>}</div>
                    {isTop && <div className="client-tag top">VIP</div>}
                  </div>
                </div>
                <div className="client-right">
                  <div className="client-right-stats">
                    <div className="client-ca">{getClientCA(client.id).toLocaleString('fr-FR')} €</div>
                    <div className="client-count">{getClientMissions(client.id)} missions</div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="empty-state"><p style={{fontSize: 18, fontWeight: 700, color: 'var(--text)'}}>Aucun client trouvé</p></div>
          )}
        </div>
      )}

      {/* VEHICLES VIEW */}
      {view === 'vehicules' && (
        <div style={{ paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredVehicles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(v => {
            const stats = getVehicleStats(v.plaque);
            return (
              <div key={v.id} className="card" onClick={() => navigate(`/vehicule/${encodeURIComponent(v.plaque)}`)} style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>{v.plaque}</span>
                    {v.typeVehicule && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,191,255,0.1)', color: 'var(--blue)', fontWeight: 600 }}>{v.typeVehicule}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{stats.ca.toLocaleString('fr-FR')} €</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,85,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Car size={22} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {v.marque || ''} {v.modele || ''}
                      {v.annee && <span style={{ color: 'var(--text3)', fontWeight: 500, marginLeft: 6 }}>{v.annee}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      <span>{stats.count} mission{stats.count > 1 ? 's' : ''}</span>
                      {stats.lastClient && <><span>•</span><span>{stats.lastClient}</span></>}
                    </div>
                    {stats.lastDate && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}><Clock size={10} /> {new Date(stats.lastDate).toLocaleDateString('fr-FR')}</div>}
                  </div>
                  <ChevronRight size={16} color="var(--text3)" />
                </div>
              </div>
            );
          })}
          {filteredVehicles.length === 0 && (
            <div className="empty-state"><Car size={48} /><p style={{ marginTop: 12 }}>Aucun véhicule trouvé</p></div>
          )}
        </div>
      )}

      <SafeModal isOpen={adding} onClose={() => setAdding(false)} title="Nouveau partenaire" actions={<button className="btn btn-primary btn-full" onClick={handleAdd}>Créer le client</button>}>
        <div className="input-group"><label className="input-label">Nom d'entreprise *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
        <div className="input-group"><label className="input-label">Téléphone</label><input className="input" type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Email Pro</label><input className="input" type="email" placeholder="contact@entreprise.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Adresse</label><input className="input" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
      </SafeModal>

      <button className="fab" onClick={() => view === 'clients' ? setAdding(true) : navigate('/terrain')}><Plus /></button>
    </div>
  );
}
