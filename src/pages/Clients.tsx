import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Mail, X } from 'lucide-react';
import { useClientStore, useMissionStore } from '../store';

export default function Clients() {
  const { clients, addClient, deleteClient } = useClientStore();
  const { missions } = useMissionStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });

  const filtered = search ? clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())) : clients;

  const getClientCA = (id: string) => missions.reduce((s, m) => s + m.clients.filter(c => c.clientId === id).reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const getClientMissions = (id: string) => missions.filter(m => m.clients.some(c => c.clientId === id)).length;

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
        <p className="page-subtitle">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <Search />
        <input className="input" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.map(client => (
        <div key={client.id} className="card client-card" onClick={() => navigate(`/missions?client=${client.id}`)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="client-name">{client.nom}</div>
              <div className="client-info">
                {client.telephone && <span><Phone size={11} /> {client.telephone} </span>}
                {client.email && <span><Mail size={11} /> {client.email}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{getClientCA(client.id).toLocaleString('fr-FR')} €</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{getClientMissions(client.id)} missions</div>
            </div>
          </div>
        </div>
      ))}

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Nouveau client</h3>
            <div className="input-group"><label className="input-label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Téléphone</label><input className="input" type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Adresse</label><input className="input" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Ajouter</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setAdding(true)}><Plus /></button>
    </div>
  );
}
