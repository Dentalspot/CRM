/**
 * Perfil Sensorial - Dunn (Sensory Profile 2)
 *
 * Cuestionario para cuidadores que evalúa el procesamiento sensorial
 * en niños de 3-14 años. Basado en el modelo de Dunn (4 cuadrantes).
 *
 * Escala Likert: 1 = Casi nunca, 2 = Pocas veces, 3 = Mitad del tiempo, 4 = Frecuentemente, 5 = Casi siempre
 */

// ─── Score Options ───
export const SCORE_OPTIONS = [
  { value: 1, label: 'Casi nunca', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 2, label: 'Pocas veces', color: 'bg-lime-100 text-lime-700 border-lime-300' },
  { value: 3, label: 'Mitad del tiempo', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 4, label: 'Frecuentemente', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 5, label: 'Casi siempre', color: 'bg-red-100 text-red-700 border-red-300' },
];

// ─── Sensory Processing Sections ───
export const SENSORIAL_SECTIONS = {
  auditory: {
    label: 'Procesamiento Auditivo',
    shortLabel: 'Auditivo',
    icon: '👂',
    items: [
      { code: 'AUD1', name: 'Se distrae o tiene dificultad para funcionar si hay mucho ruido alrededor' },
      { code: 'AUD2', name: 'Parece no escuchar lo que le dicen' },
      { code: 'AUD3', name: 'No puede trabajar con ruido de fondo' },
      { code: 'AUD4', name: 'Se asusta con sonidos fuertes' },
      { code: 'AUD5', name: 'Tiene dificultad para completar tareas cuando la radio está encendida' },
      { code: 'AUD6', name: 'Se cubre los oídos con las manos ante sonidos' },
      { code: 'AUD7', name: 'Le gustan los sonidos extraños o busca hacer ruidos' },
      { code: 'AUD8', name: 'No responde cuando le llaman por su nombre' },
    ],
  },
  visual: {
    label: 'Procesamiento Visual',
    shortLabel: 'Visual',
    icon: '👁️',
    items: [
      { code: 'VIS1', name: 'Prefiere estar a oscuras' },
      { code: 'VIS2', name: 'Se incomoda o evita luces brillantes' },
      { code: 'VIS3', name: 'Es muy observador, nota detalles que otros no ven' },
      { code: 'VIS4', name: 'Le cuesta encontrar objetos en un fondo con muchos elementos' },
      { code: 'VIS5', name: 'Mira fijamente a las personas u objetos' },
      { code: 'VIS6', name: 'Le molestan las luces fluorescentes o parpadeantes' },
    ],
  },
  tactile: {
    label: 'Procesamiento Táctil',
    shortLabel: 'Táctil',
    icon: '✋',
    items: [
      { code: 'TAC1', name: 'Reacciona de forma emocional o agresiva al ser tocado' },
      { code: 'TAC2', name: 'Evita andar descalzo, especialmente en arena o pasto' },
      { code: 'TAC3', name: 'Se molesta con ciertas telas o etiquetas de la ropa' },
      { code: 'TAC4', name: 'Evita ensuciarse las manos (pintura, pegamento, barro)' },
      { code: 'TAC5', name: 'Tiene reacciones adversas al cortarle el pelo o las uñas' },
      { code: 'TAC6', name: 'Prefiere tocar a las personas en vez de que lo toquen' },
      { code: 'TAC7', name: 'Toca objetos o personas de forma excesiva' },
      { code: 'TAC8', name: 'No parece notar cuando le tocan la cara o el cuerpo' },
      { code: 'TAC9', name: 'Disfruta de juegos con agua, arena o materiales de diferentes texturas' },
    ],
  },
  vestibular: {
    label: 'Procesamiento Vestibular',
    shortLabel: 'Vestibular',
    icon: '🔄',
    items: [
      { code: 'VES1', name: 'Se marea fácilmente en el auto o en juegos de movimiento' },
      { code: 'VES2', name: 'Le teme a las actividades que implican tener los pies despegados del suelo' },
      { code: 'VES3', name: 'Evita actividades en las que pueda caerse (escaleras, rampas)' },
      { code: 'VES4', name: 'Busca todo tipo de movimiento y esto interfiere con sus rutinas' },
      { code: 'VES5', name: 'Gira o da vueltas durante el día (no se marea)' },
      { code: 'VES6', name: 'Se mece cuando está sentado (en la silla, en el piso)' },
      { code: 'VES7', name: 'Busca oportunidades de caerse sin importar la seguridad personal' },
    ],
  },
  oral: {
    label: 'Procesamiento Oral',
    shortLabel: 'Oral',
    icon: '👄',
    items: [
      { code: 'ORA1', name: 'Es muy selectivo con la comida (texturas, sabores, temperaturas)' },
      { code: 'ORA2', name: 'Tiene arcadas con alimentos de ciertas texturas' },
      { code: 'ORA3', name: 'Se limita a comer solo ciertos sabores' },
      { code: 'ORA4', name: 'Mastica o lame objetos no comestibles' },
      { code: 'ORA5', name: 'Se mete objetos en la boca (lápices, dedos, ropa)' },
      { code: 'ORA6', name: 'Prefiere comidas con sabores intensos (picante, ácido, salado)' },
    ],
  },
  body_position: {
    label: 'Procesamiento de Posición Corporal',
    shortLabel: 'Propioceptivo',
    icon: '🦴',
    items: [
      { code: 'PRO1', name: 'Busca actividades de empujar, tirar, arrastrar objetos pesados' },
      { code: 'PRO2', name: 'Agarra objetos con demasiada fuerza' },
      { code: 'PRO3', name: 'Parece tener músculos débiles o se cansa fácilmente' },
      { code: 'PRO4', name: 'Se apoya en paredes, muebles o personas' },
      { code: 'PRO5', name: 'Tropieza con objetos o personas con frecuencia' },
      { code: 'PRO6', name: 'Salta, choca o empuja a otros niños durante el juego' },
      { code: 'PRO7', name: 'Tiene dificultad para graduar la presión (escribe muy fuerte o muy suave)' },
    ],
  },
  conduct: {
    label: 'Respuestas Conductuales y Emocionales',
    shortLabel: 'Conducta',
    icon: '🧠',
    items: [
      { code: 'CON1', name: 'Tiene dificultad para tolerar cambios en la rutina' },
      { code: 'CON2', name: 'Tiene rabietas o se frustra fácilmente' },
      { code: 'CON3', name: 'Es sensible a las críticas' },
      { code: 'CON4', name: 'Necesita más protección del entorno que otros niños' },
      { code: 'CON5', name: 'Tiene dificultad para hacer amigos' },
      { code: 'CON6', name: 'Se aísla o evita situaciones sociales ruidosas/caóticas' },
      { code: 'CON7', name: 'Es rígido o inflexible en su forma de hacer las cosas' },
      { code: 'CON8', name: 'Tiene dificultad para calmarse cuando está alterado' },
    ],
  },
};

// ─── Cuadrantes de Dunn ───
export const DUNN_QUADRANTS = {
  registration: {
    label: 'Bajo Registro',
    description: 'No detecta los estímulos sensoriales del entorno',
    color: 'blue',
  },
  seeking: {
    label: 'Búsqueda Sensorial',
    description: 'Busca activamente experiencias sensoriales',
    color: 'green',
  },
  sensitivity: {
    label: 'Sensibilidad Sensorial',
    description: 'Detecta estímulos sensoriales con facilidad',
    color: 'amber',
  },
  avoiding: {
    label: 'Evitación Sensorial',
    description: 'Se aleja activamente de las experiencias sensoriales',
    color: 'red',
  },
};

// ─── Classification Ranges ───
// Based on standard deviations from mean (Dunn, 2014)
export const CLASSIFICATION = {
  much_less: { label: 'Mucho menos que otros', color: 'bg-blue-100 text-blue-800 border-blue-300', range: 'SD ≤ -2' },
  less: { label: 'Menos que otros', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', range: '-2 < SD ≤ -1' },
  typical: { label: 'Similar a la mayoría', color: 'bg-green-100 text-green-800 border-green-300', range: '-1 < SD < 1' },
  more: { label: 'Más que otros', color: 'bg-orange-100 text-orange-800 border-orange-300', range: '1 ≤ SD < 2' },
  much_more: { label: 'Mucho más que otros', color: 'bg-red-100 text-red-800 border-red-300', range: 'SD ≥ 2' },
};

// ─── Normative Cutoffs by Section (ages 3-14, combined) ───
// Simplified cutoff ranges based on Sensory Profile 2 norms
export const SECTION_NORMS = {
  auditory:       { mean: 18, sd: 5.2, min: 8,  max: 40 },
  visual:         { mean: 13, sd: 3.8, min: 6,  max: 30 },
  tactile:        { mean: 20, sd: 5.5, min: 9,  max: 45 },
  vestibular:     { mean: 15, sd: 4.1, min: 7,  max: 35 },
  oral:           { mean: 14, sd: 4.3, min: 6,  max: 30 },
  body_position:  { mean: 16, sd: 4.0, min: 7,  max: 35 },
  conduct:        { mean: 18, sd: 5.0, min: 8,  max: 40 },
};

// ─── Helper: classify score ───
export function classifyScore(rawScore, section) {
  const norm = SECTION_NORMS[section];
  if (!norm) return 'typical';

  const zScore = (rawScore - norm.mean) / norm.sd;

  if (zScore <= -2) return 'much_less';
  if (zScore <= -1) return 'less';
  if (zScore < 1) return 'typical';
  if (zScore < 2) return 'more';
  return 'much_more';
}

// ─── Helper: get all items flat ───
export function getAllItems() {
  const items = [];
  Object.entries(SENSORIAL_SECTIONS).forEach(([sectionKey, section]) => {
    section.items.forEach(item => {
      items.push({ ...item, section: sectionKey });
    });
  });
  return items;
}

// ─── Helper: total items count ───
export const TOTAL_ITEMS = Object.values(SENSORIAL_SECTIONS)
  .reduce((sum, section) => sum + section.items.length, 0);
