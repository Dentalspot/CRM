/**
 * Tabla de adquisición de fonemas del español chileno
 * Basada en: Coloma, Pavez, Maggiolo & Peñaloza (2010) — "Desarrollo fonológico
 * en niños de 3 y 4 años según la Fonología Natural" (Universidad de Chile)
 *
 * Edad de adquisición: edad en años a la que el 90% de los niños produce
 * el fonema correctamente en todos los contextos.
 *
 * Orden de intervención según evidencia:
 * 1. Primero por edad de adquisición (más tempranos primero)
 * 2. Luego por punto articulatorio (anterior → posterior)
 * 3. La vibrante múltiple /rr/ siempre se trabaja al final
 */

export const PHONEME_ACQUISITION = {
  // Bilabiales (anteriores)
  'm':  { phoneme: '/m/',  name: 'bilabial nasal',       age: 3, point: 'bilabial',       order: 1 },
  'p':  { phoneme: '/p/',  name: 'bilabial oclusiva',    age: 3, point: 'bilabial',       order: 2 },
  'b':  { phoneme: '/b/',  name: 'bilabial oclusiva',    age: 3, point: 'bilabial',       order: 3 },

  // Labiodentales
  'f':  { phoneme: '/f/',  name: 'labiodental fricativa', age: 3, point: 'labiodental',   order: 4 },

  // Dentales / Alveolares (anteriores)
  't':  { phoneme: '/t/',  name: 'dental oclusiva',      age: 3, point: 'dental',         order: 5 },
  'd':  { phoneme: '/d/',  name: 'dental oclusiva',      age: 3, point: 'dental',         order: 6 },
  'n':  { phoneme: '/n/',  name: 'alveolar nasal',       age: 3, point: 'alveolar',       order: 7 },
  'l':  { phoneme: '/l/',  name: 'alveolar lateral',     age: 3, point: 'alveolar',       order: 8 },
  's':  { phoneme: '/s/',  name: 'alveolar fricativa',   age: 4, point: 'alveolar',       order: 9 },

  // Palatales (medias)
  'ch': { phoneme: '/ch/', name: 'palatal africada',     age: 3, point: 'palatal',        order: 10 },
  'ñ':  { phoneme: '/ñ/',  name: 'palatal nasal',        age: 3, point: 'palatal',        order: 11 },
  'y':  { phoneme: '/y/',  name: 'palatal fricativa',    age: 3, point: 'palatal',        order: 12 },

  // Velares (posteriores)
  'k':  { phoneme: '/k/',  name: 'velar oclusiva',       age: 3, point: 'velar',          order: 13 },
  'g':  { phoneme: '/g/',  name: 'velar oclusiva',       age: 3, point: 'velar',          order: 14 },
  'j':  { phoneme: '/j/',  name: 'velar fricativa',      age: 4, point: 'velar',          order: 15 },

  // Vibrantes (las últimas en adquirirse)
  'r':  { phoneme: '/r/',  name: 'alveolar vibrante simple', age: 4, point: 'alveolar',   order: 16 },
  'rr': { phoneme: '/rr/', name: 'alveolar vibrante múltiple', age: 5, point: 'alveolar', order: 17 },

  // Grupos consonánticos (dífonos)
  'cl': { phoneme: '/Cl/', name: 'grupo con /l/',        age: 5, point: 'grupo',          order: 18 },
  'cr': { phoneme: '/Cr/', name: 'grupo con /r/',        age: 5, point: 'grupo',          order: 19 },
};

/**
 * Determina si un PSF es esperado para la edad del niño
 * @param {string} phoneme - fonema afectado (ej: 'r', 'rr', 's')
 * @param {number} childAge - edad del niño en años
 * @returns {{ expected: boolean, acquisitionAge: number }}
 */
export function isProcessExpected(phoneme, childAge) {
  const p = phoneme.toLowerCase().replace(/\//g, '');
  const info = PHONEME_ACQUISITION[p];
  if (!info) return { expected: false, acquisitionAge: null, phonemeInfo: null };
  return {
    expected: childAge < info.age,
    acquisitionAge: info.age,
    phonemeInfo: info,
  };
}

/**
 * Ordena fonemas afectados según prioridad de intervención
 * 1. Por edad de adquisición (más tempranos primero — deberían estar adquiridos)
 * 2. Por punto articulatorio (anterior → posterior)
 * 3. /rr/ siempre al final
 * @param {string[]} affectedPhonemes - lista de fonemas afectados
 * @param {number} childAge - edad del niño
 * @returns {Array<{ phoneme, name, acquisitionAge, expected, priority }>}
 */
export function prioritizeIntervention(affectedPhonemes, childAge) {
  const priorities = affectedPhonemes
    .map(p => {
      const clean = p.toLowerCase().replace(/\//g, '');
      const info = PHONEME_ACQUISITION[clean];
      if (!info) return null;
      return {
        phoneme: info.phoneme,
        name: info.name,
        point: info.point,
        acquisitionAge: info.age,
        expected: childAge < info.age,
        order: info.order,
      };
    })
    .filter(Boolean)
    // Remove duplicates
    .filter((v, i, a) => a.findIndex(x => x.phoneme === v.phoneme) === i)
    // Sort: unexpected first (should be acquired), then by order (anterior→posterior, /rr/ last)
    .sort((a, b) => {
      // Unexpected (not expected = should be acquired) come first
      if (a.expected !== b.expected) return a.expected ? 1 : -1;
      // Then by canonical order
      return a.order - b.order;
    });

  return priorities.map((p, i) => ({ ...p, priority: i + 1 }));
}
