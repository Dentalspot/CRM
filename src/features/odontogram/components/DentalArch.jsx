import React from 'react';
import ToothDiagram from './ToothDiagram';

/**
 * Renderiza un arco dental (superior o inferior) con los dientes en fila.
 */
const DentalArch = ({ leftTeeth, rightTeeth, teethData, selectedCondition, onSurfaceClick, label }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      )}
      <div className="flex items-center gap-0.5 flex-wrap justify-center">
        {/* Lado derecho del paciente (izquierda visual) */}
        <div className="flex items-center gap-0.5">
          {leftTeeth.map((tooth) => (
            <ToothDiagram
              key={tooth}
              toothNumber={tooth}
              toothState={teethData[tooth]}
              selectedCondition={selectedCondition}
              onSurfaceClick={onSurfaceClick}
            />
          ))}
        </div>
        {/* Linea media */}
        <div className="w-px h-14 bg-slate-300 mx-1" />
        {/* Lado izquierdo del paciente (derecha visual) */}
        <div className="flex items-center gap-0.5">
          {rightTeeth.map((tooth) => (
            <ToothDiagram
              key={tooth}
              toothNumber={tooth}
              toothState={teethData[tooth]}
              selectedCondition={selectedCondition}
              onSurfaceClick={onSurfaceClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DentalArch;
