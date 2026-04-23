/**
 * @file src/constants/plans.js
 * 
 * SINGLE SOURCE OF TRUTH - Solo constantes, sin lógica
 * Cualquier cambio de precios, límites o features se hace aquí
 */

// ============================================
// PLAN IDENTIFIERS (spec 022 — 2026-04-22 update)
// ============================================
export const PLAN_NAMES = {
  FREE: 'free', // spec 022: AHORA se muestra en UI con límites 5 pacientes / 15 citas mes
  INDIVIDUAL: 'individual',
  CLINIC_PRO: 'clinic_pro',  // spec 022: nuevo slug (reemplaza PROFESSIONAL)
  CLINIC_PREMIUM: 'clinic_premium',  // spec 022: nuevo slug (reemplaza CENTER)
  // Legacy slugs preservados para backward compatibility con código que aún los referencia
  PROFESSIONAL: 'profesional', // DEPRECADO post-spec 022 — desactivado en DB
  CENTER: 'centro', // DEPRECADO post-spec 022
};

/**
 * Planes visibles en la UI — spec 022 tier model (4 planes)
 * Free ahora sí se muestra (con límites) como entry-level del funnel.
 */
export const VISIBLE_PLAN_NAMES = ['free', 'individual', 'clinic_pro', 'clinic_premium'];

// ============================================
// ADD-ONS
// ============================================
export const ADD_ON_PIE = "pie_escolar";

// Orden jerárquico (para comparaciones) — spec 022
export const PLAN_HIERARCHY = {
  [PLAN_NAMES.FREE]: 0,
  [PLAN_NAMES.INDIVIDUAL]: 1,
  [PLAN_NAMES.CLINIC_PRO]: 2,
  [PLAN_NAMES.CLINIC_PREMIUM]: 3,
  // Legacy aliases para backward compat
  [PLAN_NAMES.PROFESSIONAL]: 2,
  [PLAN_NAMES.CENTER]: 3,
};

// ============================================
// PRICING (spec 022 — valores oficiales DentalSpot pre-launch)
// Fuente de verdad real: DB subscription_plans. Estos constants son fallback + UI hints.
// Anual = mensual × 12 × 0.85 (15% descuento, spec 022 annual_discount_percent)
// ============================================
export const PLAN_PRICING = {
  [PLAN_NAMES.FREE]: {
    id: 'free',
    name: 'Free',
    subtitle: 'Empezá sin fricción',
    priceCLP: 0,
    priceUSD: 0,
    priceCLPYearly: 0,
    priceUSDYearly: 0,
    color: 'gray',
    popular: false,
  },
  [PLAN_NAMES.INDIVIDUAL]: {
    id: 'individual',
    name: 'Individual',
    subtitle: 'Dentista solo',
    priceCLP: 14990,
    priceUSD: 17,
    priceCLPYearly: 152898, // 14990 × 12 × 0.85
    priceUSDYearly: 173,
    color: 'blue',
    popular: false,
  },
  [PLAN_NAMES.CLINIC_PRO]: {
    id: 'clinic_pro',
    name: 'Clínica Pro',
    subtitle: 'Clínica con equipo',
    priceCLP: 24990,
    priceUSD: 28,
    priceCLPYearly: 254898, // 24990 × 12 × 0.85
    priceUSDYearly: 289,
    color: 'pink',
    popular: true,
  },
  [PLAN_NAMES.CLINIC_PREMIUM]: {
    id: 'clinic_premium',
    name: 'Clínica Premium',
    subtitle: 'Sin límites',
    priceCLP: 39990,
    priceUSD: 45,
    priceCLPYearly: 407898, // 39990 × 12 × 0.85
    priceUSDYearly: 459,
    color: 'teal',
    popular: false,
  },
  // Legacy aliases para backward compat con código que todavía referencia los slugs viejos
  [PLAN_NAMES.PROFESSIONAL]: {
    id: 'profesional',
    name: 'Profesional (legacy)',
    subtitle: 'Deprecado — ver Clínica Pro',
    priceCLP: 24990,
    priceUSD: 28,
    priceCLPYearly: 254898,
    priceUSDYearly: 289,
    color: 'pink',
    popular: false,
  },
  [PLAN_NAMES.CENTER]: {
    id: 'centro',
    name: 'Centro (legacy)',
    subtitle: 'Deprecado — ver Clínica Premium',
    priceCLP: 39990,
    priceUSD: 45,
    priceCLPYearly: 407898,
    priceUSDYearly: 459,
    color: 'teal',
    popular: false,
  },
};

// ============================================
// LIMITS (spec 022 — tier model)
// maxDentists + maxBoxes nuevos campos
// Source of truth real: DB subscription_plans.max_dentists/max_boxes/patient_limit/appointment_limit
// ============================================
export const PLAN_LIMITS = {
  [PLAN_NAMES.FREE]: {
    maxPatients: 5,
    maxAppointmentsMonth: 15,  // spec 022
    maxDentists: 1,  // spec 022
    maxBoxes: 0,  // spec 022 (enforcement diferido)
    maxUsers: 1,
    maxClinics: 1,
    maxStorageMB: 500,
  },
  [PLAN_NAMES.INDIVIDUAL]: {
    maxPatients: Infinity,  // spec 022
    maxAppointmentsMonth: Infinity,
    maxDentists: 1,
    maxBoxes: 1,
    maxUsers: 1,
    maxClinics: 1,
    maxStorageMB: 2000,
  },
  [PLAN_NAMES.CLINIC_PRO]: {
    maxPatients: Infinity,
    maxAppointmentsMonth: Infinity,
    maxDentists: 5,
    maxBoxes: 3,
    maxUsers: 5,
    maxClinics: 1,
    maxStorageMB: 10000,
  },
  [PLAN_NAMES.CLINIC_PREMIUM]: {
    maxPatients: Infinity,
    maxAppointmentsMonth: Infinity,
    maxDentists: Infinity,
    maxBoxes: Infinity,
    maxUsers: Infinity,
    maxClinics: Infinity,
    maxStorageMB: 50000,
  },
  // Legacy aliases
  [PLAN_NAMES.PROFESSIONAL]: {
    maxPatients: Infinity, maxAppointmentsMonth: Infinity, maxDentists: 5, maxBoxes: 3,
    maxUsers: 2, maxClinics: 5, maxStorageMB: 10000,
  },
  [PLAN_NAMES.CENTER]: {
    maxPatients: Infinity, maxAppointmentsMonth: Infinity, maxDentists: Infinity, maxBoxes: Infinity,
    maxUsers: 5, maxClinics: Infinity, maxStorageMB: 50000,
  },
};

// ============================================
// FEATURES
// true = incluido, false = no incluido, 'limited' = acceso limitado
// ============================================
export const PLAN_FEATURES = {
  [PLAN_NAMES.FREE]: {
    // Gestión básica
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    // Recordatorios
    emailReminders: false,
    whatsappReminders: false,
    // Métricas
    metricsPanel: false,
    // IA
    aiAssistant: 'limited',
    aiReports: false,
    aiPlanGenerator: false,
    aiProgressAnalysis: false,
    // Personalización
    landingPage: false,
    brandCustomization: false,
    customTemplates: false,
    // Multi-clínica
    multiClinic: false,
    // Marketplace
    marketplaceBuy: false,
    marketplaceSell: false,
    // Materiales
    saveMaterials: false,
    // Soporte
    supportLevel: 'email',
  },
  [PLAN_NAMES.INDIVIDUAL]: {
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    emailReminders: true,
    whatsappReminders: false,
    metricsPanel: true,
    aiAssistant: true,
    aiReports: false,
    aiPlanGenerator: false,
    aiProgressAnalysis: false,
    landingPage: true,
    brandCustomization: true,
    customTemplates: false,
    multiClinic: false,
    // marketplaceBuy: diferido — ver docs/product/feature-backlog.md §Marketplace
    marketplaceBuy: false,
    marketplaceSell: false,
    saveMaterials: false,
    supportLevel: 'email',
  },
  [PLAN_NAMES.PROFESSIONAL]: {
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    emailReminders: true,
    // whatsappReminders: diferido — ver docs/product/feature-backlog.md §WhatsApp
    whatsappReminders: false,
    metricsPanel: true,
    aiAssistant: true,
    aiReports: true,
    aiPlanGenerator: true,
    aiProgressAnalysis: true,
    landingPage: true,
    brandCustomization: true,
    customTemplates: true,
    multiClinic: true,
    // marketplaceBuy/Sell: diferido — ver docs/product/feature-backlog.md §Marketplace
    marketplaceBuy: false,
    marketplaceSell: false,
    saveMaterials: true,
    supportLevel: 'priority',
  },
  [PLAN_NAMES.CENTER]: {
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    emailReminders: true,
    // whatsappReminders: diferido — ver docs/product/feature-backlog.md §WhatsApp
    whatsappReminders: false,
    metricsPanel: true,
    aiAssistant: true,
    aiReports: true,
    aiPlanGenerator: true,
    aiProgressAnalysis: true,
    landingPage: true,
    brandCustomization: true,
    customTemplates: true,
    multiClinic: true,
    // marketplaceBuy/Sell: diferido — ver docs/product/feature-backlog.md §Marketplace
    marketplaceBuy: false,
    marketplaceSell: false,
    saveMaterials: true,
    supportLevel: 'vip',
    // Extras Centro
    roleManagement: true,
    consolidatedReports: true,
    dedicatedOnboarding: true,
  },
};

// ============================================
// FEATURE METADATA (para UI)
// ============================================
export const FEATURE_INFO = {
  scheduling: {
    key: 'scheduling',
    name: 'Agendamiento de sesiones',
    description: 'Agenda y gestiona las citas con tus pacientes',
    icon: 'Calendar',
  },
  clinicalHistory: {
    key: 'clinicalHistory',
    name: 'Historial clínico digital',
    description: 'Registro completo del historial de cada paciente',
    icon: 'FileText',
  },
  basicReports: {
    key: 'basicReports',
    name: 'Generación de informes',
    description: 'Crea informes clínicos con plantillas',
    icon: 'FileText',
  },
  emailReminders: {
    key: 'emailReminders',
    name: 'Recordatorios por email',
    description: 'Envía recordatorios automáticos por correo',
    icon: 'Mail',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
  },
  // DIFERIDO (2026-04-23): ver docs/product/feature-backlog.md §WhatsApp.
  // Feature mantiene definición para que el código que la referencia no rompa,
  // pero PLAN_FEATURES la tiene en `false` en todos los planes. No ofrecer en UI.
  whatsappReminders: {
    key: 'whatsappReminders',
    name: 'Recordatorios por WhatsApp',
    description: 'Envía recordatorios automáticos por WhatsApp',
    icon: 'MessageCircle',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
    deferred: true,
  },
  metricsPanel: {
    key: 'metricsPanel',
    name: 'Panel de métricas',
    description: 'Visualiza estadísticas de tu consulta',
    icon: 'BarChart3',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
  },
  aiAssistant: {
    key: 'aiAssistant',
    name: 'Asistente virtual IA',
    description: 'Chat con IA para resolver dudas clínicas',
    icon: 'Bot',
  },
  aiReports: {
    key: 'aiReports',
    name: 'Informes con IA (Notiz)',
    description: 'Genera informes automáticos con inteligencia artificial',
    icon: 'Sparkles',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
    addOnPrice: 29990,
  },
  aiPlanGenerator: {
    key: 'aiPlanGenerator',
    name: 'Generador de planes con IA',
    description: 'Crea planes de tratamiento personalizados con IA',
    icon: 'Brain',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
    addOnPrice: 29990,
  },
  aiProgressAnalysis: {
    key: 'aiProgressAnalysis',
    name: 'Análisis de progreso con IA',
    description: 'Analiza el progreso de tus pacientes automáticamente',
    icon: 'TrendingUp',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
  },
  landingPage: {
    key: 'landingPage',
    name: 'Landing page personalizada',
    description: 'Tu propia página web profesional',
    icon: 'Globe',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
  },
  brandCustomization: {
    key: 'brandCustomization',
    name: 'Personalización de marca',
    description: 'Añade tu logo y colores corporativos',
    icon: 'Palette',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
  },
  customTemplates: {
    key: 'customTemplates',
    name: 'Plantillas personalizables',
    description: 'Crea y personaliza plantillas de evaluación',
    icon: 'Layout',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
  },
  multiClinic: {
    key: 'multiClinic',
    name: 'Multiclínica',
    description: 'Gestiona múltiples lugares de trabajo',
    icon: 'Building2',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
  },
  // DIFERIDO (2026-04-23): ver docs/product/feature-backlog.md §Marketplace.
  // MVP DentalSpot no habilita marketplace (sólo cobros dentista→DentalSpot).
  // Las rutas siguen existiendo tras PlanGuard; la feature queda en false en
  // todos los planes para que no se muestre en UI de pricing/upgrade.
  marketplaceBuy: {
    key: 'marketplaceBuy',
    name: 'Marketplace (comprar)',
    description: 'Accede a materiales y plantillas del marketplace',
    icon: 'ShoppingBag',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
    deferred: true,
  },
  marketplaceSell: {
    key: 'marketplaceSell',
    name: 'Marketplace (vender)',
    description: 'Vende tus propios materiales y plantillas',
    icon: 'Store',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
    deferred: true,
  },
  saveMaterials: {
    key: 'saveMaterials',
    name: 'Guardar materiales',
    description: 'Guarda materiales para usar en planes de trabajo',
    icon: 'Bookmark',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
  },
};

// ============================================
// ROLES QUE PUEDEN TENER SUSCRIPCIÓN
// ============================================
export const SUBSCRIPTION_ROLES = ['therapist', 'clinic', 'admin'];

// ============================================
// CLINIC VOLUME DISCOUNTS
// ============================================
export const CLINIC_DISCOUNT_TIERS = [
  { minTherapists: 1, maxTherapists: 2, discount: 0, label: 'Sin descuento' },
  { minTherapists: 3, maxTherapists: 5, discount: 0.20, label: '20% descuento' },
  { minTherapists: 6, maxTherapists: 10, discount: 0.35, label: '35% descuento' },
  { minTherapists: 11, maxTherapists: Infinity, discount: 0.50, label: '50% descuento' },
];

export const getClinicDiscount = (therapistCount) => {
  const tier = CLINIC_DISCOUNT_TIERS.find(
    t => therapistCount >= t.minTherapists && therapistCount <= t.maxTherapists
  );
  return tier || CLINIC_DISCOUNT_TIERS[0];
};

export const calculateDiscountedPrice = (basePriceCLP, therapistCount) => {
  const tier = getClinicDiscount(therapistCount);
  return Math.round(basePriceCLP * (1 - tier.discount));
};
