import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { trackMetaEvent, generateEventId } from '@/lib/metaPixel';
import { getPixelForRole, getDatasetForRole } from '@/components/shared/MetaPixelProvider';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to handle Meta Tracking via both Pixel (Browser) and Conversions API (Edge Function).
 * Automatically routes events to the correct pixel based on user role:
 *  - Patients → pixel 1437133438008806
 *  - Dentists/Clinics/Labs → pixel 800230703093106
 *  - Anonymous → fires to both
 */
export const useMetaTracking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, profile } = useAuth();

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
   * @param {object} userData - { email, phone } - optional, falls back to auth user
   * @param {string} pixelIdOverride - Optional pixel ID override (ignores role-based routing)
   */
  const trackEvent = useCallback(async (eventName, eventData = {}, userData = {}, pixelIdOverride = null) => {
    setLoading(true);
    setError(null);

    const role = profile?.role;
    const targetPixelId = pixelIdOverride || getPixelForRole(role);
    const targetDatasetId = pixelIdOverride || getDatasetForRole(role);

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
      const eventId = generateEventId();

      // 1. Track via Pixel (Browser Side)
      trackMetaEvent({
        eventName,
        params: eventData,
        eventId,
        pixelId: targetPixelId, // null = fires to all pixels
      });

      // 2. Track via CAPI (Server Side via Edge Function)
      const email = userData.email || user?.email;
      const phone = userData.phone || user?.phone;

      if (!targetDatasetId) {
        logger.warn('Meta Dataset ID is missing');
        return;
      }

      const { data, error: apiError } = await supabase.functions.invoke('new-meta-capi', {
        body: {
          event_name: eventName,
          event_source_url: window.location.href,
          event_id: eventId,
          action_source: 'website',
          dataset_id: targetDatasetId,
          pixel_id: targetDatasetId,
          user_data: {
            email,
            phone,
            client_user_agent: navigator.userAgent,
          },
          custom_data: {
            currency: 'CLP',
            ...eventData,
          },
        },
      });

      if (apiError) return;

      if (import.meta.env.DEV) {
        logger.track('[Meta CAPI] Success:', data);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        logger.warn('[Meta CAPI] Non-blocking error:', err?.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  return {
    trackEvent,
    loading,
    error,
    hashData,
  };
};
