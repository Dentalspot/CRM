import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { ADD_ON_CONFIG } from '@/constants/addOnFeatures';

/**
 * Hook to check if a user has access to a specific add-on.
 * Checks both the specific user_addons table and the base subscription plan features.
 * 
 * @param {string} addOnId - The key of the add-on (e.g., 'notiz', 'planGenerator')
 * @returns {Object} { hasAccess, isPurchased, price, isLoading, error }
 */
export const useAddOnAccess = (addOnId) => {
  const { user } = useAuth();
  const { hasFeature, loading: subLoading } = useSubscription();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = ADD_ON_CONFIG[addOnId];

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      // Don't proceed until auth/sub are ready or if no user
      if (subLoading) return;
      if (!user) {
        if (mounted) {
          setHasAccess(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1. Check if the feature is included in the base subscription plan
        // This acts as a fallback/override - if your plan has it, you have access.
        const planHasFeature = hasFeature(addOnId) || hasFeature(config?.featureKey || addOnId);
        
        if (planHasFeature) {
          if (mounted) {
            setHasAccess(true);
            setIsPurchased(false); // Accessed via plan, not separate purchase
            setIsLoading(false);
          }
          return;
        }

        // 2. If not in plan, check user_addons table for active purchase
        const { data, error: dbError } = await supabase
          .from('user_addons')
          .select('*')
          .eq('user_id', user.id)
          .eq('addon_key', addOnId)
          .eq('status', 'active')
          .maybeSingle();

        if (dbError) throw dbError;

        if (mounted) {
          if (data) {
            setHasAccess(true);
            setIsPurchased(true);
          } else {
            setHasAccess(false);
            setIsPurchased(false);
          }
        }
      } catch (err) {
        logger.error(`Error checking access for add-on ${addOnId}:`, err);
        if (mounted) {
          setError(err.message);
          // Fail closed for security, but allow retry
          setHasAccess(false); 
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [addOnId, user, subLoading, hasFeature, config]);

  return {
    hasAccess,
    isPurchased,
    price: config?.price || 0,
    config,
    isLoading: isLoading || subLoading,
    error
  };
};