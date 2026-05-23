import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Mic, MicOff, Check, MapPin, ScanLine, X, Plus, Edit2, Search, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useMissionStore, useVehicleStore, useClientStore, useCustomTypeStore } from '../store';
import { MISSION_TYPES, CAR_BRANDS, FUEL_TYPES, GEARBOX_TYPES, VEHICLE_COLORS, VEHICLE_TYPES } from '../types';
import SafeModal from '../components/SafeModal';
import PlateScannerModal from '../components/PlateScannerModal';

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

export default function Terrain() {
  const navigate = useNavigate();
  const addMission = useMissionStore(s => s.addMission);
  const { vehicles, addVehicle, getByPlaque } = useVehicleStore();
  const { clients, addClient } = useClientStore();
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
  const [vType, setVType] = useState('');
  const [vDimPneus, setVDimPneus] = useState('');

  // Nouveaux champs logistiques et statuts physiques
  const [keysPossessed, setKeysPossessed] = useState<number>(1);
  const [docsInPossession, setDocsInPossession] = useState<string[]>(['carte_grise', 'assurance']);
  const [statutPhysique, setStatutPhysique] = useState<any>('en_possession');
  const [statutPrestataire, setStatutPrestataire] = useState('');
  const [statutCommentaire, setStatutCommentaire] = useState('');
  const [carteEssence, setCarteEssence] = useState<'presente' | 'absente'>('absente');
  const [carteGriseFormat, setCarteGriseFormat] = useState<'original' | 'photocopie' | undefined>('original');
  const [autresDocumentsSpecifique, setAutresDocumentsSpecifique] = useState('');
  const [pointDepart, setPointDepart] = useState('');
  const [pointArrivee, setPointArrivee] = useState('');

  // Client selection
  const [selectedClients, setSelectedClients] = useState<{ clientId: string; clientName: string; montantTTC: number; statut: string }[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newClientAmount, setNewClientAmount] = useState('');

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
        typeVehicule: vType as any || undefined,
        dimensionsPneus: vDimPneus || undefined,
        keysPossessed,
        docsInPossession,
        statutPhysique,
        _prestataire: statutPrestataire || undefined,
        _commentaire: statutCommentaire || undefined,
        carteEssence,
        carteGriseFormat,
        autresDocumentsSpecifique: autresDocumentsSpecifique || undefined,
      } as any);
    } else {
      useVehicleStore.getState().updateVehicle(existingVehicle.id, {
        keysPossessed,
        docsInPossession,
        statutPhysique,
        _prestataire: statutPrestataire || undefined,
        _commentaire: statutCommentaire || undefined,
        carteEssence,
        carteGriseFormat,
        autresDocumentsSpecifique: autresDocumentsSpecifique || undefined,
      } as any);
    }

    const mission = addMission({
      plaque: plaque.trim(),
      types: selectedTypes,
      type: selectedTypes[0],
      prestations: selectedTypes.map(t => ({
        id: crypto.randomUUID?.() || Date.now().toString() + Math.random(),
        type: t,
        prixTTC: 0,
        statut: 'a_facturer'
      })),
      photos,
      notesTexte: notes,
      geolocation: geo || undefined,
      brouillon: true,
      statut: 'a_facturer',
      couleur: vCouleur || undefined,
      kilometrage: vKm ? parseInt(vKm) : undefined,
      clients: selectedClients.map(c => ({ ...c, facturationDifferee: false, statut: c.statut as 'a_facturer' | 'facture' | 'paye' })),
      avancesFrais: [],
      keysPossessed,
      docsInPossession,
      statutPhysique,
      _prestataire: statutPrestataire || undefined,
      _commentaire: statutCommentaire || undefined,
      carteEssence,
      carteGriseFormat,
      autresDocumentsSpecifique: autresDocumentsSpecifique || undefined,
      pointDepart: pointDepart || undefined,
      pointArrivee: pointArrivee || undefined,
    } as any);

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
      <PlateScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={(scannedPlate) => {
          setPlaque(scannedPlate);
          setShowAutocomplete(true);
        }}
      />

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
            <div className="input-group"><label className="input-label">Type véhicule</label><select className="input" value={vType} onChange={e => setVType(e.target.value)}><option value="">—</option>{VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="input-group"><label className="input-label">Dim. pneus</label><input className="input" value={vDimPneus} onChange={e => setVDimPneus(e.target.value)} placeholder="205/55R16" /></div>
          </div>
        </div>
      )}

      {/* Section Logistique Prise en charge (Clés, Documents, Statut initial) */}
      <div className="card animate-fade-in" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔑 Logistique & Prise en Charge
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Clés */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Nombre de clés en possession :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[0, 1, 2].map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKeysPossessed(k)}
                  className={`chip ${keysPossessed === k ? 'active' : ''}`}
                  style={{
                    padding: '8px 4px',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'center',
                    justifyContent: 'center',
                    border: keysPossessed === k ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  {k === 0 ? '❌ 0 clé' : k === 1 ? '🔑 x1' : '🔑🔑 x2'}
                </button>
              ))}
            </div>
          </div>

          {/* Carte Essence */}
          <div className="input-group">
            <label className="input-label">Carte essence :</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { key: 'presente', label: '💳 Présente' },
                { key: 'absente', label: '❌ Absente' }
              ].map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCarteEssence(c.key as any)}
                  className={`chip ${carteEssence === c.key ? 'active' : ''}`}
                  style={{
                    padding: '8px 4px',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'center',
                    justifyContent: 'center',
                    border: carteEssence === c.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="input-group">
            <label className="input-label">Carte grise reçue :</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
              {[
                { key: 'original', label: '📄 Original' },
                { key: 'photocopie', label: '🖨️ Photocopie' },
                { key: 'absente', label: '❌ Absente' }
              ].map(opt => {
                const active = carteGriseFormat === opt.key || (!carteGriseFormat && opt.key === 'absente');
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setCarteGriseFormat(opt.key === 'absente' ? undefined : opt.key as any);
                      setDocsInPossession(prev => 
                        opt.key === 'absente' 
                          ? prev.filter(x => x !== 'carte_grise')
                          : [...prev.filter(x => x !== 'carte_grise'), 'carte_grise']
                      );
                    }}
                    className={`chip ${active ? 'active' : ''}`}
                    style={{
                      padding: '8px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      justifyContent: 'center',
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label className="input-label" style={{ marginTop: 8 }}>Assurance reçue :</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {[
                { key: 'assurance_presente', label: '🟢 Oui (Carte verte)' },
                { key: 'assurance_absente', label: '❌ Non' }
              ].map(opt => {
                const active = docsInPossession.includes('assurance') ? opt.key === 'assurance_presente' : opt.key === 'assurance_absente';
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setDocsInPossession(prev => 
                        opt.key === 'assurance_presente'
                          ? [...prev.filter(x => x !== 'assurance'), 'assurance']
                          : prev.filter(x => x !== 'assurance')
                      );
                    }}
                    className={`chip ${active ? 'active' : ''}`}
                    style={{
                      padding: '8px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      justifyContent: 'center',
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label className="input-label" style={{ marginTop: 8 }}>Section « Autres documents » :</label>
            <input 
              className="input" 
              placeholder="Préciser le type d'autres documents reçus..." 
              value={autresDocumentsSpecifique} 
              onChange={e => {
                setAutresDocumentsSpecifique(e.target.value);
                setDocsInPossession(prev => 
                  e.target.value 
                    ? [...prev.filter(x => x !== 'autre'), 'autre']
                    : prev.filter(x => x !== 'autre')
                );
              }} 
            />
          </div>

          {/* Statut Physique initial du véhicule */}
          <div className="input-group">
            <label className="input-label">Localisation / Statut initial du véhicule :</label>
            <select className="input" value={statutPhysique} onChange={e => setStatutPhysique(e.target.value)}>
              <option value="en_possession">En ma possession</option>
              <option value="carrosserie">Carrosserie</option>
              <option value="debosselage">Débosselage</option>
              <option value="speedy">Speedy</option>
              <option value="carglass">Carglass</option>
              <option value="garage">Garage</option>
              <option value="controle_technique">Contrôle technique</option>
              <option value="restitue">Restitué</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION ITINÉRAIRE (Missions / Transferts) */}
      <div className="card animate-fade-in" style={{ padding: 18, marginBottom: 16, borderLeft: '4px solid var(--blue)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📍</span> Itinéraire / Transfert
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Point de départ</label>
            <input 
              className="input" 
              placeholder="Ex: Paris..." 
              value={pointDepart} 
              onChange={e => setPointDepart(e.target.value)} 
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Point d'arrivée</label>
            <input 
              className="input" 
              placeholder="Ex: Lyon..." 
              value={pointArrivee} 
              onChange={e => setPointArrivee(e.target.value)} 
            />
          </div>
        </div>
      </div>

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

      {/* CLIENT SECTION */}
      <div className="section" style={{ marginTop: 16 }}>
        <div className="input-label">CLIENTS A FACTURER <span style={{ color: 'var(--accent)' }}>({selectedClients.length})</span></div>
        {selectedClients.map((c, i) => (
          <div key={c.clientId} className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.clientName}</div>
              <input className="input" type="number" step="0.01" placeholder="Montant TTC" style={{ marginTop: 6 }} value={c.montantTTC || ''} onChange={e => { const u = [...selectedClients]; u[i] = { ...u[i], montantTTC: parseFloat(e.target.value) || 0 }; setSelectedClients(u); }} />
            </div>
            <button onClick={() => setSelectedClients(selectedClients.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--red)' }}><X size={18} /></button>
          </div>
        ))}
        
        <div className="card" style={{ padding: 12, marginTop: 8 }}>
          <div className="input-group">
            <label className="input-label">Sélectionner un client</label>
            <select className="input" value={newClientId} onChange={e => setNewClientId(e.target.value)}>
              <option value="">— Aucun —</option>
              {clients.filter(c => !selectedClients.some(sc => sc.clientId === c.id)).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Montant estimé TTC (optionnel)</label>
            <input className="input" type="number" step="0.01" value={newClientAmount} onChange={e => setNewClientAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: 13 }} onClick={() => setShowAddClient(true)}>+ Nouveau client</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }} disabled={!newClientId} onClick={() => {
              const c = clients.find(cl => cl.id === newClientId);
              if (c) {
                setSelectedClients([...selectedClients, { clientId: c.id, clientName: c.nom, montantTTC: parseFloat(newClientAmount) || 0, statut: 'a_facturer' }]);
                setNewClientId('');
                setNewClientAmount('');
              }
            }}>Ajouter à la mission</button>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      <SafeModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} title="Nouveau client" actions={<button className="btn btn-primary btn-full" onClick={() => { if (newClientName.trim()) { const c = addClient({ nom: newClientName.trim() }); setSelectedClients([...selectedClients, { clientId: c.id, clientName: c.nom, montantTTC: 0, statut: 'a_facturer' }]); setNewClientName(''); setShowAddClient(false); } }}>Créer</button>}>
        <div className="input-group"><label className="input-label">Nom *</label><input className="input" value={newClientName} onChange={e => setNewClientName(e.target.value)} autoFocus /></div>
      </SafeModal>

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
