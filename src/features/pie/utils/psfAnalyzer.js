/**
 * Analizador de Procesos de Simplificación Fonológica (PSF)
 * Compara la producción del niño con la palabra modelo.
 * SUGERENCIA — el terapeuta siempre puede editar los conteos.
 */

const VOWELS = 'aáeéiíoóuú';
const isVowel = (c) => VOWELS.includes(c);

// Diptongos del español
const DIPHTHONGS = [
  'ia', 'ie', 'io', 'iu', 'ua', 'ue', 'uo', 'ui',
  'ai', 'ei', 'oi', 'au', 'eu', 'ou',
  'ía', 'ié', 'ió', 'iú', 'úa', 'ué', 'uó', 'uí',
];

// Grupos consonánticos (trabantes)
const CLUSTERS = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'tl'];

function normalize(word) {
  return (word || '').toLowerCase().trim();
}

function stripAccents(word) {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Cuenta diptongos en una palabra
 */
function countDiphthongs(word) {
  const w = normalize(word);
  let count = 0;
  for (let i = 0; i < w.length - 1; i++) {
    if (isVowel(w[i]) && isVowel(w[i + 1])) {
      const pair = stripAccents(w[i] + w[i + 1]);
      if (DIPHTHONGS.includes(pair)) count++;
    }
  }
  return count;
}

/**
 * Cuenta grupos consonánticos
 */
function countClusters(word) {
  const w = stripAccents(normalize(word));
  let count = 0;
  for (const cl of CLUSTERS) {
    let idx = 0;
    while ((idx = w.indexOf(cl, idx)) !== -1) {
      count++;
      idx += cl.length;
    }
  }
  return count;
}

/**
 * Cuenta sílabas aproximadas
 */
function countSyllables(word) {
  const w = normalize(word);
  if (!w) return 0;
  let count = 0;
  let prevWasVowel = false;
  for (const c of w) {
    if (isVowel(c)) {
      if (!prevWasVowel) count++;
      prevWasVowel = true;
    } else {
      prevWasVowel = false;
    }
  }
  return Math.max(count, 1);
}

/**
 * Extrae fonemas consonánticos en orden
 */
function getConsonants(word) {
  const w = stripAccents(normalize(word));
  return [...w].filter(c => c.match(/[a-zñ]/) && !('aeiou'.includes(c)));
}

/**
 * Extrae fonemas vocálicos en orden
 */
function getVowels(word) {
  const w = stripAccents(normalize(word));
  return [...w].filter(c => 'aeiou'.includes(c));
}

/**
 * Analiza PSF comparando producción del niño con palabra modelo
 * @param {string} modelo - Palabra correcta
 * @param {string} produccion - Lo que dijo el niño
 * @returns {{ estructural: number, asimilacion: number, sustitucion: number }}
 */
export function analyzePSF(modelo, produccion) {
  if (!produccion?.trim() || !modelo) {
    return { estructural: 0, asimilacion: 0, sustitucion: 0 };
  }

  const m = normalize(modelo);
  const p = normalize(produccion);
  const mClean = stripAccents(m);
  const pClean = stripAccents(p);

  if (mClean === pClean) return { estructural: 0, asimilacion: 0, sustitucion: 0 };

  let estructural = 0;
  let asimilacion = 0;
  let sustitucion = 0;

  // ═══════════════════════════════════════
  // ESTRUCTURALES
  // ═══════════════════════════════════════

  // 1. Reducción silábica
  const mSyl = countSyllables(m);
  const pSyl = countSyllables(p);
  if (pSyl < mSyl) {
    estructural += (mSyl - pSyl);
  }

  // 2. Reducción de grupo consonántico (pl→p, br→b, tr→t, etc.)
  const mClusters = countClusters(m);
  const pClusters = countClusters(p);
  if (pClusters < mClusters) {
    estructural += (mClusters - pClusters);
  }

  // 3. Reducción de diptongo (ie→e, ue→e, io→o, etc.)
  const mDiph = countDiphthongs(m);
  const pDiph = countDiphthongs(p);
  if (pDiph < mDiph) {
    estructural += (mDiph - pDiph);
  }

  // 4. Omisión de consonante final / coda
  // Compare word length — if production is shorter but same syllables, coda was dropped
  const mCons = getConsonants(m);
  const pCons = getConsonants(p);
  if (pCons.length < mCons.length && pSyl >= mSyl) {
    estructural += Math.min(mCons.length - pCons.length, 2);
  }

  // ═══════════════════════════════════════
  // SUSTITUCIÓN
  // ═══════════════════════════════════════

  // Compare consonants using sequence alignment (simple LCS-based)
  const minConsLen = Math.min(mCons.length, pCons.length);
  let substitutions = 0;

  if (minConsLen > 0) {
    // Align consonants and compare
    let mi = 0, pi = 0;
    while (mi < mCons.length && pi < pCons.length) {
      if (mCons[mi] !== pCons[pi]) {
        // Check if it's a deletion (skip model) or substitution
        if (mi + 1 < mCons.length && mCons[mi + 1] === pCons[pi]) {
          // Deletion in model — already counted as structural
          mi++;
        } else if (pi + 1 < pCons.length && mCons[mi] === pCons[pi + 1]) {
          // Insertion in production — skip
          pi++;
        } else {
          substitutions++;
          mi++;
          pi++;
        }
      } else {
        mi++;
        pi++;
      }
    }
  }

  // Also check vowel substitutions (less common but happens)
  const mVow = getVowels(m);
  const pVow = getVowels(p);
  const minVowLen = Math.min(mVow.length, pVow.length);
  let vowelSubs = 0;
  for (let i = 0; i < minVowLen; i++) {
    if (mVow[i] !== pVow[i]) vowelSubs++;
  }
  // Only count vowel subs that aren't already from diphthong reduction
  const diphReductions = Math.max(0, mDiph - pDiph);
  vowelSubs = Math.max(0, vowelSubs - diphReductions);

  sustitucion = substitutions + vowelSubs;

  // ═══════════════════════════════════════
  // ASIMILACIÓN
  // ═══════════════════════════════════════

  // Detect consonant harmony: in production, a consonant that should be
  // different became the same as another consonant in the word
  if (substitutions > 0 && pCons.length >= 2) {
    let harmony = 0;
    for (let i = 0; i < pCons.length && i < mCons.length; i++) {
      if (pCons[i] !== mCons[i]) {
        // This consonant was changed — check if it matches another consonant in the word
        for (let j = 0; j < pCons.length; j++) {
          if (j !== i && pCons[i] === pCons[j] && j < mCons.length && mCons[i] !== mCons[j]) {
            harmony++;
            break;
          }
        }
      }
    }
    if (harmony > 0) {
      const moved = Math.min(harmony, sustitucion);
      asimilacion += moved;
      sustitucion -= moved;
    }
  }

  return { estructural, asimilacion, sustitucion };
}
