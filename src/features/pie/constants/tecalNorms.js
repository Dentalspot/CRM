/**
 * TECAL — Test para la Comprensión Auditiva del Lenguaje
 * Adaptación chilena del Test de Carrow
 * 101 items: Vocabulario (41) + Morfología (48) + Sintaxis (12)
 * Edades: 3-6 años
 * Scoring: correcto=1, incorrecto=0 → puntaje = total - errores
 */

export const TECAL_SECTIONS = {
  vocabulario: { total: 41, label: 'Vocabulario' },
  morfologia:  { total: 48, label: 'Morfología' },
  sintaxis:    { total: 12, label: 'Sintaxis' },
};

// Cutoffs idénticos para edades 3-6 (según tablas normativas chilenas)
const TECAL_CUTOFFS = {
  vocabulario: { defMax: 18, riesgoMax: 22 }, // <=18 deficitario, 19-22 riesgo, >=23 normal
  morfologia:  { defMax: 14, riesgoMax: 22 },
  sintaxis:    { defMax: 2,  riesgoMax: 4  },
  total:       { defMax: 39, riesgoMax: 51 },
};

/**
 * Clasifica un puntaje TECAL por sección
 * @param {string} section - 'vocabulario' | 'morfologia' | 'sintaxis' | 'total'
 * @param {number} score - puntaje (total_items - errores)
 * @returns {{ de: string, resultado: string }}
 */
export function lookupTecal(section, score) {
  const cut = TECAL_CUTOFFS[section];
  if (!cut) return { de: '', resultado: 'sin datos' };

  if (score <= cut.defMax) return { de: '<2 DE', resultado: 'deficitario' };
  if (score <= cut.riesgoMax) return { de: '<1 DE', resultado: 'riesgo' };
  return { de: 'X o superior', resultado: 'normal' };
}
