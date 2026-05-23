import React, { useState, useRef, useEffect } from 'react';
import { Degat, DamageType, VehicleView } from '../types';
import { Plus, Camera, X, Edit2, Trash2 } from 'lucide-react';
import SafeModal from './SafeModal';
import InteractiveCarSVG from './InteractiveCarSVG';

interface Props {
  degats: Degat[];
  onAddDegat: (degat: Omit<Degat, 'id'>) => void;
  onRemoveDegat: (id: string) => void;
}

// Map the views for our UI tabs
const UI_TABS = [
  { id: '360', label: '360°' },
  { id: 'avant', label: 'Avant' },
  { id: 'arriere', label: 'Arrière' },
  { id: 'gauche', label: 'Gauche' },
  { id: 'droite', label: 'Droite' },
  { id: 'dessus', label: 'Dessus' }
];

const VIEWS: VehicleView[] = ['avant', 'droite', 'arriere', 'gauche'];

const LEGEND = [
  { type: 'impact' as DamageType, color: 'var(--red)', label: 'Impact' },
  { type: 'rayure' as DamageType, color: 'var(--orange)', label: 'Rayure' },
  { type: 'enfonce' as DamageType, color: '#eab308', label: 'Enfoncé' },
  { type: 'autre' as DamageType, color: 'var(--blue)', label: 'Autre' },
];

const DAMAGE_COLORS: Record<DamageType, string> = {
  impact: 'var(--red)',
  rayure: 'var(--orange)',
  enfonce: '#eab308',
  autre: 'var(--blue)',
  casse: 'var(--red)',
  fissure: 'var(--orange)',
  interieur: 'var(--text2)',
  usure_pneus: 'var(--text3)'
};

export default function Vehicle360DamagePicker({ degats, onAddDegat, onRemoveDegat }: Props) {
  const [activeTab, setActiveTab] = useState('360');
  const [viewIdx, setViewIdx] = useState(0); // 0 to 3 for 'avant', 'droite', 'arriere', 'gauche'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number, y: number } | null>(null);
  
  const [damageType, setDamageType] = useState<DamageType>('rayure');
  const [comment, setComment] = useState('');
  const [piece, setPiece] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const touchStart = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentView: VehicleView = activeTab === 'dessus' ? 'dessus' : VIEWS[viewIdx];

  // Auto-switch engine view when clicking tabs
  useEffect(() => {
    if (activeTab === 'avant') setViewIdx(0);
    else if (activeTab === 'droite') setViewIdx(1);
    else if (activeTab === 'arriere') setViewIdx(2);
    else if (activeTab === 'gauche') setViewIdx(3);
  }, [activeTab]);

  const handleSwipeStart = (x: number) => { touchStart.current = x; };
  const handleSwipeEnd = (x: number) => {
    if (activeTab === 'dessus') return; // no swipe on top view
    const diff = touchStart.current - x;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setViewIdx(i => (i + 1) % 4);
      else setViewIdx(i => (i - 1 + 4) % 4);
      setActiveTab('360'); // switch back to 360 mode
    }
  };

  const handlePartClick = (partName: string, x: number, y: number) => {
    setTempCoords({ x, y });
    setPiece(partName);
    setIsModalOpen(true);
  };

  const handleManualAdd = () => {
    setTempCoords(null);
    setPiece('');
    setIsModalOpen(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setPhotos(p => [...p, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const submitDamage = () => {
    if (!piece) return alert('Veuillez préciser la pièce (ex: Capot)');
    onAddDegat({
      piece,
      vue: currentView,
      type: damageType,
      commentaire: comment || undefined,
      photos: photos.map((dataUrl, idx) => ({ id: Date.now().toString() + idx, dataUrl, timestamp: new Date().toISOString() })),
      x: tempCoords?.x,
      y: tempCoords?.y,
    });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTempCoords(null);
    setPiece('');
    setComment('');
    setDamageType('rayure');
    setPhotos([]);
  };

  return (
    <div className="vehicle-360-picker">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 4px 16px', scrollbarWidth: 'none' }}>
        {UI_TABS.map(tab => (
          <button 
            key={tab.id} 
            className={`chip ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '8px 16px', 
              fontSize: 13, 
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeTab === tab.id ? 'rgba(255,85,0,0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)'
            }}
          >
            {tab.id === '360' && <span style={{ marginRight: 6, display: 'inline-flex' }}>🔄</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Engine Area */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '16/10', 
          background: 'var(--surface2)', 
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 16,
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
        }}
        onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
        onTouchEnd={e => handleSwipeEnd(e.changedTouches[0].clientX)}
        onMouseDown={e => handleSwipeStart(e.clientX)}
        onMouseUp={e => handleSwipeEnd(e.clientX)}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <InteractiveCarSVG view={currentView} onPartClick={handlePartClick} />
        </div>
        
        {/* Click layer markers */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Render markers for this view */}
          {degats.map(d => {
            if (d.vue !== currentView) return null;
            if (!d.x || !d.y) return null; // Only render coordinate-based ones here
            
            return (
              <div 
                key={d.id} 
                style={{ 
                  position: 'absolute', 
                  left: `${d.x}%`, 
                  top: `${d.y}%`, 
                  transform: 'translate(-50%, -50%)',
                  width: 14, 
                  height: 14, 
                  borderRadius: '50%', 
                  background: DAMAGE_COLORS[d.type] || 'var(--blue)',
                  border: '3px solid white',
                  boxShadow: '0 0 10px rgba(0,0,0,0.8)',
                  pointerEvents: 'none' // Let clicks pass through
                }} 
              />
            );
          })}
        </div>
        
        {activeTab !== 'dessus' && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span>⟲</span> Faites glisser pour tourner le véhicule <span>⟳</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap', background: 'var(--surface)', padding: 12, borderRadius: 12 }}>
        {LEGEND.map(l => (
          <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} /> {l.label}
          </div>
        ))}
      </div>

      {/* Damages List */}
      <div style={{ marginBottom: 100 }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase' }}>Dégâts enregistrés ({degats.length})</h4>
        
        {degats.map((d) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: DAMAGE_COLORS[d.type], border: '2px solid var(--bg)' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: DAMAGE_COLORS[d.type] }}>
                  {d.type.charAt(0).toUpperCase() + d.type.slice(1)}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{d.piece}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text3)' }}>
                {d.photos.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={12} /> {d.photos.length} photo{d.photos.length > 1 ? 's' : ''}</span>}
                {d.commentaire && <span>{d.commentaire}</span>}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Aujourd'hui</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><Edit2 size={16} /></button>
              <button style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }} onClick={() => onRemoveDegat(d.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {degats.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 14 }}>Aucun dégât enregistré</div>
        )}
      </div>

      {/* Fixed Add Button */}
      <div style={{ position: 'fixed', bottom: 70, left: 16, right: 16, zIndex: 10 }}>
        <button className="btn btn-full" style={{ background: 'var(--accent)', color: 'white', padding: 18, fontSize: 16, borderRadius: 12, boxShadow: '0 4px 20px rgba(255,85,0,0.4)' }} onClick={handleManualAdd}>
          <Plus size={20} /> Ajouter un dégât
        </button>
      </div>

      {/* SafeModal for Adding Damage */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handlePhoto} />

      <SafeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Ajouter un dégât"
        actions={
          <button className="btn btn-primary btn-full" onClick={submitDamage} disabled={!piece.trim()}>
            <Plus size={16} /> Valider le dégât
          </button>
        }
      >
        <div className="input-group">
          <label className="input-label">Type de dégât</label>
          <div className="damage-type-chips" style={{ marginBottom: 16 }}>
            {LEGEND.map(l => (
              <button 
                key={l.type} 
                className={`chip ${damageType === l.type ? 'active' : ''}`} 
                onClick={() => setDamageType(l.type)} 
                style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, borderColor: damageType === l.type ? l.color : 'var(--border)' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Pièce concernée *</label>
          <input className="input" placeholder="Ex: Porte avant droite..." value={piece} onChange={e => setPiece(e.target.value)} />
        </div>
        
        <div className="input-group">
          <label className="input-label">Commentaire</label>
          <input className="input" placeholder="Précisions..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label className="input-label" style={{ margin: 0 }}>Photos ({photos.length})</label>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => fileRef.current?.click()}><Camera size={14} /> Ajouter</button>
        </div>
        
        {photos.length > 0 && (
          <div className="photo-grid" style={{ marginBottom: 16 }}>
            {photos.map((p, i) => (
              <div key={i} className="photo-thumb" style={{ position: 'relative' }}>
                <img src={p} alt="" />
                <button 
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SafeModal>
    </div>
  );
}
