/**
 * @file src/constants/plans.js
 * 
 * SINGLE SOURCE OF TRUTH - Solo constantes, sin lógica
 * Cualquier cambio de precios, límites o features se hace aquí
 */

// ============================================
// PLAN IDENTIFIERS
// ============================================
export const PLAN_NAMES = {
  FREE: 'free',
  INDIVIDUAL: 'individual',
  PROFESSIONAL: 'profesional',
  CENTER: 'centro',
};

// ============================================
// ADD-ONS
// ============================================
export const ADD_ON_PIE = "pie_escolar";

// Orden jerárquico (para comparaciones)
export const PLAN_HIERARCHY = {
  [PLAN_NAMES.FREE]: 0,
  [PLAN_NAMES.INDIVIDUAL]: 1,
  [PLAN_NAMES.PROFESSIONAL]: 2,
  [PLAN_NAMES.CENTER]: 3,
};

// ============================================
// PRICING
// ============================================
export const PLAN_PRICING = {
  [PLAN_NAMES.FREE]: {
    id: 'free',
    name: 'Gratis',
    subtitle: 'Empieza',
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
    subtitle: 'Organízate',
    priceCLP: 25778,
    priceUSD: 29,
    priceCLPYearly: 257780, // 10 meses (2 gratis)
    priceUSDYearly: 290,
    color: 'blue',
    popular: false,
  },
  [PLAN_NAMES.PROFESSIONAL]: {
    id: 'profesional',
    name: 'Profesional',
    subtitle: 'Destaca',
    priceCLP: 52556,
    priceUSD: 59,
    priceCLPYearly: 525560,
    priceUSDYearly: 590,
    color: 'pink',
    popular: true,
  },
  [PLAN_NAMES.CENTER]: {
    id: 'centro',
    name: 'Centro de Salud',
    subtitle: 'Lidera',
    priceCLP: 88222,
    priceUSD: 99,
    priceCLPYearly: 882220,
    priceUSDYearly: 990,
    color: 'teal',
    popular: false,
  },
};

// ============================================
// LIMITS
// ============================================
export const PLAN_LIMITS = {
  [PLAN_NAMES.FREE]: {
    maxPatients: 5,
    maxUsers: 1,
    maxClinics: 1,
    maxStorageMB: 500,
  },
  [PLAN_NAMES.INDIVIDUAL]: {
    maxPatients: 30,
    maxUsers: 1,
    maxClinics: 1,
    maxStorageMB: 2000,
  },
  [PLAN_NAMES.PROFESSIONAL]: {
    maxPatients: Infinity,
    maxUsers: 2,
    maxClinics: 5,
    maxStorageMB: 10000,
  },
  [PLAN_NAMES.CENTER]: {
    maxPatients: Infinity,
    maxUsers: 5,
    maxClinics: Infinity,
    maxStorageMB: 50000,
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
    marketplaceBuy: true,
    marketplaceSell: false,
    saveMaterials: false,
    supportLevel: 'email',
  },
  [PLAN_NAMES.PROFESSIONAL]: {
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    emailReminders: true,
    whatsappReminders: true,
    metricsPanel: true,
    aiAssistant: true,
    aiReports: true,
    aiPlanGenerator: true,
    aiProgressAnalysis: true,
    landingPage: true,
    brandCustomization: true,
    customTemplates: true,
    multiClinic: true,
    marketplaceBuy: true,
    marketplaceSell: true,
    saveMaterials: true,
    supportLevel: 'whatsapp',
  },
  [PLAN_NAMES.CENTER]: {
    scheduling: true,
    clinicalHistory: true,
    basicReports: true,
    emailReminders: true,
    whatsappReminders: true,
    metricsPanel: true,
    aiAssistant: true,
    aiReports: true,
    aiPlanGenerator: true,
    aiProgressAnalysis: true,
    landingPage: true,
    brandCustomization: true,
    customTemplates: true,
    multiClinic: true,
    marketplaceBuy: true,
    marketplaceSell: true,
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
  whatsappReminders: {
    key: 'whatsappReminders',
    name: 'Recordatorios por WhatsApp',
    description: 'Envía recordatorios automáticos por WhatsApp',
    icon: 'MessageCircle',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
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
  marketplaceBuy: {
    key: 'marketplaceBuy',
    name: 'Marketplace (comprar)',
    description: 'Accede a materiales y plantillas del marketplace',
    icon: 'ShoppingBag',
    minimumPlan: PLAN_NAMES.INDIVIDUAL,
  },
  marketplaceSell: {
    key: 'marketplaceSell',
    name: 'Marketplace (vender)',
    description: 'Vende tus propios materiales y plantillas',
    icon: 'Store',
    minimumPlan: PLAN_NAMES.PROFESSIONAL,
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
