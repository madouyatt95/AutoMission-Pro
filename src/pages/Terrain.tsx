import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Mic, MicOff, Check, MapPin } from 'lucide-react';
import { useMissionStore, useClientStore } from '../store';
import { MISSION_TYPES, MissionType } from '../types';

export default function Terrain() {
  const navigate = useNavigate();
  const addMission = useMissionStore(s => s.addMission);
  const clients = useClientStore(s => s.clients);

  const [plaque, setPlaque] = useState('');
  const [type, setType] = useState<MissionType | ''>('');
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string; timestamp: string }[]>([]);
  const [recording, setRecording] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<{ id: string; dataUrl: string; duration: number; timestamp: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  // Auto geolocation on mount
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  });

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

  const toggleVoice = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (ev) => {
          setVoiceNotes(prev => [...prev, {
            id: crypto.randomUUID?.() || Date.now().toString(),
            dataUrl: ev.target?.result as string,
            duration: Math.round((Date.now() - recordStartRef.current) / 1000),
            timestamp: new Date().toISOString(),
          }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch {
      alert('Microphone non disponible');
    }
  };

  const handleSubmit = () => {
    if (!plaque.trim() || !type) return;
    setSaving(true);
    const mission = addMission({
      plaque: plaque.trim(),
      type: type as MissionType,
      photos,
      notesVocales: voiceNotes,
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
      <div className="terrain-header">
        <h1><Zap className="icon" size={24} /> MODE TERRAIN</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Création rapide de mission</p>
      </div>

      <div className="terrain-plaque-input">
        <input
          className="input input-plaque"
          placeholder="AA-123-BB"
          value={plaque}
          onChange={e => setPlaque(e.target.value.toUpperCase())}
          autoFocus
          maxLength={10}
        />
      </div>

      <div>
        <div className="input-label">Type de mission</div>
        <div className="terrain-types">
          {MISSION_TYPES.map(t => (
            <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="terrain-actions">
        <button className="terrain-action-btn" onClick={handlePhoto}>
          <Camera />
          <span>Photo{photos.length > 0 ? ` (${photos.length})` : ''}</span>
        </button>
        <button className="terrain-action-btn" onClick={toggleVoice} style={recording ? { borderColor: 'var(--red)', background: 'var(--red-bg)' } : {}}>
          {recording ? <MicOff color="var(--red)" /> : <Mic />}
          <span>{recording ? 'Arrêter' : `Vocal${voiceNotes.length > 0 ? ` (${voiceNotes.length})` : ''}`}</span>
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

      {geo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
          <MapPin size={14} color="var(--green)" /> Position enregistrée
        </div>
      )}

      <div className="terrain-submit">
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
