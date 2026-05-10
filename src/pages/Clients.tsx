import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Mail, Building, Briefcase } from 'lucide-react';
import { useClientStore, useMissionStore } from '../store';

export default function Clients() {
  const { clients, addClient } = useClientStore();
  const { missions } = useMissionStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });

  const filtered = search ? clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())) : clients;

  const getClientCA = (id: string) => missions.reduce((s, m) => s + m.clients.filter(c => c.clientId === id).reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const getClientMissions = (id: string) => missions.filter(m => m.clients.some(c => c.clientId === id)).length;

  const getLogo = (name: string, email?: string) => {
    const brandMap: Record<string, string> = {
      'avis': 'avis.com', 'hertz': 'hertz.com', 'sixt': 'sixt.com',
      'europcar': 'europcar.com', 'rent a car': 'rentacar.fr', 'ada': 'ada.fr',
      'mercedes': 'mercedes-benz.com', 'bmw': 'bmw.com', 'audi': 'audi.com',
      'volkswagen': 'volkswagen.com', 'tesla': 'tesla.com'
    };
    const key = name.toLowerCase();
    const foundDomain = Object.keys(brandMap).find(k => key.includes(k));
    const domain = foundDomain ? brandMap[foundDomain] : email?.split('@')[1];
    
    if (domain && !['gmail.com', 'outlook.fr', 'orange.fr', 'wanadoo.fr', 'free.fr'].includes(domain)) {
      return `https://logo.clearbit.com/${domain}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    addClient(form);
    setForm({ nom: '', email: '', telephone: '', adresse: '' });
    setAdding(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-subtitle">{clients.length} partenaire{clients.length > 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder="Rechercher une entreprise..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ paddingBottom: 80 }}>
        {filtered.map(client => {
          const domain = client.email?.split('@')[1];
          const isTop = getClientCA(client.id) > 1000;
          
          return (
            <div key={client.id} className="client-card" onClick={() => navigate(`/missions?client=${client.id}`)}>
              <div className="client-left">
                <div className="client-logo-wrapper">
                  <img src={getLogo(client.nom, client.email)} className="client-logo" alt={client.nom} />
                  {isTop && (
                    <div className="client-badge" style={{background: 'var(--orange)'}}><Briefcase size={8} color="white" /></div>
                  )}
                </div>
                <div className="client-info">
                  <div className="client-name">{client.nom}</div>
                  <div className="client-contact">
                    {client.telephone && <span>{client.telephone}</span>}
                  </div>
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

        {filtered.length === 0 && (
          <div className="empty-state">
            <p style={{fontSize: 18, fontWeight: 700, color: 'var(--text)'}}>Aucun client trouvé</p>
          </div>
        )}
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Nouveau partenaire</h3>
            <div className="input-group"><label className="input-label">Nom d'entreprise *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Téléphone</label><input className="input" type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Email Pro (pour le logo)</label><input className="input" type="email" placeholder="contact@entreprise.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Adresse</label><input className="input" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Créer le client</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setAdding(true)}><Plus /></button>
    </div>
  );
}
