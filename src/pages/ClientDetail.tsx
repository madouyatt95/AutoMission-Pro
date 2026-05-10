import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Edit2, Building, User, FileText, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { useClientStore, useMissionStore, useDocumentStore } from '../store';
import { STATUS_CONFIG } from '../types';
import SafeModal from '../components/SafeModal';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient, deleteClient } = useClientStore();
  const { missions } = useMissionStore();
  const { documents } = useDocumentStore();
  
  const client = clients.find(c => c.id === id);
  
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(client || { nom: '', email: '', telephone: '', adresse: '', siret: '', type: 'entreprise' as const, conditionsPaiement: '', notes: '' });

  if (!client) return <div className="page"><p>Client introuvable</p><button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Retour</button></div>;

  const clientMissions = missions.filter(m => m.clients.some(c => c.clientId === client.id));
  const clientDocs = documents.filter(d => d.clientId === client.id);
  const totalCA = clientMissions.reduce((s, m) => s + m.clients.filter(c => c.clientId === client.id).reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const unpaid = clientMissions.reduce((s, m) => s + m.clients.filter(c => c.clientId === client.id && c.statut !== 'paye').reduce((ss, c) => ss + c.montantTTC, 0), 0);
  const lastMission = clientMissions[0];
  const vehiclePlaques = [...new Set(clientMissions.map(m => m.plaque))];

  const getLogo = (name: string, email?: string) => {
    const brandMap: Record<string, string> = {
      'avis': 'avis.com', 'hertz': 'hertz.com', 'sixt': 'sixt.com',
      'europcar': 'europcar.com', 'ald': 'aldautomotive.com', 'arval': 'arval.com',
      'leaseplan': 'leaseplan.com', 'peugeot': 'peugeot.com', 'renault': 'renault.com',
      'bnp': 'bnpparibas.com', 'société générale': 'societegenerale.com',
    };
    const key = name.toLowerCase();
    const found = Object.keys(brandMap).find(k => key.includes(k));
    const domain = found ? brandMap[found] : email?.split('@')[1];
    if (domain && !['gmail.com', 'outlook.fr', 'orange.fr', 'free.fr'].includes(domain)) return `https://logo.clearbit.com/${domain}?size=128`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a0e14&color=fff&size=128&bold=true`;
  };

  const handleEdit = () => {
    if (!form.nom.trim()) return;
    updateClient(client.id, form);
    setEditing(false);
  };

  const handleDelete = () => {
    if (clientMissions.length > 0) {
      alert("Impossible de supprimer ce client car il a des missions associées. Supprimez d'abord ses missions.");
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer ce client ?')) {
      deleteClient(client.id);
      navigate('/clients');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-icon btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Fiche Client</h1>
        <button className="btn-icon btn-secondary" onClick={() => { setForm(client); setEditing(true); }}><Edit2 size={20} /></button>
        <button className="btn-icon btn-secondary" style={{ color: 'var(--red)' }} onClick={handleDelete}><Trash2 size={20} /></button>
      </div>

      {/* Header Card */}
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', padding: 6, margin: '0 auto 16px', border: '2px solid var(--border)' }}>
          <img src={getLogo(client.nom, client.email)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} alt={client.nom} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{client.nom}</h2>
        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: client.type === 'entreprise' ? 'rgba(0,191,255,0.1)' : 'rgba(255,153,0,0.1)', color: client.type === 'entreprise' ? 'var(--blue)' : 'var(--orange)', fontWeight: 700 }}>
          {client.type === 'entreprise' ? '🏢 Entreprise' : '👤 Particulier'}
        </span>
        {client.siret && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>SIRET: {client.siret}</div>}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{clientMissions.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>MISSIONS</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)' }}>{totalCA.toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>CA TOTAL</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: unpaid > 0 ? 'var(--red)' : 'var(--green)' }}>{unpaid.toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>À ENCAISSER</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{lastMission ? new Date(lastMission.dateTime).toLocaleDateString('fr-FR') : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>DERNIÈRE INTER.</div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="section">
        <h3 className="section-title" style={{ marginBottom: 12 }}>Coordonnées</h3>
        <div className="card" style={{ padding: 16 }}>
          {client.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Phone size={16} color="var(--accent)" />
              <a href={`tel:${client.telephone}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>{client.telephone}</a>
            </div>
          )}
          {client.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Mail size={16} color="var(--accent)" />
              <a href={`mailto:${client.email}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>{client.email}</a>
            </div>
          )}
          {client.adresse && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <MapPin size={16} color="var(--accent)" />
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>{client.adresse}</span>
            </div>
          )}
          {client.conditionsPaiement && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={16} color="var(--accent)" />
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>Paiement : {client.conditionsPaiement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      {vehiclePlaques.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}>Véhicules ({vehiclePlaques.length})</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {vehiclePlaques.map(p => (
              <div key={p} className="chip active" onClick={() => navigate(`/vehicule/${encodeURIComponent(p)}`)} style={{ cursor: 'pointer', fontFamily: 'var(--mono)', fontWeight: 800 }}>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission History */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Historique Missions</h3>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{clientMissions.length}</span>
        </div>
        <div className="card" style={{ padding: '0 16px' }}>
          {clientMissions.slice(0, 10).map((m, i) => {
            const cfg = STATUS_CONFIG[m.statut];
            return (
              <div key={m.id} onClick={() => navigate(`/mission/${m.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < Math.min(clientMissions.length, 10) - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13 }}>{m.plaque}</div>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{(m.types || [m.type]).join(', ')}</div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents */}
      {clientDocs.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}><FileText size={18} /> Documents ({clientDocs.length})</h3>
          <div className="card" style={{ padding: '0 16px' }}>
            {clientDocs.slice(0, 5).map((d, i) => (
              <div key={d.id} style={{ padding: '12px 0', borderBottom: i < Math.min(clientDocs.length, 5) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{d.nom}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {client.notes && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 12 }}>Notes internes</h3>
          <div className="card" style={{ padding: 16, color: 'var(--text2)', fontSize: 14 }}>{client.notes}</div>
        </div>
      )}

      <SafeModal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Modifier le client"
        actions={<button className="btn btn-primary btn-full" onClick={handleEdit}>Enregistrer</button>}
      >
        <div className="input-group">
          <label className="input-label">Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${form.type === 'entreprise' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setForm({ ...form, type: 'entreprise' })}><Building size={16} /> Entreprise</button>
            <button className={`btn ${form.type === 'particulier' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setForm({ ...form, type: 'particulier' })}><User size={16} /> Particulier</button>
          </div>
        </div>
        <div className="input-group"><label className="input-label">Nom d'entreprise / Prénom Nom *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Téléphone</label><input className="input" type="tel" value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Email Pro (pour le logo)</label><input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Adresse postale</label><input className="input" value={form.adresse || ''} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
        {form.type === 'entreprise' && (
          <div className="input-group"><label className="input-label">SIRET</label><input className="input" value={form.siret || ''} onChange={e => setForm({ ...form, siret: e.target.value })} /></div>
        )}
        <div className="input-group"><label className="input-label">Conditions de paiement</label><input className="input" placeholder="Ex: 30 jours fin de mois" value={form.conditionsPaiement || ''} onChange={e => setForm({ ...form, conditionsPaiement: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Notes internes</label><textarea className="input" style={{ minHeight: 80 }} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </SafeModal>
    </div>
  );
}
