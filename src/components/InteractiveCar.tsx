import { useState } from 'react';
import { VehicleView } from '../types';

interface Props {
  activeView: VehicleView;
  onViewChange: (view: VehicleView) => void;
  damageCounts: Record<VehicleView, number>;
  onZoneClick: (zone: string, view: VehicleView) => void;
}

const ZONE_COLORS = {
  0: 'rgba(0,230,118,0.15)',
  1: 'rgba(255,153,0,0.3)',
  2: 'rgba(255,51,102,0.3)',
  3: 'rgba(255,51,102,0.5)',
};

function getZoneColor(count: number) {
  if (count === 0) return ZONE_COLORS[0];
  if (count === 1) return ZONE_COLORS[1];
  if (count === 2) return ZONE_COLORS[2];
  return ZONE_COLORS[3];
}

const views: { key: VehicleView; label: string; icon: string }[] = [
  { key: 'avant', label: 'Avant', icon: '⬆' },
  { key: 'gauche', label: 'Gauche', icon: '⬅' },
  { key: 'dessus', label: 'Dessus', icon: '⬇' },
  { key: 'droite', label: 'Droite', icon: '➡' },
  { key: 'arriere', label: 'Arrière', icon: '⬇' },
];

// SVG paths for each view
function CarFront({ onZone, counts }: { onZone: (z: string) => void; counts: Record<string, number> }) {
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', maxHeight: 220 }}>
      {/* Body */}
      <path d="M60,140 L60,180 Q60,200 80,200 L220,200 Q240,200 240,180 L240,140 Q240,100 200,80 L100,80 Q60,100 60,140Z" fill="rgba(255,255,255,0.05)" stroke="var(--border-light)" strokeWidth="2" />
      {/* Windshield */}
      <path d="M90,80 L80,50 Q80,30 100,25 L200,25 Q220,30 220,50 L210,80Z" fill="rgba(0,191,255,0.1)" stroke="var(--border-light)" strokeWidth="1.5" onClick={() => onZone('Pare-brise')} style={{cursor:'pointer'}} className="car-zone">
        <title>Pare-brise ({counts['Pare-brise'] || 0})</title>
      </path>
      {/* Hood - Capot */}
      <rect x="80" y="85" width="140" height="50" rx="8" fill={getZoneColor(counts['Capot'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Capot')} style={{cursor:'pointer'}} className="car-zone">
        <title>Capot ({counts['Capot'] || 0})</title>
      </rect>
      <text x="150" y="115" textAnchor="middle" fill="var(--text2)" fontSize="11" fontWeight="700" pointerEvents="none">CAPOT</text>
      {/* Bumper */}
      <rect x="65" y="145" width="170" height="30" rx="6" fill={getZoneColor(counts['Pare-choc avant'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Pare-choc avant')} style={{cursor:'pointer'}} className="car-zone">
        <title>Pare-choc avant ({counts['Pare-choc avant'] || 0})</title>
      </rect>
      <text x="150" y="165" textAnchor="middle" fill="var(--text2)" fontSize="10" fontWeight="600" pointerEvents="none">PARE-CHOC</text>
      {/* Headlights */}
      <ellipse cx="85" cy="140" rx="15" ry="12" fill={getZoneColor(counts['Phares'] || 0)} stroke="var(--accent)" strokeWidth="1" onClick={() => onZone('Phares')} style={{cursor:'pointer'}} className="car-zone" />
      <ellipse cx="215" cy="140" rx="15" ry="12" fill={getZoneColor(counts['Phares'] || 0)} stroke="var(--accent)" strokeWidth="1" onClick={() => onZone('Phares')} style={{cursor:'pointer'}} className="car-zone" />
      {/* Grille */}
      <rect x="110" y="135" width="80" height="15" rx="4" fill={getZoneColor(counts['Calandre'] || 0)} stroke="var(--border-light)" strokeWidth="1" onClick={() => onZone('Calandre')} style={{cursor:'pointer'}} className="car-zone" />
    </svg>
  );
}

function CarRear({ onZone, counts }: { onZone: (z: string) => void; counts: Record<string, number> }) {
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', maxHeight: 220 }}>
      <path d="M60,140 L60,180 Q60,200 80,200 L220,200 Q240,200 240,180 L240,140 Q240,100 200,80 L100,80 Q60,100 60,140Z" fill="rgba(255,255,255,0.05)" stroke="var(--border-light)" strokeWidth="2" />
      <path d="M90,80 L80,50 Q80,30 100,25 L200,25 Q220,30 220,50 L210,80Z" fill="rgba(0,191,255,0.1)" stroke="var(--border-light)" strokeWidth="1.5" onClick={() => onZone('Lunette arrière')} style={{cursor:'pointer'}} className="car-zone" />
      <rect x="80" y="85" width="140" height="50" rx="8" fill={getZoneColor(counts['Coffre'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Coffre')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="150" y="115" textAnchor="middle" fill="var(--text2)" fontSize="11" fontWeight="700" pointerEvents="none">COFFRE</text>
      <rect x="65" y="145" width="170" height="30" rx="6" fill={getZoneColor(counts['Pare-choc arrière'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Pare-choc arrière')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="150" y="165" textAnchor="middle" fill="var(--text2)" fontSize="10" fontWeight="600" pointerEvents="none">PARE-CHOC</text>
      <ellipse cx="85" cy="140" rx="15" ry="12" fill={getZoneColor(counts['Feux arrière'] || 0)} stroke="var(--red)" strokeWidth="1" onClick={() => onZone('Feux arrière')} style={{cursor:'pointer'}} className="car-zone" />
      <ellipse cx="215" cy="140" rx="15" ry="12" fill={getZoneColor(counts['Feux arrière'] || 0)} stroke="var(--red)" strokeWidth="1" onClick={() => onZone('Feux arrière')} style={{cursor:'pointer'}} className="car-zone" />
    </svg>
  );
}

function CarSide({ onZone, counts, flip }: { onZone: (z: string) => void; counts: Record<string, number>; flip?: boolean }) {
  const side = flip ? 'droite' : 'gauche';
  return (
    <svg viewBox="0 0 340 180" style={{ width: '100%', maxHeight: 180, transform: flip ? 'scaleX(-1)' : undefined }}>
      {/* Body */}
      <path d="M30,120 L30,140 Q30,155 45,155 L295,155 Q310,155 310,140 L310,120 Q310,100 290,90 L240,70 Q220,55 180,50 L130,50 Q90,55 70,70 L50,90 Q30,100 30,120Z" fill="rgba(255,255,255,0.05)" stroke="var(--border-light)" strokeWidth="2" />
      {/* Windows */}
      <path d="M130,52 L85,72 L85,88 L170,88 L170,52Z" fill="rgba(0,191,255,0.1)" stroke="var(--border-light)" strokeWidth="1" />
      <path d="M175,52 L175,88 L245,88 L245,72 Q235,58 210,52Z" fill="rgba(0,191,255,0.1)" stroke="var(--border-light)" strokeWidth="1" />
      {/* Wheels */}
      <circle cx="90" cy="155" r="22" fill="var(--bg)" stroke="var(--text3)" strokeWidth="3" />
      <circle cx="90" cy="155" r="10" fill="var(--surface3)" />
      <circle cx="250" cy="155" r="22" fill="var(--bg)" stroke="var(--text3)" strokeWidth="3" />
      <circle cx="250" cy="155" r="10" fill="var(--surface3)" />
      {/* Front door */}
      <rect x="85" y="88" width="85" height="55" rx="2" fill={getZoneColor(counts[`Porte avant ${side}`] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone(`Porte avant ${side}`)} style={{cursor:'pointer'}} className="car-zone" />
      {/* Rear door */}
      <rect x="170" y="88" width="75" height="55" rx="2" fill={getZoneColor(counts[`Porte arrière ${side}`] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone(`Porte arrière ${side}`)} style={{cursor:'pointer'}} className="car-zone" />
      {/* Fender front */}
      <rect x="35" y="95" width="50" height="45" rx="4" fill={getZoneColor(counts[`Aile avant ${side}`] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone(`Aile avant ${side}`)} style={{cursor:'pointer'}} className="car-zone" />
      {/* Fender rear */}
      <rect x="245" y="95" width="60" height="45" rx="4" fill={getZoneColor(counts[`Aile arrière ${side}`] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone(`Aile arrière ${side}`)} style={{cursor:'pointer'}} className="car-zone" />
      {/* Sill */}
      <rect x="115" y="143" width="130" height="12" rx="3" fill={getZoneColor(counts[`Bas de caisse ${side}`] || 0)} stroke="var(--border-light)" strokeWidth="1" onClick={() => onZone(`Bas de caisse ${side}`)} style={{cursor:'pointer'}} className="car-zone" />
    </svg>
  );
}

function CarTop({ onZone, counts }: { onZone: (z: string) => void; counts: Record<string, number> }) {
  return (
    <svg viewBox="0 0 200 340" style={{ width: '100%', maxHeight: 280 }}>
      <path d="M40,60 Q40,30 60,20 L140,20 Q160,30 160,60 L160,280 Q160,310 140,320 L60,320 Q40,310 40,280Z" fill="rgba(255,255,255,0.05)" stroke="var(--border-light)" strokeWidth="2" />
      {/* Windshield */}
      <path d="M55,65 L55,95 L145,95 L145,65 Q140,45 100,40 Q60,45 55,65Z" fill={getZoneColor(counts['Pare-brise'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Pare-brise')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="100" y="80" textAnchor="middle" fill="var(--text2)" fontSize="9" fontWeight="600" pointerEvents="none">PARE-BRISE</text>
      {/* Roof */}
      <rect x="55" y="100" width="90" height="110" rx="6" fill={getZoneColor(counts['Toit'] || 0)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" onClick={() => onZone('Toit')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="100" y="160" textAnchor="middle" fill="var(--text2)" fontSize="11" fontWeight="700" pointerEvents="none">TOIT</text>
      {/* Rear window */}
      <path d="M55,215 L55,250 Q60,270 100,275 Q140,270 145,250 L145,215Z" fill={getZoneColor(counts['Vitres latérales'] || 0)} stroke="var(--border-light)" strokeWidth="1" onClick={() => onZone('Vitres latérales')} style={{cursor:'pointer'}} className="car-zone" />
      {/* Hood */}
      <rect x="50" y="25" width="100" height="35" rx="8" fill={getZoneColor(counts['Capot'] || 0)} stroke="var(--border-light)" strokeWidth="1" onClick={() => onZone('Capot')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="100" y="47" textAnchor="middle" fill="var(--text2)" fontSize="9" fontWeight="600" pointerEvents="none">CAPOT</text>
      {/* Trunk */}
      <rect x="50" y="280" width="100" height="35" rx="8" fill={getZoneColor(counts['Coffre'] || 0)} stroke="var(--border-light)" strokeWidth="1" onClick={() => onZone('Coffre')} style={{cursor:'pointer'}} className="car-zone" />
      <text x="100" y="302" textAnchor="middle" fill="var(--text2)" fontSize="9" fontWeight="600" pointerEvents="none">COFFRE</text>
    </svg>
  );
}

export default function InteractiveCar({ activeView, onViewChange, damageCounts, onZoneClick }: Props) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Count damages per zone for current view
  const zoneCounts: Record<string, number> = {};

  const handleZone = (zone: string) => {
    onZoneClick(zone, activeView);
  };

  return (
    <div className="interactive-car">
      {/* View Selector - 360° rotation buttons */}
      <div className="car-view-selector">
        {views.map(v => (
          <button
            key={v.key}
            className={`car-view-btn ${activeView === v.key ? 'active' : ''}`}
            onClick={() => onViewChange(v.key)}
          >
            <span className="car-view-icon">{v.icon}</span>
            <span>{v.label}</span>
            {(damageCounts[v.key] || 0) > 0 && (
              <span className="car-view-count">{damageCounts[v.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Car SVG */}
      <div className="car-svg-container">
        {activeView === 'avant' && <CarFront onZone={handleZone} counts={zoneCounts} />}
        {activeView === 'arriere' && <CarRear onZone={handleZone} counts={zoneCounts} />}
        {activeView === 'gauche' && <CarSide onZone={handleZone} counts={zoneCounts} />}
        {activeView === 'droite' && <CarSide onZone={handleZone} counts={zoneCounts} flip />}
        {activeView === 'dessus' && <CarTop onZone={handleZone} counts={zoneCounts} />}
        
        <div className="car-hint">Touchez une zone pour ajouter un dégât</div>
      </div>
    </div>
  );
}
