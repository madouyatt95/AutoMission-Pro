import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Trash2, Camera, Mic, MicOff, MapPin, Send, Plus, X, Download, PenTool, Bell } from 'lucide-react';
import { useMissionStore, useClientStore, useSettingsStore, useRappelStore } from '../store';
import SignaturePad from '../components/SignaturePad';
import SafeModal from '../components/SafeModal';
import Vehicle360DamagePicker from '../components/Vehicle360DamagePicker';
import { generateRapportExpertise, generateFacture } from '../utils/exportPdf';
import { MISSION_TYPES, STATUS_CONFIG, VEHICLE_COLORS, CONDITION_LABELS, VEHICLE_PARTS, DAMAGE_TYPES, MissionStatus, MissionType, VehicleView, DamageType, Degat, VehicleCondition } from '../types';

type Tab = 'info' | 'degats' | 'billing' | 'docs';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { missions, updateMission, deleteMission, duplicateMission } = useMissionStore();
  const { clients } = useClientStore();
  const settings = useSettingsStore();
  const { addRappel, rappels } = useRappelStore();
  const mission = missions.find(m => m.id === id);

  const [tab, setTab] = useState<Tab>('info');
  const [showDelete, setShowDelete] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfOpts, setPdfOpts] = useState({ inclureNotes: true, inclurePrix: true, inclurePhotos: true, inclureDegats: true, inclureDocs: false, inclureGeo: false, inclureSignature: true, inclureClient: true });
  const [pdfClientId, setPdfClientId] = useState<string | null>(null);

  if (!mission) return <div className="page"><p>Mission introuvable</p><button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Retour</button></div>;

  const update = (u: any) => {
    updateMission(mission.id, u);
  };

  const finalizeMission = () => {
    update({ brouillon: false });
    // Auto alert for billing
    const alertExists = rappels.some(r => r.missionId === mission.id && r.titre.includes('Facturer'));
    if (!alertExists) {
      const date = new Date();
      date.setDate(date.getDate() + settings.autoAlertDaysFacturation);
      addRappel({
        titre: `Facturer mission ${mission.plaque}`,
        date: date.toISOString().split('T')[0],
        missionId: mission.id,
        vehiculePlaque: mission.plaque
      });
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn-icon btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span className="mission-plaque">{mission.plaque}</span>
          {(mission.prestations || []).map((p: any) => (
            <span key={p.id} className="mission-type-badge">{p.type}</span>
          ))}
          {(!mission.prestations || mission.prestations.length === 0) && mission.type && (
            <span className="mission-type-badge">{mission.type}</span>
          )}
        </div>
        <button className="btn-icon btn-secondary" onClick={() => { duplicateMission(mission.id); navigate('/missions'); }}><Copy size={18} /></button>
      </div>

      <div className="detail-tabs">
        {([['info', 'Infos'], ['degats', 'Dégâts'], ['billing', 'Facturation'], ['docs', 'Docs']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={`detail-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}{k === 'degats' && mission.degats.length > 0 ? ` (${mission.degats.length})` : ''}</button>
        ))}
      </div>

      {tab === 'info' && <InfoTab mission={mission} update={update} clients={clients} />}
      {tab === 'degats' && <DegatsTab mission={mission} update={update} />}
      {tab === 'billing' && <BillingTab mission={mission} update={update} clients={clients} />}
      {tab === 'docs' && <DocsTab mission={mission} />}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary btn-full" onClick={finalizeMission}><Save size={18} /> {mission.brouillon ? 'Finaliser la mission' : 'Mission finalisée ✓'}</button>
        <button className="btn btn-secondary btn-full" onClick={() => setShowPdfOptions(true)}><Download size={18} /> Générer Rapport (PDF)</button>
        {mission.clients.length > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {mission.clients.map(c => (
              <button key={c.clientId} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => { setPdfClientId(c.clientId); setShowPdfOptions(true); }}>
                📄 {c.clientName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
        <button className="btn btn-danger btn-full" onClick={() => setShowDelete(true)}><Trash2 size={18} /> Supprimer</button>
      </div>

      {/* PDF Options Modal */}
      <SafeModal
        isOpen={showPdfOptions}
        onClose={() => { setShowPdfOptions(false); setPdfClientId(null); }}
        title="Options du rapport PDF"
        subtitle={pdfClientId ? <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>Rapport pour : {mission.clients.find(c => c.clientId === pdfClientId)?.clientName}</p> : undefined}
        actions={
          <button className="btn btn-primary btn-full" onClick={() => { generateRapportExpertise(mission, settings); setShowPdfOptions(false); setPdfClientId(null); }}>
            <Download size={16} /> Générer le PDF
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {([
            ['inclureNotes', 'Inclure les notes'],
            ['inclurePrix', 'Inclure le prix TTC'],
            ['inclurePhotos', 'Inclure les photos'],
            ['inclureDegats', 'Inclure les dégâts'],
            ['inclureDocs', 'Inclure les documents'],
            ['inclureGeo', 'Inclure la géolocalisation'],
            ['inclureSignature', 'Inclure les signatures'],
            ['inclureClient', 'Inclure coordonnées client'],
          ] as [string, string][]).map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              <div onClick={() => setPdfOpts(prev => ({ ...prev, [key]: !(prev as any)[key] }))} style={{ width: 48, height: 28, borderRadius: 14, background: (pdfOpts as any)[key] ? 'var(--accent)' : 'var(--surface3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: (pdfOpts as any)[key] ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </label>
          ))}
        </div>
      </SafeModal>

      <SafeModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Supprimer cette mission ?"
        subtitle={<p style={{ color: 'var(--text2)' }}>Cette action est irréversible.</p>}
        actions={
          <>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { deleteMission(mission.id); navigate('/missions'); }}>Supprimer</button>
          </>
        }
      >
        {/* No additional content needed */}
      </SafeModal>
    </div>
  );
}

function InfoTab({ mission, update, clients }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [addingAlert, setAddingAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({ titre: `Suivi mission ${mission.plaque}`, date: new Date().toISOString().split('T')[0] });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  const { addRappel, rappels } = useRappelStore();
  const settings = useSettingsStore();

  const handleStatusChange = (newStatus: MissionStatus) => {
    update({ statut: newStatus });
    if (newStatus === 'en_attente') {
      const alertExists = rappels.some(r => r.missionId === mission.id && r.titre.includes('Relancer'));
      if (!alertExists) {
        const date = new Date();
        date.setDate(date.getDate() + settings.autoAlertDaysRelance);
        addRappel({
          titre: `Relancer client pour ${mission.plaque}`,
          date: date.toISOString().split('T')[0],
          missionId: mission.id,
          vehiculePlaque: mission.plaque
        });
      }
    }
  };

  const handleManualAlert = () => {
    addRappel({
      titre: alertForm.titre,
      date: alertForm.date,
      missionId: mission.id,
      vehiculePlaque: mission.plaque
    });
    setAddingAlert(false);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        update({ photos: [...mission.photos, { id: crypto.randomUUID?.() || Date.now().toString(), dataUrl: ev.target?.result, timestamp: new Date().toISOString() }] });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const toggleVoice = async () => {
    if (recording) { mediaRecorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = ev => {
          update({ notesVocales: [...mission.notesVocales, { id: crypto.randomUUID?.() || Date.now().toString(), dataUrl: ev.target?.result, duration: Math.round((Date.now() - recordStartRef.current) / 1000), timestamp: new Date().toISOString() }] });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { alert('Micro non disponible'); }
  };

  return (
    <div>
      <div className="input-group">
        <label className="input-label">Statut</label>
        <div className="chips">
          {(Object.entries(STATUS_CONFIG) as [MissionStatus, any][]).map(([key, cfg]) => (
            <button key={key} className={`chip ${mission.statut === key ? 'active' : ''}`} style={mission.statut === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}} onClick={() => handleStatusChange(key)}>{cfg.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-secondary btn-full" onClick={() => setAddingAlert(true)}><Bell size={18} /> Programmer un rappel</button>
      </div>

      <div className="input-group">
        <label className="input-label">Prestations réalisées</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(mission.prestations || []).map((p: any) => (
            <div key={p.id} className="chip active" style={{ fontSize: 13, background: 'var(--surface2)', borderColor: 'var(--border)' }}>
              {p.type}
            </div>
          ))}
          {(!mission.prestations || mission.prestations.length === 0) && (
            <div className="chip active">{mission.type}</div>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>Pour ajouter ou modifier des prestations, allez dans l'onglet Facturation.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label">Date</label>
          <input className="input" type="date" value={mission.dateTime.split('T')[0]} onChange={e => update({ dateTime: e.target.value + 'T' + mission.dateTime.split('T')[1] })} />
        </div>
        <div className="input-group">
          <label className="input-label">Heure</label>
          <input className="input" type="time" value={mission.dateTime.split('T')[1]?.substring(0, 5) || ''} onChange={e => update({ dateTime: mission.dateTime.split('T')[0] + 'T' + e.target.value + ':00.000Z' })} />
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Kilométrage</label>
        <input className="input" type="number" placeholder="0" value={mission.kilometrage || ''} onChange={e => update({ kilometrage: parseInt(e.target.value) || undefined })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label">Couleur</label>
          <select className="input" value={mission.couleur || ''} onChange={e => update({ couleur: e.target.value })}>
            <option value="">—</option>
            {VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">État général</label>
          <select className="input" value={mission.etatGeneral || ''} onChange={e => update({ etatGeneral: e.target.value as VehicleCondition })}>
            <option value="">—</option>
            {(Object.entries(CONDITION_LABELS) as [VehicleCondition, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Prix TTC (€)</label>
        <input className="input" type="number" step="0.01" placeholder="0.00" value={mission.prixTTC ?? ''} onChange={e => update({ prixTTC: parseFloat(e.target.value) || undefined })} />
      </div>

      <div className="input-group">
        <label className="input-label">Notes</label>
        <textarea className="input textarea" placeholder="Notes de mission..." value={mission.notesTexte || ''} onChange={e => update({ notesTexte: e.target.value })} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}><Camera size={18} /> Photo ({mission.photos.length})</button>
        <button className="btn btn-secondary" style={{ flex: 1, ...(recording ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }} onClick={toggleVoice}>{recording ? <><MicOff size={18} /> Stop</> : <><Mic size={18} /> Vocal ({mission.notesVocales.length})</>}</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handlePhoto} />

      {mission.photos.length > 0 && (
        <div className="photo-grid">
          {mission.photos.map((p: any) => (
            <div key={p.id} className="photo-thumb"><img src={p.dataUrl} alt="" /></div>
          ))}
        </div>
      )}

      {mission.notesVocales.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {mission.notesVocales.map((v: any) => (
            <div key={v.id} className="voice-note">
              <Mic size={16} color="var(--accent)" />
              <div className="voice-bar"><div className="voice-bar-fill" /></div>
              <span className="voice-duration">{v.duration}s</span>
            </div>
          ))}
        </div>
      )}

      {mission.geolocation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
          <MapPin size={14} color="var(--green)" /> {mission.geolocation.lat.toFixed(4)}, {mission.geolocation.lng.toFixed(4)}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <div className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><PenTool size={16} /> Signature du client</div>
        {mission.signature ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface2)', position: 'relative' }}>
            <img src={mission.signature} alt="Signature" style={{ width: '100%', height: 150, objectFit: 'contain' }} />
            <button 
              className="btn-icon btn-secondary" 
              style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, background: 'rgba(0,0,0,0.5)', color: 'white' }} 
              onClick={() => update({ signature: undefined })}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <SignaturePad onSave={(base64) => update({ signature: base64 })} />
        )}
      </div>

      <SafeModal
        isOpen={addingAlert}
        onClose={() => setAddingAlert(false)}
        title="Nouveau rappel"
        actions={<button className="btn btn-primary btn-full" onClick={handleManualAlert}>Créer le rappel</button>}
      >
        <div className="input-group"><label className="input-label">Titre *</label><input className="input" value={alertForm.titre} onChange={e => setAlertForm({ ...alertForm, titre: e.target.value })} autoFocus /></div>
        <div className="input-group"><label className="input-label">Date</label><input className="input" type="date" value={alertForm.date} onChange={e => setAlertForm({ ...alertForm, date: e.target.value })} /></div>
      </SafeModal>
    </div>
  );
}

function DegatsTab({ mission, update }: any) {
  const removeDamage = (id: string) => {
    update({ degats: mission.degats.filter((d: Degat) => d.id !== id) });
  };

  return (
    <div>
      <Vehicle360DamagePicker
        degats={mission.degats}
        onAddDegat={(d) => update({ degats: [...mission.degats, { ...d, id: Date.now().toString() }] })}
        onRemoveDegat={removeDamage}
      />
    </div>
  );
}

function BillingTab({ mission, update, clients }: any) {
  const settings = useSettingsStore();
  const [addingPrestation, setAddingPrestation] = useState(false);
  const [newType, setNewType] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const prestations = mission.prestations || [];

  const addPrestation = () => {
    if (!newType) return;
    const client = clients.find((c: any) => c.id === newClientId);
    
    // Update the mission.prestations
    const updatedPrestations = [...prestations, {
      id: crypto.randomUUID?.() || Date.now().toString(),
      type: newType,
      prixTTC: parseFloat(newAmount) || 0,
      clientId: client?.id,
      clientName: client?.nom,
      statut: 'a_facturer'
    }];
    
    // Also add to mission.types if not present
    const updatedTypes = [...mission.types];
    if (!updatedTypes.includes(newType)) updatedTypes.push(newType);

    update({ prestations: updatedPrestations, types: updatedTypes });
    setAddingPrestation(false);
    setNewType('');
    setNewClientId('');
    setNewAmount('');
  };

  const updatePrestation = (idx: number, updates: any) => {
    const updated = [...prestations];
    updated[idx] = { ...updated[idx], ...updates };
    update({ prestations: updated });
  };

  const removePrestation = (idx: number) => {
    const updated = [...prestations];
    updated.splice(idx, 1);
    update({ prestations: updated });
  };

  // Group prestations by client for PDF generation
  const clientGroups = prestations.reduce((acc: any, p: any) => {
    const key = p.clientId || 'no_client';
    if (!acc[key]) acc[key] = { clientName: p.clientName || 'Non assigné', clientId: p.clientId, total: 0 };
    acc[key].total += p.prixTTC;
    return acc;
  }, {});

  return (
    <div>
      {/* Generate Invoice Buttons by Client */}
      {Object.values(clientGroups).map((g: any) => g.clientId ? (
        <button key={g.clientId} className="btn btn-secondary btn-full" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }} onClick={() => generateFacture(mission, settings, g.clientId)}>
          <span><Download size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Facture pour {g.clientName}</span>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{g.total.toLocaleString('fr-FR')} €</span>
        </button>
      ) : null)}

      <div className="input-label" style={{ marginTop: 16, marginBottom: 8 }}>PRESTATIONS ({prestations.length})</div>

      {prestations.map((p: any, i: number) => (
        <div key={p.id || i} className="card" style={{ marginBottom: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{p.type}</div>
            <button onClick={() => removePrestation(i)} style={{ background: 'none', border: 'none', color: 'var(--red)' }}><Trash2 size={16} /></button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Prix TTC (€)</label>
              <input className="input" type="number" step="0.01" value={p.prixTTC === 0 && !p.prixTTC ? '' : p.prixTTC} onChange={e => updatePrestation(i, { prixTTC: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Client facturé</label>
              <select className="input" value={p.clientId || ''} onChange={e => {
                const client = clients.find((c: any) => c.id === e.target.value);
                updatePrestation(i, { clientId: client?.id, clientName: client?.nom });
              }}>
                <option value="">Non assigné</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>

          <div className="chips">
            {(['a_facturer', 'facture', 'paye'] as const).map(s => (
              <button key={s} className={`chip ${p.statut === s ? 'active' : ''}`} style={{ ...(p.statut === s ? { background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, borderColor: STATUS_CONFIG[s].color } : {}), padding: '4px 10px', fontSize: 11 }} onClick={() => updatePrestation(i, { statut: s })}>{STATUS_CONFIG[s].label}</button>
            ))}
          </div>
        </div>
      ))}

      {!addingPrestation ? (
        <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => setAddingPrestation(true)}><Plus size={18} /> Ajouter une prestation</button>
      ) : (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="input-group">
            <label className="input-label">Type de prestation</label>
            <select className="input" value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="">Sélectionner...</option>
              {MISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Prix TTC (€)</label>
            <input className="input" type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Client</label>
            <select className="input" value={newClientId} onChange={e => setNewClientId(e.target.value)}>
              <option value="">Non assigné</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAddingPrestation(false)}>Annuler</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addPrestation} disabled={!newType}>Ajouter</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocsTab({ mission }: any) {
  return (
    <div>
      {mission.documents.length === 0 && (
        <div className="empty-state">
          <p>Aucun document lié</p>
        </div>
      )}
      {mission.documents.map((d: any) => (
        <div key={d.id} className="doc-card">
          <div className="doc-info">
            <div className="doc-name">{d.nom}</div>
            <div className="doc-meta">{d.type}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
