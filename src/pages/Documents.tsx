import { useState } from 'react';
import { Search, Plus, FileText, File, Shield, Receipt, FolderOpen } from 'lucide-react';
import { useDocumentStore, useClientStore } from '../store';
import { DOCUMENT_TYPES, DocumentType } from '../types';

const DOC_ICONS: Record<DocumentType, any> = {
  carte_grise: FileText,
  assurance: Shield,
  bon_mission: File,
  facture: Receipt,
  autre: FolderOpen,
};

export default function Documents() {
  const { documents, addDocument } = useDocumentStore();
  const { clients } = useClientStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: '', type: 'autre' as DocumentType, vehiculePlaque: '', clientId: '' });

  let filtered = [...documents];
  if (search) {
    const q = search.toUpperCase();
    filtered = filtered.filter(d => d.nom.toUpperCase().includes(q) || d.vehiculePlaque?.includes(q) || clients.find(c => c.id === d.clientId)?.nom.toUpperCase().includes(q));
  }
  if (typeFilter !== 'all') filtered = filtered.filter(d => d.type === typeFilter);

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    addDocument({ ...form, vehiculePlaque: form.vehiculePlaque || undefined, clientId: form.clientId || undefined });
    setForm({ nom: '', type: 'autre', vehiculePlaque: '', clientId: '' });
    setAdding(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <Search />
        <input className="input" placeholder="Rechercher plaque, client, document..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-tabs" style={{ marginBottom: 12 }}>
        <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Tous</button>
        {(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([k, v]) => (
          <button key={k} className={`filter-tab ${typeFilter === k ? 'active' : ''}`} onClick={() => setTypeFilter(k)}>{v}</button>
        ))}
      </div>

      {filtered.map(doc => {
        const Icon = DOC_ICONS[doc.type] || FileText;
        return (
          <div key={doc.id} className="doc-card">
            <div className="doc-icon"><Icon size={20} /></div>
            <div className="doc-info">
              <div className="doc-name">{doc.nom}</div>
              <div className="doc-meta">
                {DOCUMENT_TYPES[doc.type]}
                {doc.vehiculePlaque && ` • ${doc.vehiculePlaque}`}
                {doc.clientId && ` • ${clients.find(c => c.id === doc.clientId)?.nom || ''}`}
              </div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && <div className="empty-state"><p>Aucun document</p></div>}

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Nouveau document</h3>
            <div className="input-group"><label className="input-label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Type</label><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DocumentType })}>{(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Plaque véhicule</label><input className="input" placeholder="AB-123-CD" value={form.vehiculePlaque} onChange={e => setForm({ ...form, vehiculePlaque: e.target.value.toUpperCase() })} /></div>
            <div className="input-group"><label className="input-label">Client</label><select className="input" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}><option value="">—</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Ajouter</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setAdding(true)}><Plus /></button>
    </div>
  );
}
