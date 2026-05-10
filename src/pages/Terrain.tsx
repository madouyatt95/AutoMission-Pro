import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Mic, MicOff, Check, MapPin, ScanLine, X } from 'lucide-react';
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
      <div className="terrain-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={40} color="var(--green)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Mission créée !</h2>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>Brouillon sauvegardé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terrain-page">
      {/* OCR Scanner Modal (Simulation) */}
      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsScanning(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={32} /></button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ border: '2px solid rgba(255,255,255,0.5)', width: '80%', height: 120, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
               <div style={{ width: '100%', height: 2, background: '#10b981', boxShadow: '0 0 10px #10b981', position: 'absolute', top: 0, left: 0, animation: 'scan 1.5s infinite linear' }} />
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
            `}} />
          </div>
          <div style={{ padding: 32, textAlign: 'center', color: 'white', fontWeight: 600 }}>Recherche de plaque...</div>
        </div>
      )}

      <div className="terrain-header">
        <h1><Zap className="icon" size={24} /> MODE TERRAIN</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Création rapide de mission</p>
      </div>

      <div style={{ position: 'relative', margin: '0 auto 16px', maxWidth: 320, width: '100%' }}>
        <input
          className="input input-plaque"
          placeholder="AA-123-BB"
          value={plaque}
          onChange={e => setPlaque(e.target.value.toUpperCase())}
          maxLength={10}
        />
        <button 
          onClick={startOcrScan}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}
          title="Scanner une plaque"
        >
          <ScanLine size={20} />
        </button>
      </div>

      <div>
        <div className="input-label">Type de mission</div>
        <div className="terrain-types">
          {MISSION_TYPES.map(t => (
            <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="terrain-actions" style={{ marginTop: 8 }}>
        <button className="terrain-action-btn" onClick={handlePhoto}>
          <Camera />
          <span>Photo{photos.length > 0 ? ` (${photos.length})` : ''}</span>
        </button>
        <button className="terrain-action-btn" onClick={toggleVoice} style={recording ? { borderColor: 'var(--red)', background: 'var(--red-bg)' } : {}}>
          {recording ? <MicOff color="var(--red)" /> : <Mic />}
          <span>{recording ? 'Arrêter la dictée' : `Dicter notes`}</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={onFileChange} />

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-thumb">
              <img src={p.dataUrl} alt="capture" />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <div className="input-label">Notes {recording && <span style={{color: 'var(--red)', fontSize: 10}}> (Écoute en cours...)</span>}</div>
        <textarea 
          className="input textarea" 
          placeholder="Notes d'intervention, détails, remarques..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {geo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
          <MapPin size={14} color="var(--green)" /> Position GPS enregistrée
        </div>
      )}

      <div className="terrain-submit" style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSubmit}
          disabled={!plaque.trim() || !type || saving}
        >
          {saving ? 'Sauvegarde...' : '✓ CRÉER MISSION'}
        </button>
      </div>
    </div>
  );
}
