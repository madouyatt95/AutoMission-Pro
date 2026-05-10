import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Mic, MicOff, Check, MapPin, ScanLine, X, Plus, Edit2, Search, Info } from 'lucide-react';
import { useMissionStore } from '../store';
import { MISSION_TYPES, MissionType } from '../types';

// SpeechRecognition type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Terrain() {
  const navigate = useNavigate();
  const addMission = useMissionStore(s => s.addMission);

  const [plaque, setPlaque] = useState('');
  const [type, setType] = useState<MissionType | ''>('');
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string; timestamp: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{ brand: string; model: string; loading: boolean } | null>(null);
  
  // OCR Scanner state
  const [isScanning, setIsScanning] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setNotes(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
        }
      };

      recognition.onerror = () => {
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // VIN Lookup Simulation
  useEffect(() => {
    if (plaque.length >= 7) {
      setVehicleInfo({ brand: '', model: '', loading: true });
      const timer = setTimeout(() => {
        const brands = ['RENAULT', 'PEUGEOT', 'TESLA', 'BMW', 'AUDI', 'MERCEDES', 'VOLKSWAGEN'];
        const models = ['Clio V', '3008', 'Model 3', 'Série 3', 'A4', 'Classe A', 'Golf 8'];
        const randomIdx = Math.floor(Math.random() * brands.length);
        setVehicleInfo({
          brand: brands[randomIdx],
          model: models[randomIdx],
          loading: false
        });
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setVehicleInfo(null);
    }
  }, [plaque]);

  const handlePhoto = () => {
    fileRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, {
          id: crypto.randomUUID?.() || Date.now().toString(),
          dataUrl: ev.target?.result as string,
          timestamp: new Date().toISOString(),
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Dictée vocale non supportée sur ce navigateur.");
      return;
    }
    
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startOcrScan = () => {
    setIsScanning(true);
    // Simulate scan time
    setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const nums = '0123456789';
      const randomPlaque = `${chars[Math.floor(Math.random()*26)]}${chars[Math.floor(Math.random()*26)]}-${nums[Math.floor(Math.random()*10)]}${nums[Math.floor(Math.random()*10)]}${nums[Math.floor(Math.random()*10)]}-${chars[Math.floor(Math.random()*26)]}${chars[Math.floor(Math.random()*26)]}`;
      setPlaque(randomPlaque);
      setIsScanning(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!plaque.trim() || !type) return;
    setSaving(true);
    const mission = addMission({
      plaque: plaque.trim(),
      type: type as MissionType,
      photos,
      notesTexte: notes,
      geolocation: geo || undefined,
      brouillon: true,
      statut: 'a_facturer',
    });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        navigate(`/mission/${mission.id}`);
      }, 600);
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
    <div className="page">
      {/* OCR Scanner Modal (Simulation) */}
      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsScanning(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={32} /></button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ border: '3px solid var(--accent)', width: '80%', height: 120, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 0 30px rgba(255,85,0,0.3)' }}>
               <div style={{ width: '100%', height: 2, background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)', position: 'absolute', top: 0, left: 0, animation: 'scan 1.5s infinite linear' }} />
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
            `}} />
          </div>
          <div style={{ padding: 32, textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>Recherche de plaque...</div>
        </div>
      )}

      <div className="terrain-plaque-container" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '10px 0' }}>
        <div className="eu-plate">
          <div className="eu-band">
            <div className="eu-stars"></div>
            <div className="eu-country">F</div>
          </div>
          <input
            className="eu-input"
            placeholder="AA-123-BB"
            value={plaque}
            onChange={e => setPlaque(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <div className="eu-scan" onClick={startOcrScan}>
            <ScanLine />
            <span>SCAN</span>
          </div>
        </div>
      </div>

      {vehicleInfo && (
        <div className="card" style={{ marginBottom: 16, background: 'rgba(0,191,255,0.05)', borderColor: 'rgba(0,191,255,0.2)', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,191,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <Info size={20} style={{margin: '0 auto'}} />
          </div>
          <div style={{ flex: 1 }}>
            {vehicleInfo.loading ? (
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Identification en cours...</span>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{vehicleInfo.brand} {vehicleInfo.model}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Véhicule identifié via VIN</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section" style={{ marginBottom: 16 }}>
        <div className="input-label">TYPE DE MISSION</div>
        <div className="terrain-types">
          {MISSION_TYPES.map(t => (
            <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)} style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              {t === 'Expertise' && <Search size={14} />}
              {t === 'Révision' && <Zap size={14} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="terrain-grid-cards">
        <div className="terrain-media-card" onClick={handlePhoto} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400')" }}>
          <div className="terrain-media-content">
            <div className="terrain-media-info">
              <h3>Photo</h3>
              <p>Ajouter une photo</p>
              {photos.length > 0 && <p style={{color: 'var(--accent)', fontWeight: 700}}>{photos.length} photo(s)</p>}
            </div>
            <button className="terrain-media-btn"><Plus size={20}/></button>
          </div>
        </div>
        
        <div className="terrain-media-card" onClick={toggleVoice} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400')" }}>
          <div className="terrain-media-content">
            <div className="terrain-media-info">
              <h3>Dicter notes</h3>
              <p>{recording ? 'Enregistrement...' : 'Enregistrer une note'}</p>
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
        <div style={{ position: 'relative' }}>
          <textarea 
            className="terrain-textarea" 
            placeholder="Notes d'intervention, détails, remarques..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Edit2 size={16} color="var(--text2)" style={{ position: 'absolute', right: 16, bottom: 32 }} />
        </div>
      </div>

      {geo && (
        <div className="location-card" style={{ marginBottom: 16 }}>
          <div className="location-info">
            <div className="location-title">
              Position GPS enregistrée
            </div>
            <div className="location-subtitle">
              {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
            </div>
          </div>
          <div className="location-icon"><MapPin /></div>
        </div>
      )}

      <div className="terrain-submit" style={{ marginTop: 16, paddingBottom: 40 }}>
        <button
          className="btn-terrain-submit"
          onClick={handleSubmit}
          disabled={!plaque.trim() || !type || saving}
          style={(!plaque.trim() || !type || saving) ? { opacity: 0.5, filter: 'grayscale(1)' } : {}}
        >
          <Check size={24} />
          {saving ? 'SAUVEGARDE...' : 'CRÉER MISSION'}
        </button>
      </div>
    </div>
  );
}
