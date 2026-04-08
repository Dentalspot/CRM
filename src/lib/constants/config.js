/**
 * UI Configuration Constants
 * Centralizes styling and display configurations for various application elements.
 */

import {
  DIFFICULTY_LEVELS,
  PLAN_STATUS,
  OBJECTIVE_TYPES,
  SESSION_STATUS,
  USER_ROLES,
  APPOINTMENT_STATUS,
  CLINIC_MODALITY,
  PAYMENT_STATUS,
  ACHIEVEMENT_LEVELS,
  NOTIFICATION_STATUS,
  CLINICAL_ENTRY_TYPES
} from './enums';

// --- Badge Colors and Styles ---

export const DIFFICULTY_BADGE_STYLES = {
  [DIFFICULTY_LEVELS.MUY_FACIL]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Muy Fácil',
  },
  [DIFFICULTY_LEVELS.FACIL]: {
    color: 'bg-lime-100 text-lime-800 border-lime-200',
    label: 'Fácil',
  },
  [DIFFICULTY_LEVELS.ADECUADO]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Adecuado',
  },
  [DIFFICULTY_LEVELS.DIFICIL]: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Difícil',
  },
  [DIFFICULTY_LEVELS.MUY_DIFICIL]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Muy Difícil',
  },
};

export const PLAN_STATUS_BADGE_STYLES = {
  [PLAN_STATUS.ACTIVE]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Activo',
  },
  [PLAN_STATUS.COMPLETED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Completado',
  },
  [PLAN_STATUS.PAUSED]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pausado',
  },
  [PLAN_STATUS.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelado',
  },
};

export const OBJECTIVE_TYPE_BADGE_STYLES = {
  [OBJECTIVE_TYPES.SPECIFIC]: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Específico',
  },
  [OBJECTIVE_TYPES.GENERAL]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'General',
  },
  [OBJECTIVE_TYPES.FUNCTIONAL]: {
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    label: 'Funcional',
  },
};

export const SESSION_STATUS_BADGE_STYLES = {
  [SESSION_STATUS.SCHEDULED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Programada',
  },
  [SESSION_STATUS.COMPLETED]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Completada',
  },
  [SESSION_STATUS.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelada',
  },
  [SESSION_STATUS.RESCHEDULED]: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Reprogramada',
  },
  [SESSION_STATUS.PENDING]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Pendiente',
  },
};

export const USER_ROLE_BADGE_STYLES = {
  [USER_ROLES.THERAPIST]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'Terapeuta',
  },
  [USER_ROLES.ADMIN]: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Administrador',
  },
  [USER_ROLES.PATIENT]: {
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    label: 'Paciente',
  },
  [USER_ROLES.CLINIC]: {
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    label: 'Clínica',
  },
};

export const APPOINTMENT_STATUS_BADGE_STYLES = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Agendada',
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Confirmada',
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Completada',
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelada',
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'No Asistió',
  },
  [APPOINTMENT_STATUS.PENDING_CONFIRMATION]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pendiente Confirmación',
  },
};

export const CLINIC_MODALITY_BADGE_STYLES = {
  [CLINIC_MODALITY.PRESENCIAL]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'Presencial',
  },
  [CLINIC_MODALITY.ONLINE]: {
    color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    label: 'Online',
  },
  [CLINIC_MODALITY.AMBAS]: {
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    label: 'Ambas',
  },
};

export const PAYMENT_STATUS_BADGE_STYLES = {
  [PAYMENT_STATUS.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pendiente',
  },
  [PAYMENT_STATUS.PAID]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Pagado',
  },
  [PAYMENT_STATUS.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelado',
  },
  [PAYMENT_STATUS.REFUNDED]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Reembolsado',
  },
};

export const ACHIEVEMENT_LEVEL_BADGE_STYLES = {
  [ACHIEVEMENT_LEVELS.NO_LOGRADO]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'No logrado',
  },
  [ACHIEVEMENT_LEVELS.EN_PROCESO]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'En proceso',
  },
  [ACHIEVEMENT_LEVELS.LOGRADO]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Logrado',
  },
  [ACHIEVEMENT_LEVELS.SUPERADO]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Superado',
  },
};

export const NOTIFICATION_STATUS_BADGE_STYLES = {
  [NOTIFICATION_STATUS.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pendiente',
  },
  [NOTIFICATION_STATUS.SENT]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Enviado',
  },
  [NOTIFICATION_STATUS.READ]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Leído',
  },
  [NOTIFICATION_STATUS.FAILED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Fallido',
  },
};

// --- Clinical Entry Types ---

export const CLINICAL_ENTRY_TYPE_BADGE_STYLES = {
  [CLINICAL_ENTRY_TYPES.SESION]: {
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    label: 'Sesión',
  },
  [CLINICAL_ENTRY_TYPES.EVALUACION]: {
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    label: 'Evaluación',
  },
  [CLINICAL_ENTRY_TYPES.DIAGNOSTICO]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'Diagnóstico',
  },
  [CLINICAL_ENTRY_TYPES.INFORME]: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Informe',
  },
  [CLINICAL_ENTRY_TYPES.NOTA]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Nota Clínica',
  },
};

export const EXTENDED_ENTRY_TYPE_STYLES = {
  tratamiento: {
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    label: 'Tratamiento',
  },
  control: {
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    label: 'Control',
  },
  sesion_programada: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Sesión Programada',
  },
  nota_clinica: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Nota Clínica',
  },
  otro: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Otro',
  },
  informe_tea: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    label: 'Informe TEA',
  },
};

export const ALL_ENTRY_TYPE_STYLES = {
  ...CLINICAL_ENTRY_TYPE_BADGE_STYLES,
  ...EXTENDED_ENTRY_TYPE_STYLES,
};

// --- General UI Colors ---
export const UI_COLORS = {
  primary: {
    DEFAULT: '#007bff',
    light: '#66b2ff',
    dark: '#0056b3',
  },
  secondary: {
    DEFAULT: '#6c757d',
    light: '#a2a9af',
    dark: '#495057',
  },
  accent: {
    DEFAULT: '#28a745',
    light: '#63ed7a',
    dark: '#1e7e34',
  },
  info: {
    DEFAULT: '#17a2b8',
    light: '#5bcbe0',
    dark: '#117a8b',
  },
  success: {
    DEFAULT: '#28a745',
    light: '#63ed7a',
    dark: '#1e7e34',
  },
  warning: {
    DEFAULT: '#ffc107',
    light: '#ffdd71',
    dark: '#d39e00',
  },
  danger: {
    DEFAULT: '#dc3545',
    light: '#f17b85',
    dark: '#b31e2d',
  },
  background: {
    DEFAULT: '#f8f9fa',
    dark: '#e9ecef',
  },
  text: {
    DEFAULT: '#212529',
    light: '#495057',
    muted: '#6c757d',
  },
};


// --- Helper function to get badge styles ---
export const getBadgeStyles = (type, value) => {
  let styles = {};
  switch (type) {
    case 'difficulty':
      styles = DIFFICULTY_BADGE_STYLES;
      break;
    case 'planStatus':
      styles = PLAN_STATUS_BADGE_STYLES;
      break;
    case 'objectiveType':
      styles = OBJECTIVE_TYPE_BADGE_STYLES;
      break;
    case 'sessionStatus':
      styles = SESSION_STATUS_BADGE_STYLES;
      break;
    case 'userRole':
      styles = USER_ROLE_BADGE_STYLES;
      break;
    case 'appointmentStatus':
      styles = APPOINTMENT_STATUS_BADGE_STYLES;
      break;
    case 'clinicModality':
      styles = CLINIC_MODALITY_BADGE_STYLES;
      break;
    case 'paymentStatus':
      styles = PAYMENT_STATUS_BADGE_STYLES;
      break;
    case 'achievementLevel':
      styles = ACHIEVEMENT_LEVEL_BADGE_STYLES;
      break;
    case 'notificationStatus':
      styles = NOTIFICATION_STATUS_BADGE_STYLES;
      break;
    case 'clinicalEntryType':
      styles = CLINICAL_ENTRY_TYPE_BADGE_STYLES;
      break;
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: value };
  }
  return styles[value] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: value };
};

// Export all constants
export default {
  DIFFICULTY_BADGE_STYLES,
  PLAN_STATUS_BADGE_STYLES,
  OBJECTIVE_TYPE_BADGE_STYLES,
  SESSION_STATUS_BADGE_STYLES,
  USER_ROLE_BADGE_STYLES,
  APPOINTMENT_STATUS_BADGE_STYLES,
  CLINIC_MODALITY_BADGE_STYLES,
  PAYMENT_STATUS_BADGE_STYLES,
  ACHIEVEMENT_LEVEL_BADGE_STYLES,
  NOTIFICATION_STATUS_BADGE_STYLES,
  CLINICAL_ENTRY_TYPE_BADGE_STYLES,
  EXTENDED_ENTRY_TYPE_STYLES,
  ALL_ENTRY_TYPE_STYLES,
  UI_COLORS,
  getBadgeStyles,
};