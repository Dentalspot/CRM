/**
 * @file src/hooks/useActivePlanLimits.js
 *
 * Hook de enforcement: verifica server-side si el usuario puede crear un recurso
 * invocando el RPC `check_plan_limit` (spec 022 FR-014).
 *
 * Este hook es AUTHORITATIVE — la función RPC cuenta desde DB en tiempo real.
 * Para mostrar contadores/progress sin enforcement, usar `useLimitStatus`.
 *
 * Uso típico (Phase E — enforcement UX en forms de creación):
 *
 *   const { canCreate, currentPlan } = useActivePlanLimits();
 *   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
 *
 *   const handleSubmit = async () => {
 *     const allowed = await canCreate('patient');
 *     if (!allowed) { setShowUpgradeModal(true); return; }
 *     // insert normal…
 *   };
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import logger from '@/lib/utils/logger';

/**
 * @typedef {'patient' | 'appointment' | 'dentist' | 'box'} ResourceType
 */

/**
 * Hook de enforcement de límites del plan activo.
 *
 * @returns {{
 *   canCreate: (resourceType: ResourceType) => Promise<boolean>,
 *   currentPlan: string,
 *   checking: boolean
 * }}
 */
export function useActivePlanLimits() {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const [checking, setChecking] = useState(false);

  /**
   * Verifica si el usuario puede crear un recurso del tipo indicado.
   * Invoca el RPC server-side `check_plan_limit` que cuenta desde DB.
   *
   * Fail-safe OPEN: si el RPC falla, retorna true (permitir crear).
   * Decisión documentada en spec 022 — preferir continuidad operacional
   * a enforcement estricto ante errores inesperados.
   *
   * @param {ResourceType} resourceType
   * @returns {Promise<boolean>} true si puede crear, false si alcanzó el límite
   */
  const canCreate = useCallback(async (resourceType) => {
    if (!user?.id) {
      logger.warn('useActivePlanLimits.canCreate called without user — allowing');
      return true;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_therapist_id: user.id,
        p_resource_type: resourceType,
      });

      if (error) {
        logger.error('check_plan_limit RPC error:', error);
        return true; // fail-safe OPEN
      }

      return data === true;
    } catch (err) {
      logger.error('useActivePlanLimits.canCreate exception:', err);
      return true; // fail-safe OPEN
    } finally {
      setChecking(false);
    }
  }, [user?.id]);

  return {
    canCreate,
    currentPlan: currentPlan || 'free',
    checking,
  };
}

export default useActivePlanLimits;
