import { useState, useRef } from 'react';
import { VehicleView, Degat, DAMAGE_TYPES, DamageType } from '../types';
import { Plus, Camera, X } from 'lucide-react';

type ExtendedView = 'avant' | 'avant_droit' | 'droite' | 'arriere_droit' | 'arriere' | 'arriere_gauche' | 'gauche' | 'avant_gauche' | 'dessus';

interface Props {
  degats: Degat[];
  onAddDegat: (degat: Omit<Degat, 'id'>) => void;
  onRemoveDegat: (id: string) => void;
}

const VIEW_ORDER: { key: ExtendedView; label: string; mapTo: VehicleView }[] = [
  { key: 'avant', label: 'Avant', mapTo: 'avant' },
  { key: 'avant_droit', label: 'Av. Droit', mapTo: 'avant' },
  { key: 'droite', label: 'Droite', mapTo: 'droite' },
  { key: 'arriere_droit', label: 'Ar. Droit', mapTo: 'arriere' },
  { key: 'arriere', label: 'Arrière', mapTo: 'arriere' },
  { key: 'arriere_gauche', label: 'Ar. Gauche', mapTo: 'arriere' },
  { key: 'gauche', label: 'Gauche', mapTo: 'gauche' },
  { key: 'avant_gauche', label: 'Av. Gauche', mapTo: 'avant' },
  { key: 'dessus', label: 'Dessus', mapTo: 'dessus' },
];

const ZONES: Record<string, string[]> = {
  avant: ['Capot', 'Pare-choc avant', 'Phares', 'Calandre', 'Pare-brise'],
  avant_droit: ['Aile avant droite', 'Phare droit', 'Pare-choc avant droit', 'Rétroviseur droit'],
  droite: ['Porte avant droite', 'Porte arrière droite', 'Aile avant droite', 'Aile arrière droite', 'Bas de caisse droit', 'Rétroviseur droit'],
  arriere_droit: ['Aile arrière droite', 'Feu arrière droit', 'Pare-choc arrière droit'],
  arriere: ['Coffre', 'Pare-choc arrière', 'Feux arrière', 'Lunette arrière'],
  arriere_gauche: ['Aile arrière gauche', 'Feu arrière gauche', 'Pare-choc arrière gauche'],
  gauche: ['Porte avant gauche', 'Porte arrière gauche', 'Aile avant gauche', 'Aile arrière gauche', 'Bas de caisse gauche', 'Rétroviseur gauche'],
  avant_gauche: ['Aile avant gauche', 'Phare gauche', 'Pare-choc avant gauche', 'Rétroviseur gauche'],
  dessus: ['Toit', 'Capot', 'Coffre', 'Pare-brise', 'Vitres latérales'],
};

function getZoneColor(count: number) {
  if (count === 0) return 'rgba(0,230,118,0.12)';
  if (count === 1) return 'rgba(255,153,0,0.25)';
  if (count === 2) return 'rgba(255,51,102,0.3)';
  return 'rgba(255,51,102,0.5)';
}

function CarSVG({ view, zoneCounts, onZone }: { view: ExtendedView; zoneCounts: Record<string, number>; onZone: (z: string) => void }) {
  const zones = ZONES[view] || [];
  const isSide = ['gauche', 'droite', 'avant_gauche', 'avant_droit', 'arriere_gauche', 'arriere_droit'].includes(view);
  const isTop = view === 'dessus';
  const flip = view.includes('droit');

  if (isTop) {
    return (
      <svg viewBox="0 0 200 320" style={{ width: '100%', maxHeight: 260 }}>
        <path d="M40,50 Q40,20 60,15 L140,15 Q160,20 160,50 L160,270 Q160,300 140,305 L60,305 Q40,300 40,270Z" fill="rgba(255,255,255,0.04)" stroke="var(--border-light)" strokeWidth="2" />
        {zones.map((z, i) => {
          const y = 20 + i * 56;
          return (
            <g key={z} onClick={() => onZone(z)} style={{ cursor: 'pointer' }}>
              <rect x="50" y={y} width="100" height="50" rx="6" fill={getZoneColor(zoneCounts[z] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" className="car-zone" />
              <text x="100" y={y + 30} textAnchor="middle" fill="var(--text2)" fontSize="9" fontWeight="700" pointerEvents="none">{z.toUpperCase()}</text>
              {(zoneCounts[z] || 0) > 0 && <circle cx="145" cy={y + 10} r="8" fill="var(--red)" />) }
              {(zoneCounts[z] || 0) > 0 && <text x="145" y={y + 14} textAnchor="middle" fill="white" fontSize="9" fontWeight="800" pointerEvents="none">{zoneCounts[z]}</text>}
            </g>
          );
        })}
      </svg>
    );
  }

  if (isSide) {
    return (
      <svg viewBox="0 0 340 180" style={{ width: '100%', maxHeight: 180, transform: flip ? 'scaleX(-1)' : undefined }}>
        <path d="M30,120 L30,140 Q30,155 45,155 L295,155 Q310,155 310,140 L310,120 Q310,100 290,90 L240,70 Q220,55 180,50 L130,50 Q90,55 70,70 L50,90 Q30,100 30,120Z" fill="rgba(255,255,255,0.04)" stroke="var(--border-light)" strokeWidth="2" />
        <path d="M130,52 L85,72 L85,88 L170,88 L170,52Z" fill="rgba(0,191,255,0.08)" stroke="var(--border-light)" strokeWidth="1" />
        <path d="M175,52 L175,88 L245,88 L245,72 Q235,58 210,52Z" fill="rgba(0,191,255,0.08)" stroke="var(--border-light)" strokeWidth="1" />
        <circle cx="90" cy="155" r="22" fill="var(--bg)" stroke="var(--text3)" strokeWidth="3" />
        <circle cx="90" cy="155" r="10" fill="var(--surface3)" />
        <circle cx="250" cy="155" r="22" fill="var(--bg)" stroke="var(--text3)" strokeWidth="3" />
        <circle cx="250" cy="155" r="10" fill="var(--surface3)" />
        {zones.map((z, i) => {
          const rects = [
            { x: 85, y: 88, w: 85, h: 50 },
            { x: 170, y: 88, w: 75, h: 50 },
            { x: 35, y: 92, w: 50, h: 42 },
            { x: 245, y: 92, w: 60, h: 42 },
            { x: 115, y: 140, w: 130, h: 13 },
            { x: 55, y: 65, w: 30, h: 22 },
          ];
          const r = rects[i] || { x: 50 + i * 45, y: 90, w: 40, h: 40 };
          return (
            <g key={z} onClick={() => onZone(z)} style={{ cursor: 'pointer' }}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="3" fill={getZoneColor(zoneCounts[z] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" className="car-zone" />
              {(zoneCounts[z] || 0) > 0 && <circle cx={r.x + r.w - 5} cy={r.y + 8} r="7" fill="var(--red)" />}
              {(zoneCounts[z] || 0) > 0 && <text x={r.x + r.w - 5} y={r.y + 12} textAnchor="middle" fill="white" fontSize="8" fontWeight="800" pointerEvents="none">{zoneCounts[z]}</text>}
            </g>
          );
        })}
      </svg>
    );
  }

  // Front/Rear
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', maxHeight: 220 }}>
      <path d="M60,140 L60,180 Q60,200 80,200 L220,200 Q240,200 240,180 L240,140 Q240,100 200,80 L100,80 Q60,100 60,140Z" fill="rgba(255,255,255,0.04)" stroke="var(--border-light)" strokeWidth="2" />
      <path d="M90,80 L80,50 Q80,30 100,25 L200,25 Q220,30 220,50 L210,80Z" fill="rgba(0,191,255,0.08)" stroke="var(--border-light)" strokeWidth="1.5" />
      {zones.map((z, i) => {
        const rects = [
          { x: 80, y: 85, w: 140, h: 45 },
          { x: 65, y: 145, w: 170, h: 28 },
          { x: 70, y: 128, w: 30, h: 24 },
          { x: 110, y: 132, w: 80, h: 14 },
          { x: 90, y: 30, w: 120, h: 48 },
        ];
        const r = rects[i] || { x: 80, y: 85 + i * 30, w: 140, h: 25 };
        return (
          <g key={z} onClick={() => onZone(z)} style={{ cursor: 'pointer' }}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="5" fill={getZoneColor(zoneCounts[z] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" className="car-zone" />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 4} textAnchor="middle" fill="var(--text2)" fontSize="9" fontWeight="700" pointerEvents="none">{z.length > 15 ? z.substring(0, 12) + '…' : z}</text>
            {(zoneCounts[z] || 0) > 0 && <circle cx={r.x + r.w - 8} cy={r.y + 8} r="8" fill="var(--red)" />}
            {(zoneCounts[z] || 0) > 0 && <text x={r.x + r.w - 8} y={r.y + 12} textAnchor="middle" fill="white" fontSize="9" fontWeight="800" pointerEvents="none">{zoneCounts[z]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function InteractiveCar({ degats, onAddDegat, onRemoveDegat }: Props) {
  const [viewIdx, setViewIdx] = useState(0);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [damageType, setDamageType] = useState<DamageType>('rayure');
  const [comment, setComment] = useState('');
  const touchStart = useRef(0);

  const currentView = VIEW_ORDER[viewIdx];

  // Count damages per zone
  const zoneCounts: Record<string, number> = {};
  degats.forEach(d => {
    zoneCounts[d.piece] = (zoneCounts[d.piece] || 0) + 1;
  });

  // Count per view
  const viewDamageCounts: Record<string, number> = {};
  VIEW_ORDER.forEach(v => {
    const zones = ZONES[v.key] || [];
    viewDamageCounts[v.key] = zones.reduce((s, z) => s + (zoneCounts[z] || 0), 0);
  });

  const handleSwipeStart = (x: number) => { touchStart.current = x; };
  const handleSwipeEnd = (x: number) => {
    const diff = touchStart.current - x;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setViewIdx(i => (i + 1) % VIEW_ORDER.length);
      else setViewIdx(i => (i - 1 + VIEW_ORDER.length) % VIEW_ORDER.length);
    }
  };

  const handleAddDamage = () => {
    if (!selectedZone) return;
    onAddDegat({
      piece: selectedZone,
      vue: currentView.mapTo,
      type: damageType,
      commentaire: comment || undefined,
      photos: [],
    });
    setSelectedZone(null);
    setComment('');
    setDamageType('rayure');
  };

  const zoneDegats = selectedZone ? degats.filter(d => d.piece === selectedZone) : [];

  return (
    <div className="interactive-car">
      {/* View Selector */}
      <div className="car-view-selector">
        {VIEW_ORDER.map((v, i) => (
          <button key={v.key} className={`car-view-btn ${viewIdx === i ? 'active' : ''}`} onClick={() => setViewIdx(i)}>
            <span>{v.label}</span>
            {(viewDamageCounts[v.key] || 0) > 0 && (
              <span className="car-view-count">{viewDamageCounts[v.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Car SVG with swipe */}
      <div
        className="car-svg-container"
        onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
        onTouchEnd={e => handleSwipeEnd(e.changedTouches[0].clientX)}
        onMouseDown={e => handleSwipeStart(e.clientX)}
        onMouseUp={e => handleSwipeEnd(e.clientX)}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 8, textAlign: 'center' }}>
          {currentView.label.toUpperCase()} — {viewIdx + 1}/{VIEW_ORDER.length}
        </div>
        <CarSVG view={currentView.key} zoneCounts={zoneCounts} onZone={z => setSelectedZone(z)} />
        <div className="car-hint">↔ Swipez pour tourner • Touchez une zone</div>
      </div>

      {/* Total damages */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '12px 0', fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>Total dégâts : <strong style={{ color: degats.length > 0 ? 'var(--red)' : 'var(--green)' }}>{degats.length}</strong></span>
      </div>

      {/* Zone detail modal */}
      {selectedZone && (
        <div className="modal-overlay" onClick={() => setSelectedZone(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">{selectedZone}</h3>

            {/* Existing damages on this zone */}
            {zoneDegats.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>DÉGÂTS EXISTANTS ({zoneDegats.length})</div>
                {zoneDegats.map(d => (
                  <div key={d.id} className="damage-item">
                    <div className="damage-item-info">
                      <div className="damage-item-piece">{DAMAGE_TYPES[d.type]}</div>
                      {d.commentaire && <div className="damage-item-type">{d.commentaire}</div>}
                    </div>
                    <button onClick={() => onRemoveDegat(d.id)} style={{ background: 'rgba(255,51,102,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new damage */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>AJOUTER UN DÉGÂT</div>
            <div className="damage-type-chips" style={{ marginBottom: 12 }}>
              {(Object.entries(DAMAGE_TYPES) as [DamageType, string][]).map(([k, v]) => (
                <button key={k} className={`chip ${damageType === k ? 'active' : ''}`} onClick={() => setDamageType(k)} style={{ fontSize: 12, padding: '6px 12px' }}>
                  {v}
                </button>
              ))}
            </div>
            <input className="input" placeholder="Commentaire (optionnel)" value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: 12 }} />
            <button className="btn btn-primary btn-full" onClick={handleAddDamage}>
              <Plus size={16} /> Ajouter ce dégât
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
