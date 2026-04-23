import { supabase } from '@/lib/supabaseClient';
import { 
  PLAN_NAMES, 
  PLAN_PRICING, 
  PLAN_LIMITS, 
  PLAN_FEATURES, 
  FEATURE_INFO 
} from '@/constants/planFeatures';

import logger from '@/lib/utils/logger';

import {
  hasFeature as _hasFeature,
  isFeatureLimited as _isFeatureLimited,
  getPlanLimit as _getPlanLimit,
  getPlanFeatures as _getPlanFeatures,
  getPlanPricing as _getPlanPricing,
  isPlanHigherOrEqual as _isPlanHigherOrEqual,
  getMinimumPlanForFeature as _getMinimumPlanForFeature,
  getNextPlan as _getNextPlan
} from '@/utils/planHelpers';

// ============================================
// EXPORTS (Re-exporting from constants and utils for backward compatibility)
// ============================================

export { 
  PLAN_NAMES, 
  PLAN_PRICING, 
  PLAN_LIMITS, 
  PLAN_FEATURES, 
  FEATURE_INFO 
};

export const hasFeature = _hasFeature;
export const isFeatureLimited = _isFeatureLimited;
export const getPlanLimit = _getPlanLimit;
export const getPlanFeatures = _getPlanFeatures;
export const getPlanPricing = _getPlanPricing;
export const isPlanHigherOrEqual = _isPlanHigherOrEqual;
export const getMinimumPlanForFeature = _getMinimumPlanForFeature;
export const getNextPlan = _getNextPlan;

// ============================================
// API FUNCTIONS - Supabase
// ============================================

/**
 * Get the current active subscription for a user
 * @param {string} userId 
 */
export const getCurrentSubscription = async (userId) => {
  try {
    logger.api('getCurrentSubscription called with userId:', userId);

    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .select('*')
      .eq('therapist_id', userId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    logger.api('Supabase response - data:', data);
    logger.api('Supabase response - error:', error);

    if (error && error.code !== 'PGRST116') throw error;

    // Default to free plan if no subscription found
    if (!data) {
      logger.api('No subscription found, returning FREE plan');
      return {
        plan_name: 'free',
        status: 'active',
        current_period_end: null,
        isFree: true,
      };
    }

    // Check if expired
    const isExpired = data.current_period_end &&
      new Date(data.current_period_end) < new Date();

    const result = {
      ...data,
      isExpired,
      isActive: data.status === 'active' && !isExpired,
      isFree: false,
    };

    logger.api('Returning subscription:', result);
    return result;

  } catch (error) {
    logger.error('🔴 Error fetching subscription:', error);
    return { plan_name: 'free', status: 'active', isFree: true };
  }
};

/**
 * Get usage statistics for the therapist (e.g. patient count)
 * @param {string} userId 
 */
export const getUsageStats = async (userId) => {
  try {
    // Count active patients
    const { count: patientCount, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', userId)
      .eq('status', 'active');

    if (patientsError) throw patientsError;

    // Count clinics
    const { count: clinicsCount, error: clinicsError } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', userId)
        .eq('is_active', true);

    if (clinicsError) throw clinicsError;

    // Get storage usage
    const { data: files, error: storageError } = await supabase
        .from('therapist_documents')
        .select('size')
        .eq('therapist_id', userId);

    if (storageError) throw storageError;

    const totalBytes = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
    const storageUsedMB = Math.round(totalBytes / (1024 * 1024));

    return {
      patientsCount: patientCount || 0,
      storageUsedMB: storageUsedMB,
      usersCount: 1, // TODO: Implement team count for Centro plan
      clinicsCount: clinicsCount || 1, 
    };
  } catch (error) {
    logger.error('Error fetching usage stats:', error);
    return { patientsCount: 0, storageUsedMB: 0, usersCount: 1, clinicsCount: 1 };
  }
};

/**
 * Check if user has reached a limit
 * @param {string} userId
 * @param {string} limitKey - 'maxPatients', 'maxUsers', 'maxClinics'
 */
export const hasReachedLimit = async (userId, limitKey) => {
  try {
    const subscription = await getCurrentSubscription(userId);
    const usage = await getUsageStats(userId);
    const limit = _getPlanLimit(subscription.plan_name, limitKey);

    if (limit === Infinity) return false;

    switch (limitKey) {
      case 'maxPatients':
        return usage.patientsCount >= limit;
      case 'maxUsers':
        return usage.usersCount >= limit;
      case 'maxClinics':
        return usage.clinicsCount >= limit;
      case 'maxStorageMB':
        return usage.storageUsedMB >= limit;
      default:
        return false;
    }
  } catch (error) {
    logger.error('Error checking limit:', error);
    return false;
  }
};

/**
 * Check if user can use a specific feature
 * @param {string} userId
 * @param {string} featureKey
 */
export const canUseFeature = async (userId, featureKey) => {
  try {
    const subscription = await getCurrentSubscription(userId);
    return _hasFeature(subscription.plan_name, featureKey);
  } catch (error) {
    logger.error('Error checking feature:', error);
    return false;
  }
};

/**
 * Creates a MercadoPago checkout for subscription
 * @param {string} userId 
 * @param {object} planDetails { id, name, email, fullName }
 */
export const subscribeToPlan = async (userId, planDetails) => {
  logger.api('Creating subscription for', userId, planDetails);

  try {
    if (!userId) throw new Error('User ID is required');
    if (!planDetails.id) throw new Error('Plan ID is required');
    if (!planDetails.email) throw new Error('User email is required');

    logger.api('Invoking edge function create-mp-checkout');

    const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
      body: {
        plan_name: planDetails.id,
        therapist_id: userId,
        payer_email: planDetails.email,
        payer_name: planDetails.fullName || planDetails.name || planDetails.email,
        final_price: planDetails.final_price || null,  // F-014: ignorado server-side
        coupon_code: planDetails.coupon_code || null,
        // Spec 022: billing_cycle 'monthly' | 'annual' (default monthly si no viene)
        billing_cycle: planDetails.billing_cycle || 'monthly',
      },
      method: 'POST'
    });

    if (error) {
      logger.error('API: Edge Function Error:', error);
      if (error.code === 'FunctionsHttpError' || error.status === 404) {
        throw new Error('El servicio de suscripciones no está disponible. Intente más tarde.');
      }
      throw new Error(error.message || 'Error al conectar con el servicio de pagos');
    }

    logger.api('Edge Function Response:', data);

    if (!data?.success) {
      throw new Error(data?.error || 'No se pudo crear la suscripción');
    }

    if (!data.init_point) {
      throw new Error('La respuesta de MercadoPago no contiene una URL de pago válida.');
    }

    return {
      success: true,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      subscription_id: data.subscription_id,
      external_reference: data.external_reference
    };

  } catch (error) {
    logger.error('API: Error creating subscription:', error);
    throw error;
  }
};

/**
 * Activate a plan directly without MercadoPago (for 100% discount coupons).
 * Creates/updates the subscription as 'active' immediately.
 */
export const activateFreeCouponPlan = async (userId, { planSlug, couponId, couponCode, durationDays = 30 }) => {
  logger.api('Activating free coupon plan for', userId, planSlug);

  // 1. Check if user already redeemed this coupon
  const { data: existingRedemption } = await supabase
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_id', couponId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingRedemption) {
    throw new Error('Ya utilizaste este cupón anteriormente. Solo se permite un uso por usuario.');
  }

  // 2. Clean up pending subscriptions
  await supabase
    .from('therapist_subscriptions')
    .delete()
    .eq('therapist_id', userId)
    .eq('status', 'pending');

  // 3. Check existing active subscription
  const { data: existing } = await supabase
    .from('therapist_subscriptions')
    .select('id, plan_name')
    .eq('therapist_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  const now = new Date();
  const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  if (existing) {
    // Upgrade existing subscription
    const { error } = await supabase.from('therapist_subscriptions')
      .update({
        plan_name: planSlug,
        price: 0,
        original_price: 0,
        discount_percent: 100,
        status: 'active',
        payment_status: 'approved',
        current_period_start: now.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        external_reference: `coupon_${couponCode}_${userId}_${Date.now()}`,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Create new subscription
    const { error } = await supabase.from('therapist_subscriptions').insert({
      therapist_id: userId,
      plan_name: planSlug,
      price: 0,
      original_price: 0,
      discount_percent: 100,
      currency: 'CLP',
      billing_cycle: 'monthly',
      status: 'active',
      payment_status: 'approved',
      external_reference: `coupon_${couponCode}_${userId}_${Date.now()}`,
      current_period_start: now.toISOString().split('T')[0],
      current_period_end: periodEnd.toISOString().split('T')[0],
      cancel_at_period_end: true, // Auto-cancel after period (no auto-renewal for free coupon)
    });
    if (error) throw error;
  }

  // 4. Record coupon redemption
  await supabase.from('coupon_redemptions').insert({
    coupon_id: couponId,
    user_id: userId,
    plan_name: planSlug,
  });

  // 5. Increment coupon usage
  await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponId });

  return { success: true };
};

/**
 * Cancel current subscription (sets cancel_at_period_end to true)
 * @param {string} subscriptionId
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const { error } = await supabase
      .from('therapist_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw new Error('No se pudo cancelar la suscripción. Intente nuevamente.');
  }
};

/**
 * Reactivate a cancelled subscription (before period ends)
 * @param {string} subscriptionId 
 */
export const reactivateSubscription = async (subscriptionId) => {
  try {
    const { error } = await supabase
      .from('therapist_subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error reactivating subscription:', error);
    throw new Error('No se pudo reactivar la suscripción. Intente nuevamente.');
  }
};

/**
 * Get subscription history for a user
 * @param {string} userId 
 */
export const getSubscriptionHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .select('*')
      .eq('therapist_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching subscription history:', error);
    return [];
  }
};

/**
 * Checks if a therapist has an active paid subscription
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export const hasActiveSubscription = async (userId) => {
  const subscription = await getCurrentSubscription(userId);
  return subscription?.status === 'active' && subscription?.plan_name !== 'free';
};