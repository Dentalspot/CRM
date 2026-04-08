/**
 * TEPROSIF-R — Test de Evaluación de Procesos de Simplificación Fonológica Revisado
 * 37 ítems de denominación por confrontación visual
 * Edades: 3-6 años
 * Se cuentan 3 tipos de procesos: Estructural, Asimilación, Sustitución
 * Clasificación según total de procesos por edad
 */

// Normas chilenas: total procesos → clasificación
export const TEPROSIF_NORMS = {
  3: { maxNormal: 29, maxRiesgo: 39 },
  4: { maxNormal: 19, maxRiesgo: 29 },
  5: { maxNormal: 9,  maxRiesgo: 19 },
  6: { maxNormal: 5,  maxRiesgo: 9  },
};

export const TEPROSIF_ITEMS = [
  { num: 1,  word: 'Plancha',       syllables: ['PLAN', 'CHA'] },
  { num: 2,  word: 'Rueda',         syllables: ['RUE', 'DA'] },
  { num: 3,  word: 'Mariposa',      syllables: ['MA', 'RI', 'PO', 'SA'] },
  { num: 4,  word: 'Bicicleta',     syllables: ['BI', 'CI', 'CLE', 'TA'] },
  { num: 5,  word: 'Helicóptero',   syllables: ['HE', 'LI', 'CÓP', 'TE', 'RO'] },
  { num: 6,  word: 'Bufanda',       syllables: ['BU', 'FAN', 'DA'] },
  { num: 7,  word: 'Caperucita',    syllables: ['CA', 'PE', 'RU', 'CI', 'TA'] },
  { num: 8,  word: 'Alfombra',      syllables: ['AL', 'FOM', 'BRA'] },
  { num: 9,  word: 'Refrigerador',  syllables: ['RE', 'FRI', 'GE', 'RA', 'DOR'] },
  { num: 10, word: 'Edificio',      syllables: ['E', 'DI', 'FI', 'CIO'] },
  { num: 11, word: 'Calcetín',      syllables: ['CAL', 'CE', 'TÍN'] },
  { num: 12, word: 'Dinosaurio',    syllables: ['DI', 'NO', 'SAU', 'RIO'] },
  { num: 13, word: 'Teléfono',      syllables: ['TE', 'LÉ', 'FO', 'NO'] },
  { num: 14, word: 'Remedio',       syllables: ['RE', 'ME', 'DIO'] },
  { num: 15, word: 'Peineta',       syllables: ['PEI', 'NE', 'TA'] },
  { num: 16, word: 'Auto',          syllables: ['AU', 'TO'] },
  { num: 17, word: 'Indio',         syllables: ['IN', 'DIO'] },
  { num: 18, word: 'Pantalón',      syllables: ['PAN', 'TA', 'LÓN'] },
  { num: 19, word: 'Camión',        syllables: ['CA', 'MIÓN'] },
  { num: 20, word: 'Cuaderno',      syllables: ['CUA', 'DER', 'NO'] },
  { num: 21, word: 'Micro',         syllables: ['MI', 'CRO'] },
  { num: 22, word: 'Tren',          syllables: ['TREN'] },
  { num: 23, word: 'Plátano',       syllables: ['PLÁ', 'TA', 'NO'] },
  { num: 24, word: 'Jugo',          syllables: ['JU', 'GO'] },
  { num: 25, word: 'Enchufe',       syllables: ['EN', 'CHU', 'FE'] },
  { num: 26, word: 'Jabón',         syllables: ['JA', 'BÓN'] },
  { num: 27, word: 'Tambor',        syllables: ['TAM', 'BOR'] },
  { num: 28, word: 'Volantín',      syllables: ['VO', 'LAN', 'TÍN'] },
  { num: 29, word: 'Jirafa',        syllables: ['JI', 'RA', 'FA'] },
  { num: 30, word: 'Gorro',         syllables: ['GO', 'RRO'] },
  { num: 31, word: 'Árbol',         syllables: ['ÁR', 'BOL'] },
  { num: 32, word: 'Dulce',         syllables: ['DUL', 'CE'] },
  { num: 33, word: 'Guitarra',      syllables: ['GUI', 'TA', 'RRA'] },
  { num: 34, word: 'Guante',        syllables: ['GUAN', 'TE'] },
  { num: 35, word: 'Reloj',         syllables: ['RE', 'LOJ'] },
  { num: 36, word: 'Jaula',         syllables: ['JAU', 'LA'] },
  { num: 37, word: 'Puente',        syllables: ['PUEN', 'TE'] },
];

/**
 * Clasifica resultado TEPROSIF-R según edad y total de procesos
 * @param {number} age - edad en años (3-6)
 * @param {number} totalProcesses - total de PSF identificados
 * @returns {{ resultado: string }}
 */
export function lookupTeprosif(age, totalProcesses) {
  const cAge = Math.min(Math.max(age, 3), 6);
  const norms = TEPROSIF_NORMS[cAge];
  if (totalProcesses <= norms.maxNormal) return { resultado: 'normal' };
  if (totalProcesses <= norms.maxRiesgo) return { resultado: 'riesgo' };
  return { resultado: 'deficitario' };
}
