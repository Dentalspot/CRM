import logger from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility to interact with Meta Pixel (Client-side)
 */

export const DATASET_ID = '1464610018368997';

// Initialize Pixel manually if needed (mostly handled by index.html script)
export const initializeMetaPixel = (pixelId) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', pixelId);
  }
};

/**
 * Tracks a standard or custom event to Meta Pixel
 * @param {string} eventName - Standard event name (e.g., 'Lead', 'Purchase') or custom name
 * @param {object} params - Additional data (currency, value, content_ids, etc.)
 * @param {string} eventId - Deduplication ID (must match CAPI event_id)
 * @param {string} datasetId - Optional dataset ID override
 */
export const trackMetaEvent = ({ eventName, params = {}, eventId, datasetId = DATASET_ID }) => {
  if (typeof window === 'undefined' || !window.fbq) {
    logger.warn('Meta Pixel not initialized or blocked');
    return;
  }

  const trackType = isStandardEvent(eventName) ? 'track' : 'trackCustom';
  
  // Attach deduplication ID if provided
  const payload = { ...params };
  if (eventId) {
    payload.eventID = eventId;
  }

  // NOTE: Client-side Pixel usually sends to the initialized ID. 
  // If multiple IDs are initialized, trackSingle can be used, but standard 'track' sends to all.
  // For simplicity and standard usage, we rely on the default 'track'.
  // If specific dataset tracking is needed client-side:
  // window.fbq('trackSingle', datasetId, eventName, payload);
  
  logger.track(`[Meta Pixel] Tracking ${eventName}`, payload);
  
  // We prefer trackSingle if we want to be specific about the Dataset ID, 
  // but fallback to standard track if specific targeting isn't critical client-side
  if (datasetId && window.fbq.getState && window.fbq.getState().pixels.length > 1) {
     window.fbq('trackSingle', datasetId, eventName, payload);
  } else {
     window.fbq(trackType, eventName, payload);
  }
};

// List of standard Meta Pixel events
const STANDARD_EVENTS = [
  'AddPaymentInfo',
  'AddToCart',
  'AddToWishlist',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'InitiateCheckout',
  'Lead',
  'Purchase',
  'Schedule',
  'Search',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
  'ViewContent',
  'PageView'
];

function isStandardEvent(name) {
  return STANDARD_EVENTS.includes(name);
}

export const generateEventId = () => uuidv4();