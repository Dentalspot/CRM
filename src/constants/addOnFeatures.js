/**
 * @file src/constants/addOnFeatures.js
 * Configuration for additional features (Add-ons) that can be purchased separately.
 */

export const ADD_ON_CONFIG = {
  notiz: {
    id: 'notiz',
    name: 'Notiz - Informes con IA',
    description: 'Genera informes clínicos automáticos con IA basados en notas de sesión',
    price: 29990,
    currency: 'CLP',
    billingCycle: 'monthly',
    features: [
      'Generación automática de informes',
      'Análisis de progreso con IA',
      'Exportar a PDF',
      'Historial de informes'
    ],
    icon: 'Sparkles'
  },
  planGenerator: {
    id: 'planGenerator',
    name: 'Generador de Planes IA',
    description: 'Crea planes de tratamiento personalizados con inteligencia artificial',
    price: 29990,
    currency: 'CLP',
    billingCycle: 'monthly',
    features: [
      'Planes basados en diagnóstico',
      'Objetivos automáticos',
      'Sesiones sugeridas',
      'Adaptación inteligente'
    ],
    icon: 'Brain'
  },
  educator: {
    id: 'educator',
    name: 'Educador DentalSpot',
    description: 'Crea y vende cursos, talleres y certificaciones para otros odontólogos',
    price: 19990,
    currency: 'CLP',
    billingCycle: 'monthly',
    features: [
      'Crear cursos vivos y grabados',
      'Dashboard de instructor con métricas',
      'Certificados automáticos para alumnos',
      'Puntos DentalLevel por docencia',
      'Ventas directas a tu wallet'
    ],
    icon: 'GraduationCap'
  },
};