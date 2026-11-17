import { useState } from 'react';
import { Search, Plus, FileText, File as FileIcon, Shield, Receipt, FolderOpen, Cloud, Settings2, Download, type LucideIcon } from 'lucide-react';
import { useDocumentStore, useClientStore, useSettingsStore, useExpenseTypeStore } from '../store';
import { DOCUMENT_TYPES, DEFAULT_SETTINGS, type DocumentType, type Settings } from '../types';
import { pullAllData, useSyncStore } from '../utils/supabaseSync';
import { documentBytes, formatBytes, readDocumentFile } from '../utils/documentFiles';
import SafeModal from '../components/SafeModal';

const DOC_ICONS: Record<DocumentType, LucideIcon> = {
  carte_grise: FileText,
  assurance: Shield,
  bon_mission: FileIcon,
  facture: Receipt,
  autre: FolderOpen,
};

export default function Documents() {
  const { documents, addDocument } = useDocumentStore();
  const { clients } = useClientStore();
  const { status, lastSynced, errorMessage } = useSyncStore();
  const { customExpenseTypes } = useExpenseTypeStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: '', type: 'autre' as DocumentType, vehiculePlaque: '', clientId: '' });
  const [file, setFile] = useState<{ dataUrl: string; mimeType: string; size: number } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [settingsError, setSettingsError] = useState('');

  const selectFile = async (selected: File | undefined) => {
    setFile(null);
    setFileError('');
    if (!selected) return;
    setReadingFile(true);
    try {
      const dataUrl = await readDocumentFile(selected);
      setFile({ dataUrl, mimeType: selected.type || 'application/octet-stream', size: selected.size });
      setForm(current => ({ ...current, nom: current.nom || selected.name }));
    } catch {
      setFileError('Impossible de lire ce fichier. Sélectionne-le à nouveau.');
    } finally {
      setReadingFile(false);
    }
  };

  const openSettings = () => {
    const { companyName, tva, autoAlertDaysFacturation, autoAlertDaysRelance } = useSettingsStore.getState();
    setSettingsForm({ companyName, tva, autoAlertDaysFacturation, autoAlertDaysRelance });
    setSettingsError('');
    setEditingSettings(true);
  };

  const saveSettings = () => {
    const { tva, autoAlertDaysFacturation, autoAlertDaysRelance } = settingsForm;
    if (!settingsForm.companyName.trim() || !Number.isFinite(tva) || tva < 0 || tva > 100
      || !Number.isInteger(autoAlertDaysFacturation) || autoAlertDaysFacturation < 0
      || !Number.isInteger(autoAlertDaysRelance) || autoAlertDaysRelance < 0) {
      setSettingsError('Renseigne un nom, une TVA de 0 à 100 et des délais entiers positifs ou nuls.');
      return;
    }
    useSettingsStore.getState().updateSettings({ ...settingsForm, companyName: settingsForm.companyName.trim() });
    setEditingSettings(false);
  };

  let filtered = [...documents];
  if (search) {
    const q = search.toUpperCase();
    filtered = filtered.filter(d => d.nom.toUpperCase().includes(q) || d.vehiculePlaque?.includes(q) || clients.find(c => c.id === d.clientId)?.nom.toUpperCase().includes(q));
  }
  if (typeFilter !== 'all') filtered = filtered.filter(d => d.type === typeFilter);

  const handleAdd = () => {
    if (!form.nom.trim() || !file || readingFile) return;
    addDocument({ ...form, ...file, nom: form.nom.trim(), vehiculePlaque: form.vehiculePlaque || undefined, clientId: form.clientId || undefined });
    setForm({ nom: '', type: 'autre', vehiculePlaque: '', clientId: '' });
    setAdding(false);
    setFile(null);
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
        <button className="btn-icon" aria-label="Réglages de l’application" title="Réglages" onClick={openSettings} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}><Settings2 /></button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" />
        <input placeholder="Rechercher fichier, plaque..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="storage-widget" style={{ marginBottom: 24 }}>
        <div className="storage-icon"><Cloud size={24} /></div>
        <div className="storage-info">
          <div className="storage-title">Sauvegarde Supabase</div>
          <div className="storage-value" role="status">{status === 'synced' ? 'Documents et réglages synchronisés' : status === 'error' ? 'Sauvegarde à reprendre' : status === 'not_configured' ? 'Sauvegarde cloud non configurée' : 'Synchronisation en cours…'}</div>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>{documents.length} document{documents.length > 1 ? 's' : ''} · {formatBytes(documents.reduce((sum, doc) => sum + documentBytes(doc), 0))} · copie disponible hors ligne</p>
          {lastSynced && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Dernière confirmation : {new Date(lastSynced).toLocaleString('fr-FR')}</p>}
          {status === 'error' && <><p role="alert" style={{ fontSize: 12, marginTop: 8 }}>{errorMessage}</p><button className="btn" onClick={() => { void pullAllData(); }}>Réessayer la sauvegarde</button></>}
        </div>
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
                <div className="doc-date">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</div>
                <div className="doc-size">{doc.dataUrl ? formatBytes(documentBytes(doc)) : 'Fichier non joint'}</div>
                {doc.dataUrl?.startsWith('data:') && <a href={doc.dataUrl} download={doc.nom} aria-label={`Télécharger ${doc.nom}`} style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> Télécharger</a>}
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

      <SafeModal
        isOpen={adding}
        onClose={() => { if (!readingFile) setAdding(false); }}
        title="Importer un fichier"
        actions={<button className="btn btn-primary btn-full" disabled={!file || readingFile || !form.nom.trim()} onClick={handleAdd}>Sauvegarder</button>}
      >
        <div className="input-group"><label className="input-label" htmlFor="document-file">Fichier *</label><input id="document-file" className="input" type="file" disabled={readingFile} onChange={event => { void selectFile(event.target.files?.[0]); }} />{readingFile && <p role="status">Lecture du fichier…</p>}{file && <p>{formatBytes(file.size)}</p>}{fileError && <p role="alert">{fileError}</p>}</div>
        <div className="input-group"><label className="input-label">Nom du fichier *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoFocus /></div>
        <div className="input-group"><label className="input-label">Catégorie</label><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DocumentType })}>{(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="input-group"><label className="input-label">Plaque associée</label><input className="input" placeholder="AB-123-CD" value={form.vehiculePlaque} onChange={e => setForm({ ...form, vehiculePlaque: e.target.value.toUpperCase() })} /></div>
        <div className="input-group"><label className="input-label">Client associé</label><select className="input" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}><option value="">— Aucun —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
      </SafeModal>

      <SafeModal isOpen={editingSettings} onClose={() => setEditingSettings(false)} title="Réglages" subtitle="Ces réglages sont sauvegardés avec tes documents et restaurés sur tes autres téléphones." actions={<button className="btn btn-primary btn-full" onClick={saveSettings}>Enregistrer les réglages</button>}>
        <div className="input-group"><label className="input-label" htmlFor="settings-company">Nom de l’entreprise</label><input id="settings-company" className="input" value={settingsForm.companyName} onChange={event => setSettingsForm({ ...settingsForm, companyName: event.target.value })} /></div>
        <div className="input-group"><label className="input-label" htmlFor="settings-tva">TVA (%)</label><input id="settings-tva" className="input" type="number" min="0" max="100" step="0.1" value={settingsForm.tva} onChange={event => setSettingsForm({ ...settingsForm, tva: Number(event.target.value) })} /></div>
        <div className="input-group"><label className="input-label" htmlFor="settings-facturation">Alerte de facturation (jours)</label><input id="settings-facturation" className="input" type="number" min="0" step="1" value={settingsForm.autoAlertDaysFacturation} onChange={event => setSettingsForm({ ...settingsForm, autoAlertDaysFacturation: Number(event.target.value) })} /></div>
        <div className="input-group"><label className="input-label" htmlFor="settings-relance">Alerte de relance (jours)</label><input id="settings-relance" className="input" type="number" min="0" step="1" value={settingsForm.autoAlertDaysRelance} onChange={event => setSettingsForm({ ...settingsForm, autoAlertDaysRelance: Number(event.target.value) })} /></div>
        <p style={{ color: 'var(--text2)', fontSize: 12 }}>{customExpenseTypes.length} catégorie{customExpenseTypes.length > 1 ? 's' : ''} de frais personnalisée{customExpenseTypes.length > 1 ? 's' : ''} également synchronisée{customExpenseTypes.length > 1 ? 's' : ''}.</p>
        {settingsError && <p role="alert">{settingsError}</p>}
      </SafeModal>

      <button className="fab" aria-label="Importer un document" onClick={() => { setFile(null); setFileError(''); setForm({ nom: '', type: 'autre', vehiculePlaque: '', clientId: '' }); setAdding(true); }}><Plus /></button>
    </div>
  );
}
