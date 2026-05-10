import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Mic, MicOff, Check, MapPin, ScanLine, X, Plus, Edit2, Search, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useMissionStore, useVehicleStore, useClientStore, useCustomTypeStore } from '../store';
import { MISSION_TYPES, CAR_BRANDS, FUEL_TYPES, GEARBOX_TYPES, VEHICLE_COLORS } from '../types';
import SafeModal from '../components/SafeModal';

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

export default function Terrain() {
  const navigate = useNavigate();
  const addMission = useMissionStore(s => s.addMission);
  const { vehicles, addVehicle, getByPlaque } = useVehicleStore();
  const { clients } = useClientStore();
  const { customTypes, addType } = useCustomTypeStore();

  const [plaque, setPlaque] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string; timestamp: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#ff5500');

  // Vehicle fields
  const [vMarque, setVMarque] = useState('');
  const [vModele, setVModele] = useState('');
  const [vAnnee, setVAnnee] = useState('');
  const [vCarburant, setVCarburant] = useState('');
  const [vBoite, setVBoite] = useState('');
  const [vCouleur, setVCouleur] = useState('');
  const [vKm, setVKm] = useState('');
  const [vVin, setVVin] = useState('');

  // Autocomplete
  const [plaqueResults, setPlaqueResults] = useState<typeof vehicles>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {});
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = 'fr-FR';
      r.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) if (e.results[i].isFinal) t += e.results[i][0].transcript + ' ';
        if (t) setNotes(p => p + (p.endsWith(' ') || !p.length ? '' : ' ') + t);
      };
      r.onerror = () => setRecording(false);
      r.onend = () => setRecording(false);
      recognitionRef.current = r;
    }
  }, []);

  // Plaque autocomplete
  useEffect(() => {
    if (plaque.length >= 2) {
      const q = plaque.toUpperCase();
      const results = vehicles.filter(v => v.plaque.includes(q)).slice(0, 5);
      setPlaqueResults(results);
      setShowAutocomplete(results.length > 0);
    } else {
      setPlaqueResults([]);
      setShowAutocomplete(false);
    }
  }, [plaque, vehicles]);

  // Auto-fill when plaque matches exactly
  useEffect(() => {
    if (plaque.length >= 7) {
      const found = getByPlaque(plaque);
      if (found) {
        setVMarque(found.marque || '');
        setVModele(found.modele || '');
        setVAnnee(found.annee?.toString() || '');
        setVCarburant(found.carburant || '');
        setVBoite(found.boiteVitesses || '');
        setVCouleur(found.couleur || '');
        setVKm(found.kilometrage?.toString() || '');
        setVVin(found.vin || '');
      }
    }
  }, [plaque, getByPlaque]);

  const selectAutocomplete = (v: typeof vehicles[0]) => {
    setPlaque(v.plaque);
    setShowAutocomplete(false);
    setVMarque(v.marque || '');
    setVModele(v.modele || '');
    setVAnnee(v.annee?.toString() || '');
    setVCarburant(v.carburant || '');
    setVBoite(v.boiteVitesses || '');
    setVCouleur(v.couleur || '');
    setVKm(v.kilometrage?.toString() || '');
    setVVin(v.vin || '');
  };

  const allTypes = useMemo(() => [
    ...MISSION_TYPES,
    ...customTypes.map(ct => ct.nom)
  ], [customTypes]);

  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handlePhoto = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, { id: crypto.randomUUID?.() || Date.now().toString(), dataUrl: ev.target?.result as string, timestamp: new Date().toISOString() }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) { alert("Dictée vocale non supportée."); return; }
    if (recording) { recognitionRef.current.stop(); setRecording(false); }
    else { try { recognitionRef.current.start(); setRecording(true); } catch (e) { console.error(e); } }
  };

  const startOcrScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Pick a random existing vehicle for demo
      if (vehicles.length > 0) {
        const v = vehicles[Math.floor(Math.random() * vehicles.length)];
        selectAutocomplete(v);
      }
      setIsScanning(false);
    }, 2000);
  };

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    addType({ nom: newTypeName.trim(), couleur: newTypeColor });
    setSelectedTypes(prev => [...prev, newTypeName.trim()]);
    setNewTypeName('');
    setShowAddType(false);
  };

  const handleSubmit = () => {
    if (!plaque.trim() || selectedTypes.length === 0) return;
    setSaving(true);

    // Save/update vehicle
    const existingVehicle = getByPlaque(plaque);
    if (!existingVehicle) {
      addVehicle({
        plaque: plaque.trim(),
        marque: vMarque || undefined,
        modele: vModele || undefined,
        annee: vAnnee ? parseInt(vAnnee) : undefined,
        carburant: vCarburant as any || undefined,
        boiteVitesses: vBoite as any || undefined,
        couleur: vCouleur || undefined,
        kilometrage: vKm ? parseInt(vKm) : undefined,
        vin: vVin || undefined,
      });
    }

    const mission = addMission({
      plaque: plaque.trim(),
      types: selectedTypes,
      type: selectedTypes[0],
      photos,
      notesTexte: notes,
      geolocation: geo || undefined,
      brouillon: true,
      statut: 'a_facturer',
      couleur: vCouleur || undefined,
      kilometrage: vKm ? parseInt(vKm) : undefined,
    });

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => navigate(`/mission/${mission.id}`), 600);
    }, 300);
  };

  if (saved) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,230,118,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--green-glow)' }}>
            <Check size={40} color="var(--green)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Mission créée !</h2>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>Brouillon sauvegardé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 150 }}>
      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsScanning(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={32} /></button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ border: '3px solid var(--accent)', width: '80%', height: 120, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 0 30px rgba(255,85,0,0.3)' }}>
              <div style={{ width: '100%', height: 2, background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)', position: 'absolute', top: 0, left: 0, animation: 'scan 1.5s infinite linear' }} />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }` }} />
          </div>
          <div style={{ padding: 32, textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>Recherche de plaque...</div>
        </div>
      )}

      {/* Plaque EU */}
      <div className="terrain-plaque-container" style={{ padding: '0 0 8px', position: 'relative' }}>
        <div className="eu-plate">
          <div className="eu-band">
            <div className="eu-stars"></div>
            <div className="eu-country">F</div>
          </div>
          <input className="eu-input" placeholder="AA-123-BB" value={plaque} onChange={e => { setPlaque(e.target.value.toUpperCase()); setShowAutocomplete(true); }} maxLength={10} />
          <div className="eu-scan" onClick={startOcrScan}>
            <ScanLine />
            <span>SCAN</span>
          </div>
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && plaqueResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'rgba(15,20,30,0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
            {plaqueResults.map(v => (
              <div key={v.id} onClick={() => selectAutocomplete(v)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--text)' }}>{v.plaque}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text2)' }}>{v.marque} {v.modele}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent)' }}>Existant</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle info card */}
      {vMarque && (
        <div className="card" style={{ marginBottom: 16, background: 'rgba(0,191,255,0.05)', borderColor: 'rgba(0,191,255,0.2)', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,191,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <Info size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{vMarque} {vModele}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{vAnnee && `${vAnnee} • `}{vCarburant && `${vCarburant} • `}{vCouleur}</div>
          </div>
        </div>
      )}

      {/* Expandable vehicle details */}
      <button onClick={() => setShowVehicleDetails(!showVehicleDetails)} style={{ width: '100%', padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 16 }}>
        <span>Détails véhicule (optionnel)</span>
        {showVehicleDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showVehicleDetails && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group"><label className="input-label">Marque</label><select className="input" value={vMarque} onChange={e => setVMarque(e.target.value)}><option value="">—</option>{CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Modèle</label><input className="input" value={vModele} onChange={e => setVModele(e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Année</label><input className="input" type="number" value={vAnnee} onChange={e => setVAnnee(e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Carburant</label><select className="input" value={vCarburant} onChange={e => setVCarburant(e.target.value)}><option value="">—</option>{FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Boîte</label><select className="input" value={vBoite} onChange={e => setVBoite(e.target.value)}><option value="">—</option>{GEARBOX_TYPES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Couleur</label><select className="input" value={vCouleur} onChange={e => setVCouleur(e.target.value)}><option value="">—</option>{VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Kilométrage</label><input className="input" type="number" value={vKm} onChange={e => setVKm(e.target.value)} /></div>
            <div className="input-group"><label className="input-label">VIN</label><input className="input" value={vVin} onChange={e => setVVin(e.target.value)} placeholder="Optionnel" /></div>
          </div>
        </div>
      )}

      {/* Type selection - multi */}
      <div className="section" style={{ marginBottom: 16 }}>
        <div className="input-label">TYPES DE MISSION <span style={{ color: 'var(--accent)' }}>({selectedTypes.length})</span></div>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 8, scrollbarWidth: 'none', flexWrap: 'wrap' }}>
          {allTypes.map(t => (
            <button key={t} className={`chip ${selectedTypes.includes(t) ? 'active' : ''}`} onClick={() => toggleType(t)} style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
              {t}
            </button>
          ))}
          <button className="chip" onClick={() => setShowAddType(true)} style={{ padding: '8px 16px', fontSize: 13, borderStyle: 'dashed' }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Add custom type modal */}
      <SafeModal
        isOpen={showAddType}
        onClose={() => setShowAddType(false)}
        title="Nouveau type de mission"
        actions={
          <button className="btn btn-primary btn-full" onClick={handleAddType}>Créer le type</button>
        }
      >
        <div className="input-group"><label className="input-label">Nom</label><input className="input" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Ex: Diagnostic" autoFocus /></div>
        <div className="input-group">
          <label className="input-label">Couleur</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#ff5500', '#00bfff', '#10b981', '#f59e0b', '#ef4444', '#a855f7'].map(c => (
              <div key={c} onClick={() => setNewTypeColor(c)} style={{ width: 36, height: 36, borderRadius: 8, background: c, cursor: 'pointer', border: newTypeColor === c ? '3px solid white' : '3px solid transparent' }} />
            ))}
          </div>
        </div>
      </SafeModal>

      {/* Photo & Voice cards */}
      <div className="terrain-grid-cards">
        <div className="terrain-media-card" onClick={handlePhoto} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400')" }}>
          <div className="terrain-media-content">
            <div className="terrain-media-info">
              <h3>Photo</h3>
              <p>{photos.length > 0 ? `${photos.length} photo(s)` : 'Ajouter'}</p>
            </div>
            <button className="terrain-media-btn"><Plus size={20} /></button>
          </div>
        </div>
        <div className="terrain-media-card" onClick={toggleVoice} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400')" }}>
          <div className="terrain-media-content">
            <div className="terrain-media-info">
              <h3>Dicter</h3>
              <p>{recording ? 'Écoute...' : 'Notes vocales'}</p>
            </div>
            <button className="terrain-media-btn" style={recording ? { background: 'var(--red)', boxShadow: '0 0 15px var(--red)' } : {}}>
              {recording ? <MicOff size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={onFileChange} />

      <div className="section" style={{ marginTop: 16 }}>
        <div className="input-label">NOTES</div>
        <textarea className="terrain-textarea" placeholder="Notes d'intervention..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {geo && (
        <div className="location-card" style={{ marginBottom: 16 }}>
          <div className="location-info">
            <div className="location-title">Position GPS enregistrée</div>
            <div className="location-subtitle">{geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}</div>
          </div>
          <div className="location-icon"><MapPin /></div>
        </div>
      )}

      <div className="terrain-submit" style={{ marginTop: 16, paddingBottom: 40 }}>
        <button className="btn-terrain-submit" onClick={handleSubmit} disabled={!plaque.trim() || selectedTypes.length === 0 || saving} style={(!plaque.trim() || selectedTypes.length === 0 || saving) ? { opacity: 0.5, filter: 'grayscale(1)' } : {}}>
          <Check size={24} />
          {saving ? 'SAUVEGARDE...' : `CRÉER MISSION (${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
