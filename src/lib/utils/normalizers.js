import {
  DIFFICULTY_LEVELS,
  PLAN_STATUS,
  SESSION_STATUS,
  OBJECTIVE_TYPES
} from '../constants/enums';

/**
 * Normalizes a string by trimming whitespace and converting to lowercase
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export const normalizeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str).trim().toLowerCase();
};

/**
 * Normalizes an email address
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email
 */
export const normalizeEmail = (email) => {
  return normalizeString(email);
};

/**
 * Normalizes a Chilean RUT (removes dots and hyphens, uppercase K)
 * @param {string} rut - RUT to normalize
 * @returns {string} Normalized RUT (e.g., 12345678K)
 */
export const normalizeRut = (rut) => {
  if (!rut) return '';
  // Remove all non-alphanumeric characters (dots, dashes) and ensure uppercase K
  return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Normalizes a phone number (removes spaces, dashes, parentheses)
 * Keeps only digits and leading +
 * @param {string} phone - Phone to normalize
 * @returns {string} Normalized phone
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  // Keep digits and + sign
  return String(phone).replace(/[^0-9+]/g, '');
};

/**
 * Normalizes difficulty levels to the new ENUM values
 * Handles legacy values, numeric strings, and Spanish variations
 * @param {string} value - Difficulty value to normalize
 * @returns {string} ENUM value (snake_case)
 */
export const normalizeDifficulty = (value) => {
  if (!value) return DIFFICULTY_LEVELS.ADECUADO;

  // Normalize input: lowercase, remove accents
  const normalized = normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); 

  // Map legacy numeric strings (1-5 scale)
  if (normalized === '1') return DIFFICULTY_LEVELS.MUY_FACIL;
  if (normalized === '2') return DIFFICULTY_LEVELS.FACIL;
  if (normalized === '3') return DIFFICULTY_LEVELS.ADECUADO;
  if (normalized === '4') return DIFFICULTY_LEVELS.DIFICIL;
  if (normalized === '5') return DIFFICULTY_LEVELS.MUY_DIFICIL;

  // Map text descriptions (fuzzy matching)
  if (normalized.includes('muy facil')) return DIFFICULTY_LEVELS.MUY_FACIL;
  if (normalized === 'facil') return DIFFICULTY_LEVELS.FACIL;
  if (normalized === 'adecuado' || normalized === 'normal' || normalized === 'medio') return DIFFICULTY_LEVELS.ADECUADO;
  if (normalized === 'dificil') return DIFFICULTY_LEVELS.DIFICIL;
  if (normalized.includes('muy dificil')) return DIFFICULTY_LEVELS.MUY_DIFICIL;

  // Check if it's already a valid ENUM value (exact match)
  if (Object.values(DIFFICULTY_LEVELS).includes(value)) {
    return value;
  }

  // Default fallback
  return DIFFICULTY_LEVELS.ADECUADO;
};

/**
 * Normalizes status for plans and sessions
 * Maps various English/Spanish terms to standard database ENUMs
 * @param {string} status - Status to normalize
 * @param {string} type - 'plan' or 'session' (default: 'plan')
 * @returns {string} ENUM value
 */
export const normalizeStatus = (status, type = 'plan') => {
  const normalized = normalizeString(status);
  
  if (!normalized) {
    return type === 'plan' ? PLAN_STATUS.ACTIVE : SESSION_STATUS.SCHEDULED;
  }

  // Common mappings dictionary
  const statusMap = {
    // Standard English
    'active': PLAN_STATUS.ACTIVE,
    'completed': PLAN_STATUS.COMPLETED,
    'paused': PLAN_STATUS.PAUSED,
    'cancelled': PLAN_STATUS.CANCELLED,
    'canceled': PLAN_STATUS.CANCELLED,
    'scheduled': SESSION_STATUS.SCHEDULED,
    'rescheduled': SESSION_STATUS.RESCHEDULED,
    'pending': SESSION_STATUS.PENDING,
    
    // Spanish Variations
    'activo': PLAN_STATUS.ACTIVE,
    'completado': PLAN_STATUS.COMPLETED,
    'finalizado': PLAN_STATUS.COMPLETED,
    'terminado': PLAN_STATUS.COMPLETED,
    'pausado': PLAN_STATUS.PAUSED,
    'cancelado': PLAN_STATUS.CANCELLED,
    'programada': SESSION_STATUS.SCHEDULED,
    'agendada': SESSION_STATUS.SCHEDULED,
    'confirmada': SESSION_STATUS.SCHEDULED,
    'reprogramada': SESSION_STATUS.RESCHEDULED,
    'pendiente': SESSION_STATUS.PENDING
  };

  if (statusMap[normalized]) {
    return statusMap[normalized];
  }

  // Fallback: check if it matches valid ENUMs for the specific type
  const enumSet = type === 'plan' ? PLAN_STATUS : SESSION_STATUS;
  if (Object.values(enumSet).includes(status)) {
    return status;
  }

  // Default fallbacks
  return type === 'plan' ? PLAN_STATUS.ACTIVE : SESSION_STATUS.SCHEDULED;
};

/**
 * Normalizes objective types (Specific, General, Functional)
 * @param {string} type - Objective type to normalize
 * @returns {string} ENUM value
 */
export const normalizeObjectiveType = (type) => {
  const normalized = normalizeString(type);
  
  if (!normalized) return OBJECTIVE_TYPES.SPECIFIC;

  // Fuzzy matching for English and Spanish
  if (normalized.includes('especifico') || normalized === 'specific') return OBJECTIVE_TYPES.SPECIFIC;
  if (normalized.includes('general') || normalized === 'general') return OBJECTIVE_TYPES.GENERAL;
  if (normalized.includes('funcional') || normalized === 'functional') return OBJECTIVE_TYPES.FUNCTIONAL;

  // Exact match check
  if (Object.values(OBJECTIVE_TYPES).includes(type)) {
    return type;
  }

  return OBJECTIVE_TYPES.SPECIFIC;
};

export default {
  normalizeString,
  normalizeEmail,
  normalizeRut,
  normalizePhone,
  normalizeDifficulty,
  normalizeStatus,
  normalizeObjectiveType
};