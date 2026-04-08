
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { trackMetaEvent, generateEventId, DATASET_ID } from '@/lib/metaPixel';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to handle Meta Tracking via both Pixel (Browser) and Conversions API (Edge Function)
 * ensuring deduplication via event_id.
 * 
 * UPDATED: Added robust support for "Purchase" events with value/currency validation.
 */
export const useMetaTracking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get tracked user if available

  // Helper to hash email client-side if needed
  const hashData = async (data) => {
    if (!data) return null;
    const msgBuffer = new TextEncoder().encode(data.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * Tracks an event to both Pixel and CAPI
   * @param {string} eventName - e.g. 'Purchase', 'Lead'
   * @param {object} eventData - { value, currency, content_name, ... }
   * @param {object} userData - { email, phone, etc. } - optional, falls back to auth user
   * @param {string} datasetIdOverride - Optional ID to override default DATASET_ID
   */
  const trackEvent = useCallback(async (eventName, eventData = {}, userData = {}, datasetIdOverride = null) => {
    setLoading(true);
    setError(null);

    const targetDatasetId = datasetIdOverride || import.meta.env.VITE_META_DATASET_ID || DATASET_ID;

    // Validation for Purchase events
    if (eventName === 'Purchase') {
      if (eventData.value === undefined || eventData.value === null) {
        logger.warn('[Meta Tracking] Warning: Purchase event missing "value" parameter.');
      }
      if (!eventData.currency) {
        logger.warn('[Meta Tracking] Warning: Purchase event missing "currency", defaulting to CLP.');
        eventData.currency = 'CLP';
      }
    }

    try {
      // 1. Generate Deduplication ID (UUID)
      // This is critical for Meta to know the Pixel event and CAPI event are the same.
      const eventId = generateEventId();
      
      // 2. Track via Pixel (Browser Side)
      // We pass the eventId so the browser event matches the server event
      trackMetaEvent({ 
        eventName, 
        params: eventData, 
        eventId,
        datasetId: targetDatasetId
      });

      // 3. Track via CAPI (Server Side via Edge Function)
      // Prepare user data (prioritize passed data, fallback to auth context)
      const email = userData.email || user?.email;
      const phone = userData.phone || user?.phone; 
      
      if (!targetDatasetId) {
        logger.warn('Meta Dataset ID is missing');
        return;
      }

      // Invoke Supabase Edge Function
      const { data, error: apiError } = await supabase.functions.invoke('new-meta-capi', {
        body: {
          event_name: eventName,
          event_source_url: window.location.href,
          event_id: eventId,
          action_source: 'website',
          dataset_id: targetDatasetId, // Explicitly pass dataset_id
          pixel_id: targetDatasetId, // Backward compatibility for function logic
          user_data: {
            email: email, 
            phone: phone,
            client_user_agent: navigator.userAgent,
            // client_ip_address will be extracted by Edge Function headers
          },
          custom_data: {
            currency: 'CLP', // Default fallback
            ...eventData
          }
        }
      });

      if (apiError) return; // Silently fail — never block UI for tracking
      
      if (import.meta.env.DEV) {
        logger.track('[Meta CAPI] Success:', data);
      }

    } catch (err) {
      // Silently fail — Meta tracking errors should never affect user experience
      if (import.meta.env.DEV) {
        logger.warn('[Meta CAPI] Non-blocking error:', err?.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    trackEvent,
    loading,
    error,
    hashData 
  };
};
