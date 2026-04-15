import React, { useMemo } from 'react';
import { DENTAL_CONDITIONS, SURFACE_LABELS } from '@/constants/dentalConstants';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

const SURFACE_SHORT = {
  mesial: 'M',
  distal: 'D',
  oclusal: 'O',
  vestibular: 'V',
  lingual: 'L',
};

// Convert FDI number to readable format: 14 → "1.4", 23 → "2.3"
const formatTooth = (num) => {
  const s = String(num);
  if (s.length === 2) return `${s[0]}.${s[1]}`;
  return s;
};

/**
 * Analyzes teeth_data and generates a grouped summary of findings.
 * Returns: [{ conditionId, label, color, teeth: [{ number, surfaces: ['M','O'] }] }]
 */
const analyzeTeethData = (teethData) => {
  if (!teethData || typeof teethData !== 'object') return [];

  const grouped = {}; // conditionId → { ...condition, teeth: { toothNum → [surfaces] } }

  Object.entries(teethData).forEach(([toothNum, surfaces]) => {
    if (!surfaces || typeof surfaces !== 'object') return;

    Object.entries(surfaces).forEach(([surface, conditionId]) => {
      if (!conditionId || conditionId === 'healthy' || conditionId === 'absent') return;

      if (!grouped[conditionId]) {
        const condition = Object.values(DENTAL_CONDITIONS).find(c => c.id === conditionId);
        if (!condition) return;
        grouped[conditionId] = {
          conditionId,
          label: condition.label,
          color: condition.color,
          teeth: {},
        };
      }

      if (!grouped[conditionId].teeth[toothNum]) {
        grouped[conditionId].teeth[toothNum] = [];
      }
      grouped[conditionId].teeth[toothNum].push(SURFACE_SHORT[surface] || surface);
    });
  });

  // Convert to array and sort teeth
  return Object.values(grouped).map(group => ({
    ...group,
    teeth: Object.entries(group.teeth)
      .map(([num, surfaces]) => ({ number: num, surfaces: surfaces.sort() }))
      .sort((a, b) => Number(a.number) - Number(b.number)),
  }));
};

/**
 * Displays a visual summary of odontogram findings.
 * Grouped by condition with affected teeth and surfaces.
 */
const OdontogramSummary = ({ teethData }) => {
  const findings = useMemo(() => analyzeTeethData(teethData), [teethData]);

  if (findings.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        Sin hallazgos registrados en el odontograma de diagnóstico.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="h-4 w-4 text-teal-600" />
        <span className="text-sm font-semibold text-teal-700">
          Hallazgos del Odontograma ({findings.reduce((sum, f) => sum + f.teeth.length, 0)} piezas afectadas)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((finding) => (
          <div
            key={finding.conditionId}
            className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-200"
                style={{ backgroundColor: finding.color }}
              />
              <Badge variant="outline" className="text-xs font-semibold">
                {finding.label}
              </Badge>
              <span className="text-xs text-gray-400 ml-auto">
                {finding.teeth.length} {finding.teeth.length === 1 ? 'pieza' : 'piezas'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {finding.teeth.map(({ number, surfaces }) => (
                <span
                  key={number}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono border"
                  style={{
                    borderColor: finding.color + '40',
                    backgroundColor: finding.color + '10',
                    color: finding.color === '#EAB308' || finding.color === '#FFFFFF' ? '#78716C' : finding.color,
                  }}
                >
                  <span className="font-bold">{formatTooth(number)}</span>
                  <span className="opacity-70">({surfaces.join(', ')})</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OdontogramSummary;
