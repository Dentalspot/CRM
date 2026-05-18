
/**
 * @file src/features/admin/permissions/permissionMap.js
 * 
 * SINGLE SOURCE OF TRUTH para módulos admin del frontend.
 * Los keys DEBEN coincidir con la columna 'module' de admin_permissions en Supabase.
 * 
 * Módulos en DB: blog, qa, moderation, clinical_files, patients, patients_management,
 * demographics, payments, subscriptions, coupons, memberships, marketplace, sales,
 * commissions, withdrawals, support, ai_tools, faq, specialties, dentallevel, legal, all
 */

import {
  FileText,
  MessageCircle,
  Shield,
  ClipboardList,
  Users,
  UserCog,
  MapPin,
  CreditCard,
  Receipt,
  Ticket,
  BadgeCheck,
  Store,
  TrendingUp,
  DollarSign,
  Wallet,
  Package,
  Phone,
  Bot,
  HelpCircle,
  Award,
  Star,
  Scale,
  HeartHandshake,
  Building,
  KanbanSquare,
  Send,
  Zap,
  BarChart3,
  Terminal,
  Settings,
  Cpu,
  Rocket,
  Facebook,
} from 'lucide-react';

/**
 * @typedef {'read' | 'write'} PermissionAction
 *
 * @typedef {Object} PermissionModule
 * @property {string} label - Nombre para mostrar en UI
 * @property {string} description - Descripción del módulo
 * @property {React.ElementType} icon - Icono Lucide
 * @property {string[]} routes - Rutas admin asociadas
 * @property {string} [group] - Grupo para organizar en sidebar
 */

/** @type {Object.<string, PermissionModule>} */
export const permissionMap = {
  // ============================================
  // CONTENIDO
  // ============================================
  blog: {
    label: 'Blog',
    description: 'Gestión de artículos y categorías del blog.',
    icon: FileText,
    routes: ['/admin/blog', '/admin/blog/categories'],
    group: 'content',
  },
  qa: {
    label: 'Preguntas y Respuestas',
    description: 'Gestión de Q&A y categorías.',
    icon: MessageCircle,
    routes: ['/admin/qa', '/admin/qa/categories'],
    group: 'content',
  },
  publications: {
    label: 'Publicaciones',
    description: 'Artículos publicados y pendientes de revisión.',
    icon: FileText,
    routes: ['/admin/blog/list'],
    group: 'content',
  },

  // ============================================
  // PACIENTES & FICHAS CLÍNICAS
  // ============================================
  patients: {
    label: 'Pacientes',
    description: 'Vista general de pacientes de la plataforma.',
    icon: Users,
    routes: ['/admin/patients'],
    group: 'clinical',
  },
  patients_management: {
    label: 'Gestión de Pacientes',
    description: 'Administración avanzada de pacientes.',
    icon: UserCog,
    routes: ['/admin/patients/management'],
    group: 'clinical',
  },
  clinical_files: {
    label: 'Fichas Clínicas',
    description: 'Auditoría y supervisión de fichas clínicas.',
    icon: ClipboardList,
    routes: ['/admin/patients/clinical-files', '/admin/patients/:id/clinical-file'],
    group: 'clinical',
  },
  demographics: {
    label: 'Demografía',
    description: 'Estadísticas demográficas y análisis poblacional.',
    icon: MapPin,
    routes: ['/admin/patients/stats'],
    group: 'clinical',
  },
  clinical_history: {
    label: 'Historial Clínico',
    description: 'Gobernanza, trazabilidad y auditoría de registros clínicos.',
    icon: Shield,
    routes: ['/admin/clinical-history'],
    group: 'clinical',
  },

  // ============================================
  // FACTURACIÓN (orden: Membresías → Suscripciones → Cupones → Planes)
  // ============================================
  memberships: {
    label: 'Membresías',
    description: 'Dashboard de facturación y membresías.',
    icon: BadgeCheck,
    routes: ['/admin/billing'],
    group: 'billing',
  },
  payments: {
    label: 'Suscripciones',
    description: 'Gestión de suscripciones activas y pagos.',
    icon: CreditCard,
    routes: ['/admin/billing/subscriptions', '/admin/billing/payments'],
    group: 'billing',
  },
  signup_approvals: {
    label: 'Aprobaciones',
    description: 'Aprobar o rechazar registros de dentistas y clínicas nuevos.',
    icon: Shield,
    routes: ['/admin/signup-approvals'],
    group: 'billing',
  },
  coupons: {
    label: 'Cupones',
    description: 'Cupones de descuento para membresías.',
    icon: Ticket,
    routes: ['/admin/billing/coupons'],
    group: 'billing',
  },
  plans: {
    label: 'Planes',
    description: 'Configuración de planes de suscripción.',
    icon: Receipt,
    routes: ['/admin/billing/plans'],
    group: 'billing',
  },
  directory: {
    label: 'Directorio',
    description: 'Dentistas registrados, planes activos y clínicas.',
    icon: Users,
    routes: ['/admin/billing/directory'],
    group: 'billing',
  },

  // ============================================
  // MARKETPLACE
  // ============================================
  marketplace: {
    label: 'Marketplace',
    description: 'Dashboard general del marketplace.',
    icon: Store,
    routes: ['/admin/marketplace'],
    group: 'marketplace',
  },
  marketplace_products: {
    label: 'Productos',
    description: 'Moderación y aprobación de productos.',
    icon: Package,
    routes: ['/admin/marketplace/products'],
    group: 'marketplace',
  },
  sales: {
    label: 'Ventas y Comisiones',
    description: 'Historial de ventas y comisiones de la plataforma.',
    icon: TrendingUp,
    routes: ['/admin/marketplace/sales', '/admin/marketplace/commissions'],
    group: 'marketplace',
  },
  marketplace_coupons: {
    label: 'Cupones',
    description: 'Gestión de cupones de descuento.',
    icon: Ticket,
    routes: ['/admin/marketplace/coupons'],
    group: 'marketplace',
  },
  withdrawals: {
    label: 'Retiros',
    description: 'Gestión de solicitudes de retiro de fondos.',
    icon: Wallet,
    routes: ['/admin/marketplace/withdrawals'],
    group: 'marketplace',
  },

  // ============================================
  // SOPORTE & HERRAMIENTAS
  // ============================================
  support: {
    label: 'Soporte',
    description: 'Búsqueda de usuarios, tickets, logs e incidencias.',
    icon: Phone,
    routes: ['/admin/support'],
    group: 'tools',
  },
  therapists: {
    label: 'Dentistas',
    description: 'Gestión de dentistas registrados.',
    icon: Users,
    routes: ['/admin/therapists'],
    group: 'tools',
  },
  clinics: {
    label: 'Clínicas',
    description: 'Gestión de clínicas registradas.',
    icon: Building,
    routes: ['/admin/clinics'],
    group: 'tools',
  },
  ai_tools: {
    label: 'Herramientas IA',
    description: 'Gestión de herramientas de inteligencia artificial.',
    icon: Bot,
    routes: ['/admin/ai-tools'],
    group: 'tools',
  },
  ai_playground: {
    label: 'IA Playground',
    description: 'Probar inferencia en vivo con edge functions.',
    icon: Terminal,
    routes: ['/admin/ai-tools/playground'],
    group: 'tools',
  },
  ai_models: {
    label: 'IA Modelos',
    description: 'Configuracion de modelos, temperaturas y tokens.',
    icon: Cpu,
    routes: ['/admin/ai-tools/models'],
    group: 'tools',
  },
  ai_prompts: {
    label: 'IA Prompts',
    description: 'Ingenieria de prompts y configuracion de templates.',
    icon: FileText,
    routes: ['/admin/ai-tools/prompts'],
    group: 'tools',
  },
  faq: {
    label: 'FAQ',
    description: 'Gestión de preguntas frecuentes.',
    icon: HelpCircle,
    routes: ['/admin/faq-management'],
    group: 'tools',
  },

  // ============================================
  // DENTALLEVEL & ESPECIALIDADES
  // ============================================
  specialties: {
    label: 'Especialidades',
    description: 'Gestión de especialidades odontológicas.',
    icon: Award,
    routes: ['/admin/especialidades'],
    group: 'dentallevel',
  },
  dentallevel: {
    label: 'DentalLevel',
    description: 'Sistema de reputación y niveles profesionales.',
    icon: Star,
    routes: ['/admin/dentallevel'],
    group: 'dentallevel',
  },

  feedback: {
    label: 'Feedback',
    description: 'Opiniones y valoraciones de usuarios sobre la plataforma.',
    icon: MessageCircle,
    routes: ['/admin/feedback'],
    group: 'tools',
  },

  // ============================================
  // GESTIÓN DE USUARIOS (debug@dentalspot.cl)
  // ============================================
  therapists: {
    label: 'Dentistas',
    description: 'Gestión de perfiles y cuentas de dentistas.',
    icon: HeartHandshake,
    routes: ['/admin/therapists'],
    group: 'tools',
  },
  clinics: {
    label: 'Clínicas',
    description: 'Administración de clínicas y sus asociaciones.',
    icon: Building,
    routes: ['/admin/clinics'],
    group: 'tools',
  },

  // ============================================
  // LEGAL
  // ============================================
  legal: {
    label: 'Legal',
    description: 'Dashboard de gobierno normativo y cumplimiento.',
    icon: Scale,
    routes: ['/admin/legal', '/admin/legal/documents', '/admin/legal/policies', '/admin/legal/signatures', '/admin/legal/compliance', '/admin/legal/disputes', '/admin/legal/risks', '/admin/legal/settings'],
    group: 'legal',
  },
  arco: {
    label: 'Derechos ARCO',
    description: 'Solicitudes de Acceso, Rectificación, Cancelación y Oposición.',
    icon: Shield,
    routes: ['/admin/legal/arco'],
    group: 'legal',
  },
  cookie_consents: {
    label: 'Cookies',
    description: 'Registro de consentimiento de cookies para auditoría.',
    icon: Shield,
    routes: ['/admin/legal/cookie-consents'],
    group: 'legal',
  },

  // ============================================
  // MARKETING
  // ============================================
  marketing: {
    label: 'Dashboard',
    description: 'Panel principal de marketing con metricas.',
    icon: TrendingUp,
    routes: ['/admin/marketing'],
    group: 'marketing_admin',
  },
  marketing_mission_control: {
    label: 'Mission Control',
    description: 'Centro de comando, estado de integraciones y operaciones.',
    icon: Rocket,
    routes: ['/admin/marketing/mission-control'],
    group: 'marketing_admin',
  },
  marketing_meta_ads: {
    label: 'Meta Ads',
    description: 'Gestionar campanas, anuncios y audiencias de Meta.',
    icon: Facebook,
    routes: ['/admin/marketing/meta-ads'],
    group: 'marketing_admin',
  },
  marketing_kanban: {
    label: 'Kanban',
    description: 'Pipeline de leads con drag and drop.',
    icon: KanbanSquare,
    routes: ['/admin/marketing/kanban'],
    group: 'marketing_admin',
  },
  marketing_audience: {
    label: 'Audiencia',
    description: 'Gestion de contactos, segmentacion y busqueda.',
    icon: Users,
    routes: ['/admin/marketing/audience'],
    group: 'marketing_admin',
  },
  marketing_campaigns: {
    label: 'Campanas',
    description: 'Embudos de email, secuencias y envio masivo.',
    icon: Send,
    routes: ['/admin/marketing/campaigns'],
    group: 'marketing_admin',
  },
  marketing_automation: {
    label: 'Automatizacion',
    description: 'Workflows automaticos y triggers de email.',
    icon: Zap,
    routes: ['/admin/marketing/automation'],
    group: 'marketing_admin',
  },
  marketing_analytics: {
    label: 'Analytics',
    description: 'Metricas de campanas, aperturas y conversiones.',
    icon: BarChart3,
    routes: ['/admin/marketing/analytics'],
    group: 'marketing_admin',
  },
};

// ============================================
// GRUPOS para organizar sidebar
// ============================================
export const MODULE_GROUPS = {
  content: { label: 'Contenido', order: 1 },
  clinical: { label: 'Clínico', order: 2 },
  billing: { label: 'Facturación', order: 3 },
  marketplace: { label: 'Marketplace', order: 4 },
  marketing_admin: { label: 'Marketing', order: 5 },
  tools: { label: 'Herramientas', order: 6 },
  dentallevel: { label: 'DentalLevel', order: 7 },
  legal: { label: 'Legal', order: 8 },
};

// ============================================
// HELPERS
// ============================================

/**
 * Encuentra el módulo asociado a una ruta
 * @param {string} route
 * @returns {string | undefined}
 */
export function getModuleByRoute(route) {
  for (const moduleName in permissionMap) {
    if (permissionMap[moduleName].routes.some(r => {
      // Soportar rutas con parámetros (:id)
      const pattern = r.replace(/:[\w]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(route) || route.startsWith(r.split(':')[0]);
    })) {
      return moduleName;
    }
  }
  return undefined;
}

/**
 * Obtiene todos los módulos de un grupo
 * @param {string} group
 * @returns {Array<{ key: string, ...PermissionModule }>}
 */
export function getModulesByGroup(group) {
  return Object.entries(permissionMap)
    .filter(([_, mod]) => mod.group === group)
    .map(([key, mod]) => ({ key, ...mod }));
}

/**
 * Obtiene todos los keys de módulos
 * @returns {string[]}
 */
export function getAllModules() {
  return Object.keys(permissionMap);
}
