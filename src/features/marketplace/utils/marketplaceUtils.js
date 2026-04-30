import logger from '@/lib/utils/logger';
import { USER_ROLES } from '@/constants/roles';

/**
 * Determina si un usuario tiene permiso para vender en el marketplace.
 * Requiere ser terapeuta y tener un plan de suscripción válido (Profesional o Centro).
 * @param {Object} user - El objeto de usuario/perfil actual.
 * @param {Object} subscription - El objeto de suscripción actual.
 * @returns {boolean}
 */
export const canSellInMarketplace = (user, subscription) => {
  if (!user) return false;
  
  // ONLY therapists are allowed to sell (no admin bypass)
  if (user.role !== USER_ROLES.THERAPIST) return false;
  logger.log('SUBSCRIPTION DATA:', JSON.stringify(subscription));
  const planStatus = checkPaymentStatus(subscription);
  const planType = checkSubscriptionPlan(subscription);

  return planStatus === 'active' && (planType === 'professional' || planType === 'clinic');
};

/**
 * Identifica el tipo de plan basado en el objeto de suscripción.
 * @param {Object} subscription 
 * @returns {string} 'free', 'professional', 'clinic', or 'unknown'
 */
export const checkSubscriptionPlan = (subscription) => {
  if (!subscription) return 'free';

  // Normalize plan name: lowercase, trimmed, no accents
  const planName = (
    subscription.plan_name ||
    subscription.plan?.name ||
    ''
  ).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (planName.includes('profesional') || planName.includes('pro')) return 'professional';
  if (planName.includes('centro') || planName.includes('clinic')) return 'clinic';
  if (planName.includes('pro')) return 'pro';
  if (planName.includes('free') || planName.includes('gratuito') || !planName) return 'free';

  return 'unknown';
};

/**
 * Verifica el estado del pago de la suscripción.
 * @param {Object} subscription 
 * @returns {string} 'active', 'inactive', 'past_due', 'canceled'
 */
export const checkPaymentStatus = (subscription) => {
  if (!subscription) return 'inactive';
  
  // Estados válidos para operar
  const validStatuses = ['active', 'trialing'];
  
  // Treat null/undefined current_period_end as NOT expired, relying only on status
  if (validStatuses.includes(subscription.status)) {
    return 'active';
  }
  
  return subscription.status || 'inactive';
};

/**
 * Obtiene las restricciones específicas y mensajes para el usuario.
 * @param {Object} user 
 * @param {Object} subscription 
 * @returns {Object} { isRestricted, reason, message, action }
 */
export const getMarketplaceRestrictions = (user, subscription) => {
  if (!user) return { 
    isRestricted: true, 
    reason: 'auth', 
    message: 'Debes iniciar sesión para vender.', 
    action: '/auth/login' 
  };

  // ONLY therapists are allowed to sell (no admin bypass)
  if (user.role !== USER_ROLES.THERAPIST) return {
    isRestricted: true,
    reason: 'role',
    message: 'Solo los odontólogos registrados pueden vender recursos.',
    action: '/register-therapist'
  };

  const planType = checkSubscriptionPlan(subscription);
  const paymentStatus = checkPaymentStatus(subscription);

  if (paymentStatus !== 'active') {
    return {
      isRestricted: true,
      reason: 'payment',
      message: 'Tu suscripción no está activa o hay un problema con el pago.',
      action: '/dashboard/membership'
    };
  }

  if (planType === 'free' || planType === 'pro') {
    return {
      isRestricted: true,
      reason: 'plan',
      message: 'Para vender en el Marketplace necesitas un Plan Profesional o Centro. ¡Mejora tu plan y comienza a generar ingresos!',
      action: '/dashboard/membership'
    };
  }

  return { isRestricted: false, reason: null, message: null, action: null };
};

/**
 * Formatea errores comunes del marketplace para mostrar al usuario.
 */
export const formatMarketplaceError = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  
  if (error.message?.includes('payment')) return 'Error de pago: Verifique su método de pago.';
  if (error.message?.includes('plan')) return 'Error de plan: Su plan no permite esta acción.';
  
  return error.message || 'Ha ocurrido un error inesperado.';
};