import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Trash2, Camera, Mic, MicOff, MapPin, Send, Plus, X, Download, PenTool, Bell } from 'lucide-react';
import { useMissionStore, useClientStore, useSettingsStore, useRappelStore } from '../store';
import SignaturePad from '../components/SignaturePad';
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
        <div style={{ flex: 1 }}>
          <span className="mission-plaque">{mission.plaque}</span>
          <span className="mission-type-badge" style={{ marginLeft: 8 }}>{mission.type}</span>
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
        <button className="btn btn-secondary btn-full" onClick={() => generateRapportExpertise(mission, settings)}><Download size={18} /> Télécharger Rapport (PDF)</button>
        <button className="btn btn-danger btn-full" onClick={() => setShowDelete(true)}><Trash2 size={18} /> Supprimer</button>
      </div>

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Supprimer cette mission ?</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>Annuler</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { deleteMission(mission.id); navigate('/missions'); }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
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
        <label className="input-label">Type de mission</label>
        <select className="input" value={mission.type} onChange={e => update({ type: e.target.value })}>
          {MISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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

      {addingAlert && (
        <div className="modal-overlay" onClick={() => setAddingAlert(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Nouveau rappel</h3>
            <div className="input-group"><label className="input-label">Titre *</label><input className="input" value={alertForm.titre} onChange={e => setAlertForm({ ...alertForm, titre: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Date</label><input className="input" type="date" value={alertForm.date} onChange={e => setAlertForm({ ...alertForm, date: e.target.value })} /></div>
            <button className="btn btn-primary btn-full" onClick={handleManualAlert}>Créer le rappel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DegatsTab({ mission, update }: any) {
  const [view, setView] = useState<VehicleView>('avant');
  const [addingPart, setAddingPart] = useState<string | null>(null);
  const [damageType, setDamageType] = useState<DamageType>('rayure');
  const [damageComment, setDamageComment] = useState('');

  const views: [VehicleView, string][] = [['avant', 'Avant'], ['arriere', 'Arrière'], ['gauche', 'Gauche'], ['droite', 'Droite'], ['dessus', 'Dessus']];
  const parts = VEHICLE_PARTS[view];

  const addDamage = () => {
    if (!addingPart) return;
    const newDegat: Degat = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      piece: addingPart,
      vue: view,
      type: damageType,
      commentaire: damageComment || undefined,
    };
    update({ degats: [...mission.degats, newDegat] });
    setAddingPart(null);
    setDamageComment('');
  };

  const removeDamage = (degatId: string) => {
    update({ degats: mission.degats.filter((d: Degat) => d.id !== degatId) });
  };

  const getDamageCount = (part: string) => mission.degats.filter((d: Degat) => d.piece === part && d.vue === view).length;

  return (
    <div>
      <div className="damage-views">
        {views.map(([k, l]) => (
          <button key={k} className={`damage-view-btn ${view === k ? 'active' : ''}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>

      <div className="damage-parts">
        {parts.map(part => (
          <button key={part} className="damage-part-btn" onClick={() => setAddingPart(part)}>
            {part}
            {getDamageCount(part) > 0 && <span className="count">{getDamageCount(part)}</span>}
          </button>
        ))}
      </div>

      {addingPart && (
        <div className="modal-overlay" onClick={() => setAddingPart(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Dégât — {addingPart}</h3>
            <div className="input-label">Type de dégât</div>
            <div className="damage-type-chips">
              {(Object.entries(DAMAGE_TYPES) as [DamageType, string][]).map(([k, v]) => (
                <button key={k} className={`chip ${damageType === k ? 'active' : ''}`} onClick={() => setDamageType(k)}>{v}</button>
              ))}
            </div>
            <div className="input-group">
              <label className="input-label">Commentaire</label>
              <textarea className="input textarea" placeholder="Détails..." value={damageComment} onChange={e => setDamageComment(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={addDamage}><Plus size={18} /> Ajouter le dégât</button>
          </div>
        </div>
      )}

      {mission.degats.length > 0 && (
        <div className="damage-list">
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Dégâts enregistrés ({mission.degats.length})</h4>
          {mission.degats.map((d: Degat) => (
            <div key={d.id} className="damage-item">
              <div className="damage-item-info">
                <div className="damage-item-piece">{d.piece}</div>
                <div className="damage-item-type">{DAMAGE_TYPES[d.type]}{d.commentaire ? ` — ${d.commentaire}` : ''}</div>
              </div>
              <button className="btn-icon btn-secondary" style={{ width: 32, height: 32 }} onClick={() => removeDamage(d.id)}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingTab({ mission, update, clients }: any) {
  const settings = useSettingsStore();
  const [addingClient, setAddingClient] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const addClientBilling = () => {
    if (!newClientId || !newAmount) return;
    const client = clients.find((c: any) => c.id === newClientId);
    update({
      clients: [...mission.clients, {
        clientId: newClientId,
        clientName: client?.nom || 'Inconnu',
        montantTTC: parseFloat(newAmount),
        facturationDifferee: false,
        statut: 'a_facturer',
        notesInternes: '',
      }]
    });
    setAddingClient(false);
    setNewClientId('');
    setNewAmount('');
  };

  const updateClientStatus = (idx: number, statut: string) => {
    const updated = [...mission.clients];
    updated[idx] = { ...updated[idx], statut };
    update({ clients: updated });
  };

  return (
    <div>
      {mission.clients.map((c: any, i: number) => (
        <div key={i} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="client-name">{c.clientName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mission-price">{c.montantTTC.toLocaleString('fr-FR')} €</span>
              <button className="btn-icon btn-secondary" style={{ width: 32, height: 32 }} onClick={() => generateFacture(mission, settings, c.clientId)} title="Générer Facture PDF">
                <Download size={14} />
              </button>
            </div>
          </div>
          <div className="chips" style={{ marginTop: 8 }}>
            {(['a_facturer', 'facture', 'paye'] as const).map(s => (
              <button key={s} className={`chip ${c.statut === s ? 'active' : ''}`} style={c.statut === s ? { background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, borderColor: STATUS_CONFIG[s].color } : {}} onClick={() => updateClientStatus(i, s)}>{STATUS_CONFIG[s].label}</button>
            ))}
          </div>
        </div>
      ))}

      {!addingClient ? (
        <button className="btn btn-secondary btn-full" onClick={() => setAddingClient(true)}><Plus size={18} /> Ajouter un client</button>
      ) : (
        <div className="card">
          <div className="input-group">
            <label className="input-label">Client</label>
            <select className="input" value={newClientId} onChange={e => setNewClientId(e.target.value)}>
              <option value="">Sélectionner...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Montant TTC (€)</label>
            <input className="input" type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAddingClient(false)}>Annuler</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addClientBilling}>Ajouter</button>
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
