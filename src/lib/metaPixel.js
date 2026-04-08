import logger from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { PIXEL_PATIENTS, PIXEL_PROFESSIONALS, DATASET_PATIENTS, DATASET_PROFESSIONALS } from '@/components/shared/MetaPixelProvider';

/**
 * Utility to interact with Meta Pixel (Client-side)
 * Supports dual-pixel setup: patients vs professionals
 */

/**
 * Tracks a standard or custom event to a specific Meta Pixel
 * @param {string} eventName - Standard event name or custom name
 * @param {object} params - Additional data
 * @param {string} eventId - Deduplication ID
 * @param {string} pixelId - Target pixel ID (patients or professionals)
 */
export const trackMetaEvent = ({ eventName, params = {}, eventId, pixelId }) => {
  if (typeof window === 'undefined' || !window.fbq) {
    logger.warn('Meta Pixel not initialized or blocked');
    return;
  }

  const payload = { ...params };
  if (eventId) {
    payload.eventID = eventId;
  }

  logger.track(`[Meta Pixel] Tracking ${eventName} → ${pixelId || 'all'}`, payload);

  if (pixelId) {
    // Fire to specific pixel
    window.fbq('trackSingle', pixelId, eventName, payload);
  } else {
    // Fire to all initialized pixels
    const trackType = isStandardEvent(eventName) ? 'track' : 'trackCustom';
    window.fbq(trackType, eventName, payload);
  }
};

// Standard Meta Pixel events
const STANDARD_EVENTS = [
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
  'Contact', 'CustomizeProduct', 'Donate', 'FindLocation',
  'InitiateCheckout', 'Lead', 'Purchase', 'Schedule',
  'Search', 'StartTrial', 'SubmitApplication', 'Subscribe',
  'ViewContent', 'PageView'
];

function isStandardEvent(name) {
  return STANDARD_EVENTS.includes(name);
}

export const generateEventId = () => uuidv4();

// Re-export for backward compatibility
export { PIXEL_PATIENTS, PIXEL_PROFESSIONALS, DATASET_PATIENTS, DATASET_PROFESSIONALS };

// Legacy alias — old code imports DATASET_ID, default to patients pixel
export const DATASET_ID = DATASET_PATIENTS;
