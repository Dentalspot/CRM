/**
 * Payment Tracking Utilities
 *
 * This library provides helper functions to track "Purchase" events for Meta Pixel / CAPI.
 * It is designed to be used with the `useMetaTracking` hook.
 */
import logger from '@/lib/utils/logger';

/**
 * Formats an amount as Chilean Pesos (CLP) without decimals.
 * Example: 29900 -> "$29.900"
 * @param {number} amount - The amount in numeric format
 * @returns {string} - Formatted string
 */
export const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Tracks a "Purchase" event to Meta (Pixel + CAPI).
 * 
 * PRIMARY EVENT: This is the highest priority event for ad optimization.
 * 
 * @param {Function} trackEventFn - The raw trackEvent function from useMetaTracking hook
 * @param {object} params - The purchase details
 * @param {number} params.amount - Value of the purchase (e.g., 29900)
 * @param {string} params.currency - Currency code (default: 'CLP')
 * @param {string} params.orderId - Unique Transaction ID
 * @param {object} params.planDetails - Details about the plan (name, duration)
 * @param {object} params.userInfo - (Optional) user email/phone for matching if not already in context
 */
export const trackPurchaseEvent = async (trackEventFn, { 
  amount, 
  currency = 'CLP', 
  orderId, 
  planDetails = {}, 
  userInfo = {} 
}) => {
  if (!trackEventFn) {
    logger.error('[PaymentTracking] trackEvent function is missing');
    return;
  }

  logger.track('[PaymentTracking] Tracking Purchase:', { amount, orderId });

  // Construct the standardized payload for Meta
  // Value and Currency are CRITICAL for ROAS (Return on Ad Spend) calculation
  const eventData = {
    value: Number(amount),
    currency: currency,
    content_name: planDetails.name || 'Subscription',
    content_ids: [planDetails.id || 'plan_default'], // SKU or Plan ID
    content_type: 'product',
    order_id: orderId, // Used for deduplication in some contexts
    num_items: 1,
    status: 'completed',
    ...planDetails
  };

  // Call the main hook function
  await trackEventFn('Purchase', eventData, userInfo);
};