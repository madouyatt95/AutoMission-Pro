import React, { useState } from 'react';

type VehicleView = 'avant' | 'arriere' | 'gauche' | 'droite' | 'dessus';

interface Props {
  view: VehicleView;
  onPartClick: (partName: string, x: number, y: number) => void;
}

export default function InteractiveCarSVG({ view, onPartClick }: Props) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent<SVGElement>, partName: string) => {
    e.stopPropagation();
    const svg = e.currentTarget.ownerSVGElement || (e.currentTarget.tagName === 'svg' ? e.currentTarget : null);
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onPartClick(partName, x, y);
  };

  const partStyle = (partName: string) => ({
    fill: hoveredPart === partName ? 'rgba(255, 85, 0, 0.2)' : 'transparent',
    stroke: hoveredPart === partName ? 'var(--accent)' : 'rgba(255, 255, 255, 0.3)',
    strokeWidth: hoveredPart === partName ? 3 : 2,
    cursor: 'crosshair',
    transition: 'all 0.2s ease',
  });

  const renderView = () => {
    switch (view) {
      case 'gauche':
      case 'droite':
        const side = view === 'gauche' ? 'gauche' : 'droite';
        return (
          <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <path d="M 100,250 C 100,200 150,180 220,170 C 260,120 320,100 450,100 C 580,100 660,130 700,180 C 740,190 770,220 770,260 L 770,300 L 100,300 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            
            <path d="M 230,170 C 270,120 330,105 450,105 C 550,105 610,125 650,170 L 610,170 L 450,170 L 290,170 Z" {...partStyle(`Vitres ${side}s`)} onMouseEnter={() => setHoveredPart(`Vitres ${side}s`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Vitres ${side}s`)} />
            
            <path d="M 100,250 C 100,200 150,180 230,170 L 230,300 L 100,300 Z" {...partStyle(`Aile avant ${side}`)} onMouseEnter={() => setHoveredPart(`Aile avant ${side}`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Aile avant ${side}`)} />
            <circle cx="180" cy="300" r="45" fill="var(--bg)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" pointerEvents="none" />
            <circle cx="180" cy="300" r="30" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" pointerEvents="none" />
            
            <path d="M 230,170 L 400,170 L 400,300 L 230,300 Z" {...partStyle(`Porte avant ${side}`)} onMouseEnter={() => setHoveredPart(`Porte avant ${side}`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Porte avant ${side}`)} />
            
            <path d="M 400,170 L 580,170 L 580,300 L 400,300 Z" {...partStyle(`Porte arrière ${side}`)} onMouseEnter={() => setHoveredPart(`Porte arrière ${side}`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Porte arrière ${side}`)} />
            
            <path d="M 580,170 C 650,170 700,180 770,260 L 770,300 L 580,300 Z" {...partStyle(`Aile arrière ${side}`)} onMouseEnter={() => setHoveredPart(`Aile arrière ${side}`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Aile arrière ${side}`)} />
            <circle cx="650" cy="300" r="45" fill="var(--bg)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" pointerEvents="none" />
            <circle cx="650" cy="300" r="30" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" pointerEvents="none" />

            <rect x="230" y="300" width="350" height="15" {...partStyle(`Bas de caisse ${side}`)} onMouseEnter={() => setHoveredPart(`Bas de caisse ${side}`)} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, `Bas de caisse ${side}`)} />
            
            <path d="M 270,165 C 270,150 290,150 290,165 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" pointerEvents="none" />
          </svg>
        );

      case 'avant':
        return (
          <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <path d="M 250,200 C 300,150 500,150 550,200 L 600,300 L 200,300 Z" {...partStyle('Pare-brise')} onMouseEnter={() => setHoveredPart('Pare-brise')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-brise')} />
            
            <path d="M 280,150 C 320,120 480,120 520,150 L 550,200 C 500,150 300,150 250,200 Z" {...partStyle('Toit')} onMouseEnter={() => setHoveredPart('Toit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Toit')} />

            <path d="M 200,300 L 600,300 C 620,380 620,400 600,420 L 200,420 C 180,400 180,380 200,300 Z" {...partStyle('Capot')} onMouseEnter={() => setHoveredPart('Capot')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Capot')} />
            
            <path d="M 180,420 L 620,420 C 630,480 600,550 400,550 C 200,550 170,480 180,420 Z" {...partStyle('Pare-choc avant')} onMouseEnter={() => setHoveredPart('Pare-choc avant')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-choc avant')} />
            
            <rect x="300" y="440" width="200" height="50" rx="10" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="3" pointerEvents="none" />
            <line x1="300" y1="465" x2="500" y2="465" stroke="rgba(255,255,255,0.1)" strokeWidth="3" pointerEvents="none" />

            <path d="M 210,380 L 280,390 L 260,410 L 200,400 Z" {...partStyle('Phare avant gauche')} onMouseEnter={() => setHoveredPart('Phare avant gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Phare avant gauche')} />
            
            <path d="M 590,380 L 520,390 L 540,410 L 600,400 Z" {...partStyle('Phare avant droit')} onMouseEnter={() => setHoveredPart('Phare avant droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Phare avant droit')} />

            <path d="M 160,300 C 130,300 130,270 170,270 Z" {...partStyle('Rétroviseur gauche')} onMouseEnter={() => setHoveredPart('Rétroviseur gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur gauche')} />
            <path d="M 640,300 C 670,300 670,270 630,270 Z" {...partStyle('Rétroviseur droit')} onMouseEnter={() => setHoveredPart('Rétroviseur droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur droit')} />
          </svg>
        );

      case 'arriere':
        return (
          <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <path d="M 250,200 C 300,150 500,150 550,200 L 600,300 L 200,300 Z" {...partStyle('Lunette arrière')} onMouseEnter={() => setHoveredPart('Lunette arrière')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Lunette arrière')} />
            
            <path d="M 280,150 C 320,120 480,120 520,150 L 550,200 C 500,150 300,150 250,200 Z" {...partStyle('Toit')} onMouseEnter={() => setHoveredPart('Toit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Toit')} />

            <path d="M 200,300 L 600,300 L 620,440 L 180,440 Z" {...partStyle('Coffre / Hayon')} onMouseEnter={() => setHoveredPart('Coffre / Hayon')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Coffre / Hayon')} />
            
            <rect x="330" y="380" width="140" height="30" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" pointerEvents="none" />

            <path d="M 180,440 L 620,440 C 630,520 600,550 400,550 C 200,550 170,520 180,440 Z" {...partStyle('Pare-choc arrière')} onMouseEnter={() => setHoveredPart('Pare-choc arrière')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-choc arrière')} />
            
            <path d="M 190,340 L 280,340 L 280,370 L 180,370 Z" {...partStyle('Feu arrière gauche')} onMouseEnter={() => setHoveredPart('Feu arrière gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Feu arrière gauche')} />
            
            <path d="M 610,340 L 520,340 L 520,370 L 620,370 Z" {...partStyle('Feu arrière droit')} onMouseEnter={() => setHoveredPart('Feu arrière droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Feu arrière droit')} />

            <path d="M 170,300 C 150,300 150,280 180,280 Z" {...partStyle('Rétroviseur gauche')} onMouseEnter={() => setHoveredPart('Rétroviseur gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur gauche')} />
            <path d="M 630,300 C 650,300 650,280 620,280 Z" {...partStyle('Rétroviseur droit')} onMouseEnter={() => setHoveredPart('Rétroviseur droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur droit')} />
          </svg>
        );

      case 'dessus':
        return (
          <svg viewBox="0 0 400 800" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <path d="M 100,100 C 150,80 250,80 300,100 L 320,130 L 80,130 Z" {...partStyle('Pare-choc avant')} onMouseEnter={() => setHoveredPart('Pare-choc avant')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-choc avant')} />
            
            <path d="M 80,130 L 320,130 L 300,300 L 100,300 Z" {...partStyle('Capot')} onMouseEnter={() => setHoveredPart('Capot')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Capot')} />
            
            <path d="M 100,300 L 300,300 L 280,360 L 120,360 Z" {...partStyle('Pare-brise')} onMouseEnter={() => setHoveredPart('Pare-brise')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-brise')} />
            
            <rect x="120" y="360" width="160" height="150" {...partStyle('Toit')} onMouseEnter={() => setHoveredPart('Toit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Toit')} />
            
            <path d="M 120,510 L 280,510 L 300,560 L 100,560 Z" {...partStyle('Lunette arrière')} onMouseEnter={() => setHoveredPart('Lunette arrière')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Lunette arrière')} />
            
            <path d="M 100,560 L 300,560 L 310,660 L 90,660 Z" {...partStyle('Coffre / Hayon')} onMouseEnter={() => setHoveredPart('Coffre / Hayon')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Coffre / Hayon')} />
            
            <path d="M 90,660 L 310,660 C 280,720 120,720 90,660 Z" {...partStyle('Pare-choc arrière')} onMouseEnter={() => setHoveredPart('Pare-choc arrière')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Pare-choc arrière')} />

            <path d="M 80,130 L 100,300 L 120,360 L 120,510 L 100,560 L 90,660 C 60,500 50,200 80,130 Z" {...partStyle('Côté gauche')} onMouseEnter={() => setHoveredPart('Côté gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Côté gauche')} />
            
            <path d="M 320,130 L 300,300 L 280,360 L 280,510 L 300,560 L 310,660 C 340,500 350,200 320,130 Z" {...partStyle('Côté droit')} onMouseEnter={() => setHoveredPart('Côté droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Côté droit')} />

            <path d="M 100,320 L 70,320 L 70,340 L 110,340 Z" {...partStyle('Rétroviseur gauche')} onMouseEnter={() => setHoveredPart('Rétroviseur gauche')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur gauche')} />
            <path d="M 300,320 L 330,320 L 330,340 L 290,340 Z" {...partStyle('Rétroviseur droit')} onMouseEnter={() => setHoveredPart('Rétroviseur droit')} onMouseLeave={() => setHoveredPart(null)} onClick={(e) => handleClick(e, 'Rétroviseur droit')} />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {renderView()}
    </div>
  );
}
