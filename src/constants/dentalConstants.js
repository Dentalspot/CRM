/**
 * Constantes para el Odontograma Digital
 * Sistema FDI (Federation Dentaire Internationale) de numeracion dental
 */

// Condiciones dentales con color asociado
export const DENTAL_CONDITIONS = {
  HEALTHY: { id: 'healthy', label: 'Sano', color: '#FFFFFF', border: '#D1D5DB' },
  CARIES: { id: 'caries', label: 'Caries', color: '#EF4444' },
  RESTORATION: { id: 'restoration', label: 'Restauracion', color: '#3B82F6' },
  EXTRACTION: { id: 'extraction', label: 'Extraccion', color: '#000000' },
  ABSENT: { id: 'absent', label: 'Ausente', color: '#9CA3AF' },
  CROWN: { id: 'crown', label: 'Corona', color: '#EAB308' },
  ENDODONTICS: { id: 'endodontics', label: 'Endodoncia', color: '#8B5CF6' },
  IMPLANT: { id: 'implant', label: 'Implante', color: '#06B6D4' },
  SEALANT: { id: 'sealant', label: 'Sellante', color: '#10B981' },
  FRACTURE: { id: 'fracture', label: 'Fractura', color: '#F97316' },
  PERIAPICAL: { id: 'periapical', label: 'Lesion periapical', color: '#DC2626' },
};

// Las 5 superficies de cada diente
export const TOOTH_SURFACES = {
  MESIAL: 'mesial',
  DISTAL: 'distal',
  OCCLUSAL: 'oclusal', // incisal para dientes anteriores
  VESTIBULAR: 'vestibular',
  LINGUAL: 'lingual', // palatino para superiores
};

// Nombres de superficies para display
export const SURFACE_LABELS = {
  mesial: 'Mesial',
  distal: 'Distal',
  oclusal: 'Oclusal/Incisal',
  vestibular: 'Vestibular',
  lingual: 'Lingual/Palatino',
};

// Dientes anteriores (usan "incisal" en vez de "oclusal")
const ANTERIOR_TEETH = [11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43,
  51, 52, 53, 61, 62, 63, 71, 72, 73, 81, 82, 83];

export const isAnteriorTooth = (toothNumber) => ANTERIOR_TEETH.includes(toothNumber);

// Mapa FDI - Denticion adulta (32 dientes)
export const ADULT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11], // Q1
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],   // Q2
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],   // Q3
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],  // Q4
};

// Mapa FDI - Denticion infantil (20 dientes)
export const CHILD_TEETH = {
  upperRight: [55, 54, 53, 52, 51], // Q5
  upperLeft: [61, 62, 63, 64, 65],   // Q6
  lowerLeft: [71, 72, 73, 74, 75],   // Q7
  lowerRight: [85, 84, 83, 82, 81],  // Q8
};

// Nombres de dientes para tooltip
export const TOOTH_NAMES = {
  // Adulto Superior
  11: 'Incisivo central sup. der.',   12: 'Incisivo lateral sup. der.',
  13: 'Canino sup. der.',             14: 'Primer premolar sup. der.',
  15: 'Segundo premolar sup. der.',   16: 'Primer molar sup. der.',
  17: 'Segundo molar sup. der.',      18: 'Tercer molar sup. der.',
  21: 'Incisivo central sup. izq.',   22: 'Incisivo lateral sup. izq.',
  23: 'Canino sup. izq.',             24: 'Primer premolar sup. izq.',
  25: 'Segundo premolar sup. izq.',   26: 'Primer molar sup. izq.',
  27: 'Segundo molar sup. izq.',      28: 'Tercer molar sup. izq.',
  // Adulto Inferior
  31: 'Incisivo central inf. izq.',   32: 'Incisivo lateral inf. izq.',
  33: 'Canino inf. izq.',             34: 'Primer premolar inf. izq.',
  35: 'Segundo premolar inf. izq.',   36: 'Primer molar inf. izq.',
  37: 'Segundo molar inf. izq.',      38: 'Tercer molar inf. izq.',
  41: 'Incisivo central inf. der.',   42: 'Incisivo lateral inf. der.',
  43: 'Canino inf. der.',             44: 'Primer premolar inf. der.',
  45: 'Segundo premolar inf. der.',   46: 'Primer molar inf. der.',
  47: 'Segundo molar inf. der.',      48: 'Tercer molar inf. der.',
  // Temporal
  51: 'Incisivo central temp. sup. der.', 52: 'Incisivo lateral temp. sup. der.',
  53: 'Canino temp. sup. der.',           54: 'Primer molar temp. sup. der.',
  55: 'Segundo molar temp. sup. der.',
  61: 'Incisivo central temp. sup. izq.', 62: 'Incisivo lateral temp. sup. izq.',
  63: 'Canino temp. sup. izq.',           64: 'Primer molar temp. sup. izq.',
  65: 'Segundo molar temp. sup. izq.',
  71: 'Incisivo central temp. inf. izq.', 72: 'Incisivo lateral temp. inf. izq.',
  73: 'Canino temp. inf. izq.',           74: 'Primer molar temp. inf. izq.',
  75: 'Segundo molar temp. inf. izq.',
  81: 'Incisivo central temp. inf. der.', 82: 'Incisivo lateral temp. inf. der.',
  83: 'Canino temp. inf. der.',           84: 'Primer molar temp. inf. der.',
  85: 'Segundo molar temp. inf. der.',
};

// Estado inicial de un diente (todas las superficies sanas)
export const getDefaultToothState = () => ({
  mesial: 'healthy',
  distal: 'healthy',
  oclusal: 'healthy',
  vestibular: 'healthy',
  lingual: 'healthy',
  notes: '',
});
