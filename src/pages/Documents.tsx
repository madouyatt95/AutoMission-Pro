import { useState } from 'react';
import { Search, Plus, FileText, File, Shield, Receipt, FolderOpen, Database, MoreHorizontal } from 'lucide-react';
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

  const getDocTypeClass = (type: DocumentType) => {
    if (type === 'facture' || type === 'bon_mission') return 'type-pdf';
    if (type === 'autre') return 'type-folder';
    return 'type-doc';
  };

  return (
    <div className="page">
      <div className="page-header page-header-flex">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{documents.length} fichier{documents.length > 1 ? 's' : ''} indexés</p>
        </div>
        <button className="btn-icon" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}><MoreHorizontal /></button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder="Rechercher fichier, plaque..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="storage-widget" style={{ marginBottom: 24 }}>
        <div className="storage-icon"><Database size={24} /></div>
        <div className="storage-info">
          <div className="storage-title">Stockage Local (Offline)</div>
          <div className="storage-value">24% <span style={{fontSize: 12, color: 'var(--text2)', fontWeight: 500}}>utilisés sur 50Mo</span></div>
          <div className="storage-bar-bg">
            <div className="storage-bar-fill"></div>
          </div>
        </div>
        <div className="storage-circle"><span>24%</span></div>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Tous</button>
        {(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([k, v]) => (
          <button key={k} className={`filter-tab ${typeFilter === k ? 'active' : ''}`} onClick={() => setTypeFilter(k)}>{v}</button>
        ))}
      </div>

      <div style={{ paddingBottom: 80 }}>
        {filtered.map(doc => {
          const Icon = DOC_ICONS[doc.type] || FileText;
          return (
            <div key={doc.id} className={`doc-card ${getDocTypeClass(doc.type)}`}>
              <div className="doc-icon"><Icon /></div>
              <div className="doc-info">
                <div className="doc-name">{doc.nom}</div>
                <div className="doc-tags">
                  <span className="doc-tag-pill">{DOCUMENT_TYPES[doc.type]}</span>
                  {doc.vehiculePlaque && <span className="doc-tag-pill" style={{ fontFamily: 'var(--mono)' }}>{doc.vehiculePlaque}</span>}
                </div>
              </div>
              <div className="doc-right">
                <div className="doc-date">Aujourd'hui</div>
                <div className="doc-size">{Math.floor(Math.random() * 500) + 10} Ko</div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p style={{fontSize: 18, fontWeight: 700, color: 'var(--text)'}}>Aucun document</p>
          </div>
        )}
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Importer un fichier</h3>
            <div className="input-group"><label className="input-label">Nom du fichier *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Catégorie</label><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DocumentType })}>{(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Plaque associée</label><input className="input" placeholder="AB-123-CD" value={form.vehiculePlaque} onChange={e => setForm({ ...form, vehiculePlaque: e.target.value.toUpperCase() })} /></div>
            <div className="input-group"><label className="input-label">Client associé</label><select className="input" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}><option value="">— Aucun —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Sauvegarder</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setAdding(true)}><Plus /></button>
    </div>
  );
}
