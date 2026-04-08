export const ADOS2_MODULES = {
  T: {
    label: 'Módulo T',
    description: 'Pre-Verbal/Palabras sueltas · 12 a 30 meses',
    algorithms: [
      { value: 'todos_ninos', label: 'Todos los niños pequeños / Niños mayores con pocas o ninguna palabra' },
      { value: 'ninos_mayores_palabras', label: 'Niños mayores con algunas palabras' },
    ],
    items: {
      AS: [
        { code: 'A-2', name: 'Frecuencia de la vocalización espontánea dirigida a otros' },
        { code: 'A-7', name: 'Señalar' },
        { code: 'A-8', name: 'Gestos' },
        { code: 'B-1', name: 'Contacto visual inusual' },
        { code: 'B-4', name: 'Expresiones faciales dirigidas a otros' },
        { code: 'B-5', name: 'Integración de la mirada y otras conductas en las iniciaciones sociales' },
        { code: 'B-6', name: 'Disfrute compartido durante la interacción' },
        { code: 'B-7', name: 'Respuesta al nombre' },
        { code: 'B-8', name: 'Ignorar' },
        { code: 'B-9', name: 'Pedir' },
        { code: 'B-12', name: 'Mostrar' },
        { code: 'B-13', name: 'Iniciación espontánea de la atención conjunta' },
        { code: 'B-14', name: 'Respuesta a la atención conjunta' },
        { code: 'B-15', name: 'Características de las iniciaciones sociales' },
        { code: 'B-16B', name: 'Cantidad de las iniciaciones sociales/familiar o cuidador' },
        { code: 'B-18', name: 'Calidad general de la relación' },
      ],
      CRR: [
        { code: 'A-3', name: 'Entonación de las vocalizaciones o verbalizaciones' },
        { code: 'D-1', name: 'Interés sensorial inusual en los materiales de juego o en las personas' },
        { code: 'D-2', name: 'Movimientos de manos y dedos / postura' },
        { code: 'D-5', name: 'Intereses inusualmente repetitivos o comportamientos estereotipados' },
      ],
    },
  },

  '1': {
    label: 'Módulo 1',
    description: 'Pre-Verbal/Palabras sueltas · a partir de 31 meses',
    algorithms: [
      { value: 'pocas_palabras', label: 'Pocas palabras o ninguna' },
      { value: 'algunas_palabras', label: 'Algunas palabras' },
    ],
    items: {
      AS: [
        { code: 'A-2', name: 'Frecuencia de la vocalización espontánea dirigida a otros' },
        { code: 'A-7', name: 'Señalar' },
        { code: 'A-8', name: 'Gestos' },
        { code: 'B-1', name: 'Contacto visual inusual' },
        { code: 'B-3', name: 'Expresiones faciales dirigidas a otros' },
        { code: 'B-4', name: 'Integración de la mirada y otras conductas en las iniciaciones sociales' },
        { code: 'B-5', name: 'Disfrute compartido durante la interacción' },
        { code: 'B-9', name: 'Mostrar' },
        { code: 'B-10', name: 'Iniciación espontánea de la atención conjunta' },
        { code: 'B-11', name: 'Respuesta a la atención conjunta' },
        { code: 'B-12', name: 'Características de las iniciaciones sociales' },
      ],
      CRR: [
        { code: 'A-3', name: 'Entonación de las vocalizaciones o verbalizaciones' },
        { code: 'A-5', name: 'Uso estereotipado o idiosincrásico de palabras o frases' },
        { code: 'D-1', name: 'Interés sensorial inusual en los materiales de juego o en las personas' },
        { code: 'D-2', name: 'Manierismo de manos y dedos y otros manierismos complejos' },
        { code: 'D-4', name: 'Intereses inusualmente repetitivos o comportamientos estereotipados' },
      ],
    },
  },

  '2': {
    label: 'Módulo 2',
    description: 'Habla con frases',
    algorithms: [
      { value: 'menores_5', label: 'Menores de 5 años' },
      { value: '5_o_mas', label: '5 años o más' },
    ],
    items: {
      AS: [
        { code: 'A-6', name: 'Señalar' },
        { code: 'A-7', name: 'Gestos descriptivos, convencionales, instrumentales o informativos' },
        { code: 'B-1', name: 'Contacto visual inusual' },
        { code: 'B-2', name: 'Expresiones faciales dirigidas a otros' },
        { code: 'B-3', name: 'Disfrute compartido durante la interacción' },
        { code: 'B-5', name: 'Mostrar' },
        { code: 'B-6', name: 'Iniciación espontánea de la atención conjunta' },
        { code: 'B-8', name: 'Características de las iniciaciones sociales' },
        { code: 'B-11', name: 'Cantidad de comunicación social recíproca' },
        { code: 'B-12', name: 'Calidad general de la relación' },
      ],
      CRR: [
        { code: 'A-4', name: 'Uso estereotipado o idiosincrásico de palabras o frases' },
        { code: 'D-1', name: 'Interés sensorial inusual en los materiales de juego o en las personas' },
        { code: 'D-2', name: 'Manierismo de manos y dedos y otros manierismos complejos' },
        { code: 'D-4', name: 'Intereses inusualmente repetitivos o comportamientos estereotipados' },
      ],
    },
  },

  '3': {
    label: 'Módulo 3',
    description: 'Fluidez verbal · Niños y adolescentes',
    algorithms: [],
    items: {
      AS: [
        { code: 'A-7', name: 'Narración de sucesos' },
        { code: 'A-8', name: 'Conversación' },
        { code: 'A-9', name: 'Gestos descriptivos, convencionales, instrumentales o informativos' },
        { code: 'B-1', name: 'Contacto visual inusual' },
        { code: 'B-2', name: 'Expresiones faciales dirigidas al examinador' },
        { code: 'B-4', name: 'Disfrute compartido durante la interacción' },
        { code: 'B-7', name: 'Características de las iniciaciones sociales' },
        { code: 'B-9', name: 'Calidad de respuesta social' },
        { code: 'B-10', name: 'Cantidad de comunicación social recíproca' },
        { code: 'B-11', name: 'Calidad general de la relación' },
      ],
      CRR: [
        { code: 'A-4', name: 'Uso estereotipado o idiosincrásico de palabras o frases' },
        { code: 'D-1', name: 'Interés sensorial inusual en los materiales de juego o en las personas' },
        { code: 'D-2', name: 'Manierismo de manos y dedos y otros manierismos complejos' },
        { code: 'D-4', name: 'Intereses excesivos en temas u objetos inusuales o altamente específicos' },
      ],
    },
  },

  '4': {
    label: 'Módulo 4',
    description: 'Fluidez verbal · Adolescentes y adultos',
    algorithms: [],
    items: {
      COM: [
        { code: 'A-4', name: 'Uso estereotipado o idiosincrásico de palabras o frases' },
        { code: 'A-8', name: 'Conversación' },
        { code: 'A-9', name: 'Gestos descriptivos, convencionales, instrumentales o informativos' },
        { code: 'A-10', name: 'Gestos enfáticos o emocionales' },
      ],
      AS: [
        { code: 'B-1', name: 'Contacto visual inusual' },
        { code: 'B-2', name: 'Expresiones faciales dirigidas al examinador' },
        { code: 'B-6', name: 'Empatía y comentarios sobre las emociones de otros' },
        { code: 'B-8', name: 'Responsabilidad' },
        { code: 'B-9', name: 'Cualidad de los acercamientos sociales' },
        { code: 'B-10', name: 'Cualidad de la respuesta social' },
        { code: 'B-11', name: 'Cantidad de comunicación social recíproca' },
      ],
      CRR: [
        { code: 'C-1', name: 'Imaginación y creatividad' },
        { code: 'D-1', name: 'Interés sensorial inusual en los materiales de juego o en las personas' },
        { code: 'D-2', name: 'Manierismo de manos y dedos y otros manierismos complejos' },
        { code: 'D-4', name: 'Excesivo interés en temas u objetos inusuales o altamente específicos' },
        { code: 'D-5', name: 'Compulsiones o rituales' },
      ],
    },
  },
};

export const SCORE_OPTIONS = [
  { value: 0, label: '0 — No evidencia de conducta anormal' },
  { value: 1, label: '1 — Conducta levemente anormal' },
  { value: 2, label: '2 — Conducta claramente anormal' },
  { value: 3, label: '3 — Conducta claramente anormal / grave' },
  { value: 7, label: '7 — Definitivamente anormal; no se puede puntuar' },
  { value: 8, label: '8 — No aplica' },
  { value: 9, label: '9 — No evaluado' },
];

/**
 * Rangos de preocupación para Módulos 1, 2, 3 y 4.
 */
export const RANGO_CONFIG = {
  autismo: {
    label: 'Autismo',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'La puntuación total global se encuentra en el rango de Autismo.',
  },
  espectro_autista: {
    label: 'Espectro Autista',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'La puntuación total global se encuentra en el rango del Espectro Autista.',
  },
  no_tea: {
    label: 'No TEA',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'La puntuación total global no alcanza el punto de corte para TEA.',
  },
};

/**
 * Rangos de preocupación para Módulo T (usa terminología diferente).
 */
export const RANGO_CONFIG_T = {
  moderada_severa: {
    label: 'Moderada a Severa',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Nivel de preocupación moderado a severo.',
  },
  leve_moderada: {
    label: 'Leve a Moderada',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Nivel de preocupación leve a moderado.',
  },
  poco_ninguna: {
    label: 'Poco o Ninguna',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Poco o ningún nivel de preocupación.',
  },
};

/**
 * Puntos de corte por módulo y algoritmo.
 * Se compara la puntuación total global (AS + CRR) contra estos valores.
 * Módulo 4 tiene cortes separados para COM, ISR (AS) y COM+ISR.
 * Módulo T usa rangos de "preocupación" en vez de diagnóstico.
 */
export const CUTOFF_SCORES = {
  T: {
    todos_ninos: {
      moderada_severa: 14,   // >= 14
      leve_moderada: 10,     // 10 a 13
      // < 10 = poco_ninguna
    },
    ninos_mayores_palabras: {
      moderada_severa: 12,   // >= 12
      leve_moderada: 8,      // 8 a 11
      // < 8 = poco_ninguna
    },
  },
  '1': {
    pocas_palabras: { autismo: 16, espectro_autista: 11 },  // >= 16 autismo, 11-15 espectro, < 11 no TEA
    algunas_palabras: { autismo: 12, espectro_autista: 8 },   // >= 12 autismo, 8-11 espectro, < 8 no TEA
  },
  '2': {
    menores_5: { autismo: 10, espectro_autista: 7 },  // >= 10, 7-9, < 7
    '5_o_mas': { autismo: 9, espectro_autista: 8 },  // >= 9, 8, < 8
  },
  '3': {
    unico: { autismo: 9, espectro_autista: 7 },  // >= 9, 7-8, < 7
  },
  '4': {
    com: { autismo: 4, espectro_autista: 2 },
    isr: { autismo: 8, espectro_autista: 4 },
    com_isr: { autismo: 10, espectro_autista: 8 },  // Resultado final: COM + ISR
  },
};

export const DOMAIN_LABELS = {
  AS: 'Afectación Social (AS)',
  CRR: 'Comportamiento Restringido y Repetitivo (CRR)',
  COM: 'Comunicación (COM)',
};

/**
 * Clasifica el rango de preocupación dado un puntaje total y los cutoffs de un algoritmo.
 * @param {number} total - Puntaje total global
 * @param {object} cutoffs - { autismo: N, espectro_autista: N } o { moderada_severa: N, leve_moderada: N }
 * @param {boolean} isModuloT - Si es Módulo T usa rangos de preocupación
 * @returns {string} Clave del rango
 */
export const clasificarRango = (total, cutoffs, isModuloT = false) => {
  if (!cutoffs || total === null || total === undefined) return null;

  if (isModuloT) {
    if (total >= cutoffs.moderada_severa) return 'moderada_severa';
    if (total >= cutoffs.leve_moderada) return 'leve_moderada';
    return 'poco_ninguna';
  }

  if (total >= cutoffs.autismo) return 'autismo';
  if (total >= cutoffs.espectro_autista) return 'espectro_autista';
  return 'no_tea';
};