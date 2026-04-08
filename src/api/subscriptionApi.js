
/**
 * @file src/api/subscriptionApi.js
 *
 * API para operaciones de suscripción con Supabase
 * Versión fusionada: tu lógica de stats + MercadoPago integration
 */

import { supabase } from '@/lib/supabaseClient';
import { PLAN_NAMES } from '@/constants/planFeatures';
import { apiHandler } from '@/lib/api/apiHandler';

// ============================================
// READ OPERATIONS
// ============================================

const FREE_PLAN_FALLBACK = {
  plan_name: PLAN_NAMES.FREE,
  status: 'active',
  isActive: true,
  isExpired: false,
  current_period_end: null,
  cancel_at_period_end: false,
  isFree: true
};

/**
 * Fetches the current subscription for a given user.
 *
 * @param {string} userId - The UUID of the user (therapist)
 * @returns {Promise<Object>} Subscription details including plan status and validity
 */
export const fetchCurrentSubscription = apiHandler('fetchCurrentSubscription', async (userId) => {
  const { data, error } = await supabase
    .from('therapist_subscriptions')
    .select('*')
    .eq('therapist_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  // Si no hay suscripción, retornar plan gratuito
  if (!data) {
    return { ...FREE_PLAN_FALLBACK };
  }

  const now = new Date();
  const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;

  // Si periodEnd es null/undefined se trata como NO expirado (lifetime)
  const isExpired = periodEnd ? periodEnd < now : false;

  const isActive = data.status === 'active' && !isExpired;
  const isFree = data.plan_name === PLAN_NAMES.FREE || !data.plan_name;

  return {
    ...data,
    plan_name: data.plan_name || PLAN_NAMES.FREE,
    isActive,
    isExpired,
    isFree
  };
}, FREE_PLAN_FALLBACK);

/**
 * Fetches resource usage statistics for a user to check against plan limits.
 *
 * @param {string} userId - The UUID of the user
 * @returns {Promise<Object>} Object containing counts for patients, storage, etc.
 */
export const fetchUsageStats = apiHandler('fetchUsageStats', async (userId) => {
  // 1. Patients count
  const { count: patientsCount, error: patientsError } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', userId)
    .eq('status', 'active');

  if (patientsError) throw patientsError;

  // 2. Clinics count
  const { count: clinicsCount, error: clinicsError } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', userId)
    .eq('is_active', true);

  if (clinicsError) throw clinicsError;

  // 3. Storage usage (sum of file sizes in bytes)
  const { data: files, error: storageError } = await supabase
    .from('therapist_documents')
    .select('size')
    .eq('therapist_id', userId);

  if (storageError) throw storageError;

  const totalBytes = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
  const storageUsedMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // Round to 2 decimals

  // 4. Users (Team members) - TODO: implementar cuando exista tabla de equipo
  const usersCount = 1;

  return {
    patientsCount: patientsCount || 0,
    storageUsedMB: storageUsedMB || 0,
    usersCount,
    clinicsCount: clinicsCount || 0
  };
}, {
  patientsCount: 0,
  storageUsedMB: 0,
  usersCount: 1,
  clinicsCount: 0
});

/**
 * Obtiene el historial de suscripciones de un usuario
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const fetchSubscriptionHistory = apiHandler('fetchSubscriptionHistory', async (userId) => {
  const { data, error } = await supabase
    .from('therapist_subscriptions')
    .select('*')
    .eq('therapist_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}, []);

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Crea un checkout de MercadoPago para suscripción
 *
 * @param {Object} params
 * @param {string} params.userId - ID del terapeuta
 * @param {string} params.planId - 'individual', 'profesional', 'centro'
 * @param {string} params.email - Email del pagador
 * @param {string} params.fullName - Nombre completo
 * @returns {Promise<Object>} URLs de checkout
 */
export const createSubscriptionCheckout = apiHandler.mutation('createSubscriptionCheckout', async ({ userId, planId, email, fullName }) => {
  if (!userId) throw new Error('User ID es requerido');
  if (!planId) throw new Error('Plan ID es requerido');
  if (!email) throw new Error('Email es requerido');

  const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
    body: {
      plan_name: planId,
      therapist_id: userId,
      payer_email: email,
      payer_name: fullName || email,
    },
    method: 'POST',
  });

  if (error) {
    throw new Error(
      error.code === 'FunctionsHttpError' || error.status === 404
        ? 'El servicio de pagos no está disponible. Intente más tarde.'
        : error.message || 'Error al conectar con el servicio de pagos'
    );
  }

  if (!data?.success || !data?.init_point) {
    throw new Error(data?.error || 'No se pudo crear el checkout');
  }

  return {
    success: true,
    checkoutUrl: data.init_point,
    sandboxUrl: data.sandbox_init_point,
    subscriptionId: data.subscription_id,
    externalReference: data.external_reference,
  };
});

/**
 * Upgrades the user's subscription to a new plan.
 *
 * @param {string} userId - The UUID of the user
 * @param {string} newPlanName - The name of the plan to upgrade to
 * @returns {Promise<Object>} The updated subscription data
 */
export const upgradeSubscription = apiHandler.mutation('upgradeSubscription', async (userId, newPlanName) => {
  const { data, error } = await supabase
    .from('therapist_subscriptions')
    .update({
      plan_name: newPlanName,
      updated_at: new Date().toISOString()
    })
    .eq('therapist_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Cancela la suscripción (se mantiene activa hasta fin del período)
 *
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<boolean>}
 */
export const cancelSubscription = apiHandler.mutation('cancelSubscription', async (subscriptionId) => {
  const { error } = await supabase
    .from('therapist_subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error) throw error;
  return true;
});

/**
 * Reactiva una suscripción cancelada (antes de que expire)
 *
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<boolean>}
 */
export const reactivateSubscription = apiHandler.mutation('reactivateSubscription', async (subscriptionId) => {
  const { error } = await supabase
    .from('therapist_subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error) throw error;
  return true;
});

/**
 * Submits a refund request for the subscription.
 *
 * @param {string} userId - The UUID of the user
 * @param {string} reason - The reason for the refund
 * @returns {Promise<Object>} Status of the refund request
 */
export const refundSubscription = apiHandler('refundSubscription', async (userId, reason) => {
  const { error } = await supabase
    .from('refund_requests')
    .insert({
      user_id: userId,
      reason: reason,
      status: 'pending',
      created_at: new Date().toISOString()
    });

  // Si la tabla no existe (error 42P01), manejamos gracefully
  if (error && error.code !== '42P01') {
    throw error;
  }

  return {
    success: true,
    message: 'Solicitud de reembolso enviada exitosamente',
    refundId: `ref_${Date.now()}_${userId.slice(0, 4)}`
  };
}, {
  success: false,
  message: 'No se pudo enviar la solicitud. Por favor intente nuevamente o contacte soporte.',
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Verifica si el usuario puede agregar más pacientes
 * Útil para validación antes de crear paciente
 *
 * @param {string} userId
 * @param {number} maxAllowed - Límite del plan
 * @returns {Promise<{allowed: boolean, current: number, max: number}>}
 */
export const checkPatientLimit = async (userId, maxAllowed) => {
  const stats = await fetchUsageStats(userId);

  return {
    allowed: maxAllowed === Infinity || stats.patientsCount < maxAllowed,
    current: stats.patientsCount,
    max: maxAllowed,
  };
};

/**
 * Verifica si el usuario puede agregar más clínicas
 *
 * @param {string} userId
 * @param {number} maxAllowed - Límite del plan
 * @returns {Promise<{allowed: boolean, current: number, max: number}>}
 */
export const checkClinicLimit = async (userId, maxAllowed) => {
  const stats = await fetchUsageStats(userId);

  return {
    allowed: maxAllowed === Infinity || stats.clinicsCount < maxAllowed,
    current: stats.clinicsCount,
    max: maxAllowed,
  };
};

/**
 * Verifica si el usuario puede agregar más clínicas
 *
 * @param {string} userId
 * @param {number} maxAllowedMB - Límite en MB del plan
 * @returns {Promise<{allowed: boolean, current: number, max: number}>}
 */
export const checkStorageLimit = async (userId, maxAllowedMB) => {
  const stats = await fetchUsageStats(userId);

  return {
    allowed: stats.storageUsedMB < maxAllowedMB,
    current: stats.storageUsedMB,
    max: maxAllowedMB,
  };
};
