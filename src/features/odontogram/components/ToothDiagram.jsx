import React from 'react';
import { DENTAL_CONDITIONS, isAnteriorTooth, TOOTH_NAMES } from '@/constants/dentalConstants';

/**
 * SVG de un diente individual con 5 superficies clickeables.
 * Cada superficie se colorea segun su condicion.
 * Layout: cuadrado con oclusal al centro, vestibular arriba, lingual abajo, mesial izq, distal der.
 */
const ToothDiagram = ({ toothNumber, toothState, selectedCondition, onSurfaceClick, size = 48 }) => {
  const getColor = (surface) => {
    const conditionId = toothState?.[surface] || 'healthy';
    const condition = Object.values(DENTAL_CONDITIONS).find(c => c.id === conditionId);
    return condition?.color || '#FFFFFF';
  };

  const getBorder = (surface) => {
    const conditionId = toothState?.[surface] || 'healthy';
    return conditionId === 'healthy' ? '#D1D5DB' : getColor(surface);
  };

  const handleClick = (surface) => {
    if (onSurfaceClick && selectedCondition) {
      onSurfaceClick(toothNumber, surface, selectedCondition);
    }
  };

  const isAbsent = Object.values(toothState || {}).some(v => v === 'absent');
  const toothName = TOOTH_NAMES[toothNumber] || `Diente ${toothNumber}`;
  const half = size / 2;
  const third = size / 3;
  const twoThird = (size * 2) / 3;

  return (
    <div className="flex flex-col items-center gap-0.5" title={`${toothNumber} - ${toothName}`}>
      <span className="text-[10px] font-mono text-slate-500 select-none">{toothNumber}</span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`cursor-pointer ${isAbsent ? 'opacity-30' : ''}`}
      >
        {/* Vestibular (arriba) */}
        <polygon
          points={`0,0 ${size},0 ${twoThird},${third} ${third},${third}`}
          fill={getColor('vestibular')}
          stroke={getBorder('vestibular')}
          strokeWidth="1"
          className="hover:brightness-90 transition-all"
          onClick={() => handleClick('vestibular')}
        />
        {/* Lingual (abajo) */}
        <polygon
          points={`${third},${twoThird} ${twoThird},${twoThird} ${size},${size} 0,${size}`}
          fill={getColor('lingual')}
          stroke={getBorder('lingual')}
          strokeWidth="1"
          className="hover:brightness-90 transition-all"
          onClick={() => handleClick('lingual')}
        />
        {/* Mesial (izquierda) */}
        <polygon
          points={`0,0 ${third},${third} ${third},${twoThird} 0,${size}`}
          fill={getColor('mesial')}
          stroke={getBorder('mesial')}
          strokeWidth="1"
          className="hover:brightness-90 transition-all"
          onClick={() => handleClick('mesial')}
        />
        {/* Distal (derecha) */}
        <polygon
          points={`${twoThird},${third} ${size},0 ${size},${size} ${twoThird},${twoThird}`}
          fill={getColor('distal')}
          stroke={getBorder('distal')}
          strokeWidth="1"
          className="hover:brightness-90 transition-all"
          onClick={() => handleClick('distal')}
        />
        {/* Oclusal/Incisal (centro) */}
        <rect
          x={third}
          y={third}
          width={size / 3}
          height={size / 3}
          fill={getColor('oclusal')}
          stroke={getBorder('oclusal')}
          strokeWidth="1"
          className="hover:brightness-90 transition-all"
          onClick={() => handleClick('oclusal')}
        />
      </svg>
    </div>
  );
};

export default ToothDiagram;
