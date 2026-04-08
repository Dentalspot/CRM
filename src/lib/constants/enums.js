/**
 * Database ENUMs Constants
 * Centralizes all ENUM values used across the application and database
 */

// Difficulty Levels (difficulty enum)
export const DIFFICULTY_LEVELS = {
  MUY_FACIL: 'muy_facil',
  FACIL: 'facil',
  ADECUADO: 'adecuado',
  DIFICIL: 'dificil',
  MUY_DIFICIL: 'muy_dificil'
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.MUY_FACIL]: 'Muy Fácil',
  [DIFFICULTY_LEVELS.FACIL]: 'Fácil',
  [DIFFICULTY_LEVELS.ADECUADO]: 'Adecuado',
  [DIFFICULTY_LEVELS.DIFICIL]: 'Difícil',
  [DIFFICULTY_LEVELS.MUY_DIFICIL]: 'Muy Difícil'
};

// Plan Status
export const PLAN_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

export const PLAN_STATUS_LABELS = {
  [PLAN_STATUS.ACTIVE]: 'Activo',
  [PLAN_STATUS.COMPLETED]: 'Completado',
  [PLAN_STATUS.PAUSED]: 'Pausado',
  [PLAN_STATUS.CANCELLED]: 'Cancelado'
};

// Objective Types (goal_type enum)
export const OBJECTIVE_TYPES = {
  SPECIFIC: 'specific',
  GENERAL: 'general',
  FUNCTIONAL: 'functional'
};

export const OBJECTIVE_TYPE_LABELS = {
  [OBJECTIVE_TYPES.SPECIFIC]: 'Específico',
  [OBJECTIVE_TYPES.GENERAL]: 'General',
  [OBJECTIVE_TYPES.FUNCTIONAL]: 'Funcional'
};

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  PENDING: 'pending'
};

export const SESSION_STATUS_LABELS = {
  [SESSION_STATUS.SCHEDULED]: 'Programada',
  [SESSION_STATUS.COMPLETED]: 'Completada',
  [SESSION_STATUS.CANCELLED]: 'Cancelada',
  [SESSION_STATUS.RESCHEDULED]: 'Reprogramada',
  [SESSION_STATUS.PENDING]: 'Pendiente'
};

// User Roles (user_role enum)
export const USER_ROLES = {
  THERAPIST: 'therapist',
  ADMIN: 'admin',
  PATIENT: 'patient',
  CLINIC: 'clinic'
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.THERAPIST]: 'Terapeuta',
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.PATIENT]: 'Paciente',
  [USER_ROLES.CLINIC]: 'Clínica'
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  PENDING_CONFIRMATION: 'pending_confirmation'
};

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'Agendada',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmada',
  [APPOINTMENT_STATUS.COMPLETED]: 'Completada',
  [APPOINTMENT_STATUS.CANCELLED]: 'Cancelada',
  [APPOINTMENT_STATUS.NO_SHOW]: 'No asistió',
  [APPOINTMENT_STATUS.PENDING_CONFIRMATION]: 'Pendiente de confirmación'
};

// Clinic Modality (clinic_attendance_modality enum)
export const CLINIC_MODALITY = {
  PRESENCIAL: 'presencial',
  ONLINE: 'online',
  AMBAS: 'ambas'
};

export const CLINIC_MODALITY_LABELS = {
  [CLINIC_MODALITY.PRESENCIAL]: 'Presencial',
  [CLINIC_MODALITY.ONLINE]: 'Online',
  [CLINIC_MODALITY.AMBAS]: 'Ambas'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pendiente',
  [PAYMENT_STATUS.PAID]: 'Pagado',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
  [PAYMENT_STATUS.REFUNDED]: 'Reembolsado'
};

// Day of Week (day_of_week enum)
export const DAY_OF_WEEK = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo'
};

export const DAY_OF_WEEK_NUMBERS = {
  [DAY_OF_WEEK.DOMINGO]: 0,
  [DAY_OF_WEEK.LUNES]: 1,
  [DAY_OF_WEEK.MARTES]: 2,
  [DAY_OF_WEEK.MIERCOLES]: 3,
  [DAY_OF_WEEK.JUEVES]: 4,
  [DAY_OF_WEEK.VIERNES]: 5,
  [DAY_OF_WEEK.SABADO]: 6
};

// Clinical Entry Types
export const CLINICAL_ENTRY_TYPES = {
  SESION: 'sesion',
  EVALUACION: 'evaluacion',
  DIAGNOSTICO: 'diagnostico',
  INFORME: 'informe',
  NOTA: 'nota'
};

export const CLINICAL_ENTRY_TYPE_LABELS = {
  [CLINICAL_ENTRY_TYPES.SESION]: 'Sesión',
  [CLINICAL_ENTRY_TYPES.EVALUACION]: 'Evaluación',
  [CLINICAL_ENTRY_TYPES.DIAGNOSTICO]: 'Diagnóstico',
  [CLINICAL_ENTRY_TYPES.INFORME]: 'Informe',
  [CLINICAL_ENTRY_TYPES.NOTA]: 'Nota'
};

// Product Types
export const PRODUCT_TYPES = {
  DIGITAL: 'digital',
  PHYSICAL: 'physical',
  COURSE: 'course',
  TEMPLATE: 'template'
};

export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.DIGITAL]: 'Digital',
  [PRODUCT_TYPES.PHYSICAL]: 'Físico',
  [PRODUCT_TYPES.COURSE]: 'Curso',
  [PRODUCT_TYPES.TEMPLATE]: 'Plantilla'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  NEW_REVIEW: 'new_review',
  SYSTEM: 'system',
  MESSAGE: 'message'
};

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: 'Recordatorio de cita',
  [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: 'Cita cancelada',
  [NOTIFICATION_TYPES.NEW_REVIEW]: 'Nueva reseña',
  [NOTIFICATION_TYPES.SYSTEM]: 'Sistema',
  [NOTIFICATION_TYPES.MESSAGE]: 'Mensaje'
};

// Notification Status
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  READ: 'read',
  FAILED: 'failed'
};

export const NOTIFICATION_STATUS_LABELS = {
  [NOTIFICATION_STATUS.PENDING]: 'Pendiente',
  [NOTIFICATION_STATUS.SENT]: 'Enviado',
  [NOTIFICATION_STATUS.READ]: 'Leído',
  [NOTIFICATION_STATUS.FAILED]: 'Fallido'
};

// Achievement Levels (for activities)
export const ACHIEVEMENT_LEVELS = {
  NO_LOGRADO: 'no_logrado',
  EN_PROCESO: 'en_proceso',
  LOGRADO: 'logrado',
  SUPERADO: 'superado'
};

export const ACHIEVEMENT_LEVEL_LABELS = {
  [ACHIEVEMENT_LEVELS.NO_LOGRADO]: 'No logrado',
  [ACHIEVEMENT_LEVELS.EN_PROCESO]: 'En proceso',
  [ACHIEVEMENT_LEVELS.LOGRADO]: 'Logrado',
  [ACHIEVEMENT_LEVELS.SUPERADO]: 'Superado'
};

// Helper functions
export const getEnumLabel = (enumObject, labelsObject, value) => {
  return labelsObject[value] || value;
};

export const getEnumOptions = (enumObject, labelsObject) => {
  return Object.values(enumObject).map(value => ({
    value,
    label: labelsObject[value]
  }));
};

// Agregar a enums.js:
export const REPORT_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  SIGNED: 'signed',
  // Verificar valores reales en BD
};

// Export all for easy access
export default {
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  PLAN_STATUS,
  PLAN_STATUS_LABELS,
  OBJECTIVE_TYPES,
  OBJECTIVE_TYPE_LABELS,
  SESSION_STATUS,
  SESSION_STATUS_LABELS,
  USER_ROLES,
  USER_ROLE_LABELS,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABELS,
  CLINIC_MODALITY,
  CLINIC_MODALITY_LABELS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  DAY_OF_WEEK,
  DAY_OF_WEEK_NUMBERS,
  CLINICAL_ENTRY_TYPES,
  CLINICAL_ENTRY_TYPE_LABELS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_LABELS,
  ACHIEVEMENT_LEVELS,
  ACHIEVEMENT_LEVEL_LABELS,
  getEnumLabel,
  getEnumOptions
};