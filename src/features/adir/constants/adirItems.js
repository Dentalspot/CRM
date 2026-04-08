/**
 * ADI-R (Autism Diagnostic Interview — Revised)
 * 
 * NOTA LEGAL: Los nombres descriptivos de ítems son genéricos y no reproducen
 * el texto literal del protocolo ADI-R (copyright WPS / Rutter, Le Couteur, Lord).
 * El profesional debe tener su protocolo físico licenciado.
 * Esta herramienta es un sistema de REGISTRO y SCORING, no reemplaza el protocolo.
 */

// ─────────────────────────────────────────────
// OPCIONES GENERALES
// ─────────────────────────────────────────────

export const ADIR_VERBAL_STATUS = [
  { value: 'verbal', label: 'Verbal (habla funcional con frases)' },
  { value: 'non_verbal', label: 'No verbal / Palabras sueltas' },
];

export const ADIR_INFORMANT_RELATIONSHIPS = [
  { value: 'madre', label: 'Madre' },
  { value: 'padre', label: 'Padre' },
  { value: 'ambos_padres', label: 'Ambos padres' },
  { value: 'abuelo_a', label: 'Abuelo/a' },
  { value: 'cuidador_a', label: 'Cuidador/a' },
  { value: 'otro', label: 'Otro' },
];

export const ADIR_SCORE_OPTIONS = [
  { value: 0, label: '0 — No evidencia de anormalidad' },
  { value: 1, label: '1 — Conducta posiblemente presente / leve' },
  { value: 2, label: '2 — Conducta claramente presente' },
  { value: 3, label: '3 — Severamente presente / grado máximo' },
  { value: 7, label: '7 — Definitivamente anormal, no codificable' },
  { value: 8, label: '8 — No aplica' },
  { value: 9, label: '9 — No conocido / no preguntado' },
];

export const ADIR_PERIODS = [
  { value: 'current', label: 'Conducta actual' },
  { value: '4_5_years', label: 'Período 4-5 años' },
  { value: 'ever', label: 'Alguna vez' },
];

// ─────────────────────────────────────────────
// DOMINIOS E ÍTEMS DEL ALGORITMO DIAGNÓSTICO
// ─────────────────────────────────────────────
// Solo se incluyen los ítems que forman parte del ALGORITMO diagnóstico.
// Los nombres son descripciones genéricas del constructo evaluado.
// El profesional debe referirse a su protocolo licenciado para la administración.

export const ADIR_DOMAINS = {
  A: {
    label: 'A — Interacción social recíproca',
    shortLabel: 'Interacción Social',
    icon: 'Users',
    description: 'Alteraciones cualitativas de la interacción social recíproca.',
    periods: ['current', '4_5_years'],
    items: [
      { code: 'A1', name: 'Uso de la mirada directa para regular la interacción social' },
      { code: 'A2', name: 'Sonrisa social' },
      { code: 'A3', name: 'Expresiones faciales dirigidas a otros' },
      { code: 'A4', name: 'Disfrute compartido en la interacción' },
      { code: 'A5', name: 'Ofrecimientos de consuelo' },
      { code: 'A6', name: 'Calidad de las aproximaciones sociales' },
      { code: 'A7', name: 'Gama de expresiones faciales comunicativas' },
      { code: 'A8', name: 'Conductas inapropiadas en las expresiones faciales' },
      { code: 'A9', name: 'Adecuación de las respuestas sociales' },
      { code: 'A10', name: 'Interés en otros niños/pares' },
      { code: 'A11', name: 'Respuesta a las aproximaciones de otros niños' },
      { code: 'A12', name: 'Juego en grupo con pares' },
      { code: 'A13', name: 'Amistades' },
      { code: 'A14', name: 'Calidad general de la relación social' },
      { code: 'A15', name: 'Mostrar y dirigir la atención' },
      { code: 'A16', name: 'Ofrecer para compartir' },
    ],
  },

  B_verbal: {
    label: 'B — Comunicación (Verbal)',
    shortLabel: 'Comunicación Verbal',
    icon: 'MessageCircle',
    description: 'Para individuos con habla funcional con frases. Evalúa comunicación y lenguaje.',
    periods: ['current', '4_5_years'],
    items: [
      { code: 'B1v', name: 'Señalamiento para expresar interés' },
      { code: 'B2v', name: 'Asentir con la cabeza' },
      { code: 'B3v', name: 'Negar con la cabeza' },
      { code: 'B4v', name: 'Gestos convencionales/instrumentales' },
      { code: 'B5v', name: 'Gestos descriptivos' },
      { code: 'B6v', name: 'Uso del cuerpo del otro como herramienta' },
      { code: 'B7v', name: 'Conversación recíproca' },
      { code: 'B8v', name: 'Habla estereotipada/ecolalia' },
      { code: 'B9v', name: 'Preguntas o afirmaciones inapropiadas' },
      { code: 'B10v', name: 'Inversión pronominal' },
      { code: 'B11v', name: 'Neologismos/uso idiosincrásico del lenguaje' },
      { code: 'B12v', name: 'Comentarios sociales/verbalizaciones' },
      { code: 'B13v', name: 'Juego imaginativo con pares' },
    ],
  },

  B_nonverbal: {
    label: 'B — Comunicación (No verbal)',
    shortLabel: 'Comunicación No Verbal',
    icon: 'Hand',
    description: 'Para individuos sin habla funcional o con solo palabras sueltas.',
    periods: ['current', '4_5_years'],
    items: [
      { code: 'B1nv', name: 'Señalamiento para expresar interés' },
      { code: 'B2nv', name: 'Asentir con la cabeza' },
      { code: 'B3nv', name: 'Negar con la cabeza' },
      { code: 'B4nv', name: 'Gestos convencionales/instrumentales' },
      { code: 'B5nv', name: 'Gestos descriptivos' },
      { code: 'B6nv', name: 'Uso del cuerpo del otro como herramienta' },
      { code: 'B7nv', name: 'Juego imaginativo espontáneo' },
    ],
  },

  C: {
    label: 'C — Conductas restringidas, repetitivas y estereotipadas',
    shortLabel: 'Conducta RRE',
    icon: 'Repeat',
    description: 'Patrones de conducta restringidos, repetitivos y estereotipados.',
    periods: ['current', 'ever'],
    items: [
      { code: 'C1', name: 'Preocupaciones inusuales o circunscritas' },
      { code: 'C2', name: 'Rituales o rutinas' },
      { code: 'C3', name: 'Dificultades con cambios menores en rutinas' },
      { code: 'C4', name: 'Compulsiones / rituales' },
      { code: 'C5', name: 'Manierismos de manos y dedos' },
      { code: 'C6', name: 'Otros manierismos complejos o movimientos estereotipados del cuerpo' },
      { code: 'C7', name: 'Uso repetitivo de objetos o interés en partes de objetos' },
      { code: 'C8', name: 'Intereses sensoriales inusuales' },
    ],
  },

  D: {
    label: 'D — Alteraciones del desarrollo antes de los 36 meses',
    shortLabel: 'Desarrollo < 36m',
    icon: 'Baby',
    description: 'Edad de aparición de alteraciones en el desarrollo.',
    periods: ['ever'],
    items: [
      { code: 'D1', name: 'Edad de los padres ante primera preocupación' },
      { code: 'D2', name: 'Edad de adquisición de palabras sueltas' },
      { code: 'D3', name: 'Edad de adquisición de frases' },
      { code: 'D4', name: 'Pérdida de lenguaje o habilidades' },
      { code: 'D5', name: 'Evidencia de anormalidades antes de los 36 meses' },
    ],
  },
};

// ─────────────────────────────────────────────
// PUNTOS DE CORTE — ALGORITMO DIAGNÓSTICO
// ─────────────────────────────────────────────
// Fuente: Manual ADI-R (Rutter, Le Couteur & Lord, 2003)
// Los cutoffs están publicados en la literatura científica.

export const ADIR_CUTOFFS = {
  verbal: {
    A: 10,   // Interacción social ≥ 10
    B: 8,    // Comunicación verbal ≥ 8
    C: 3,    // Conducta restringida ≥ 3
    D: 1,    // Desarrollo < 36m ≥ 1
  },
  non_verbal: {
    A: 10,
    B: 7,    // Comunicación no verbal ≥ 7
    C: 3,
    D: 1,
  },
};

// ─────────────────────────────────────────────
// CLASIFICACIÓN
// ─────────────────────────────────────────────

export const ADIR_CLASIFICACION = {
  autism: {
    label: 'Cumple criterios ADI-R para Autismo',
    color: 'bg-red-100 text-red-800 border-red-300',
    badgeColor: 'bg-red-500',
    description: 'Alcanza o supera los puntos de corte en los cuatro dominios (A, B, C y D).',
  },
  non_spectrum: {
    label: 'No cumple criterios ADI-R',
    color: 'bg-green-100 text-green-800 border-green-300',
    badgeColor: 'bg-green-500',
    description: 'No alcanza el punto de corte en uno o más dominios.',
  },
  inconclusive: {
    label: 'Resultado inconcluso',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeColor: 'bg-amber-500',
    description: 'Datos insuficientes para determinar clasificación (ítems no evaluados).',
  },
};

export const DOMAIN_LABELS = {
  A: 'Interacción Social Recíproca (A)',
  B_verbal: 'Comunicación Verbal (B)',
  B_nonverbal: 'Comunicación No Verbal (B)',
  C: 'Conducta Restringida y Repetitiva (C)',
  D: 'Alteraciones del Desarrollo (D)',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Obtiene el dominio B correcto según el verbal_status del paciente.
 */
export const getActiveBDomain = (verbalStatus) =>
  verbalStatus === 'verbal' ? 'B_verbal' : 'B_nonverbal';

/**
 * Obtiene los dominios activos para una evaluación según verbal_status.
 */
export const getActiveDomains = (verbalStatus) => {
  const bDomain = getActiveBDomain(verbalStatus);
  return ['A', bDomain, 'C', 'D'];
};

/**
 * Convierte raw_score a algorithm_score (misma regla que ADOS-2).
 * 3 → 2, 7/8/9 → 0, resto se mantiene.
 */
export const toAlgorithmScore = (rawScore) => {
  if ([7, 8, 9].includes(rawScore)) return 0;
  if (rawScore === 3) return 2;
  return rawScore;
};

/**
 * Clasifica la evaluación según los cutoffs.
 * El ADI-R requiere cumplir TODOS los dominios para clasificar como 'autism'.
 */
export const clasificarAdir = (totals, verbalStatus) => {
  const cutoffs = ADIR_CUTOFFS[verbalStatus] || ADIR_CUTOFFS.verbal;

  const cumple = {
    A: totals.A >= cutoffs.A,
    B: totals.B >= cutoffs.B,
    C: totals.C >= cutoffs.C,
    D: totals.D >= cutoffs.D,
  };

  // Verificar si hay datos suficientes
  const hasAllData = Object.values(totals).every(v => v !== null && v !== undefined);
  if (!hasAllData) {
    return { cumple, clasificacion: 'inconclusive' };
  }

  const allMet = cumple.A && cumple.B && cumple.C && cumple.D;
  return {
    cumple,
    clasificacion: allMet ? 'autism' : 'non_spectrum',
  };
};
