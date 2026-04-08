/**
 * @file src/hooks/usePlanFeatures.js
 * 
 * Hook conveniente para acceder a features del plan
 * Es un wrapper del contexto con helpers adicionales
 */

import { useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  getMinimumPlanForFeature,
  getFeatureInfo,
  isPlanHigherOrEqual,
} from '@/utils/planHelpers';
import { PLAN_NAMES } from '@/constants/planFeatures';

/**
 * Hook principal para verificar features y límites del plan
 * @returns {Object}
 */
export const usePlanFeatures = () => {
  const context = useSubscription();

  const { currentPlan, loading } = context;

  // Helpers adicionales
  const helpers = useMemo(() => ({
    // Verificaciones de nivel de plan
    isFreePlan: currentPlan === PLAN_NAMES.FREE,
    isIndividualPlan: currentPlan === PLAN_NAMES.INDIVIDUAL,
    isProfessionalPlan: currentPlan === PLAN_NAMES.PROFESSIONAL,
    isCenterPlan: currentPlan === PLAN_NAMES.CENTER,

    // Verificaciones de rango
    isIndividualOrHigher: isPlanHigherOrEqual(currentPlan, PLAN_NAMES.INDIVIDUAL),
    isProfessionalOrHigher: isPlanHigherOrEqual(currentPlan, PLAN_NAMES.PROFESSIONAL),

    // Estado
    isLoading: loading,
    isReady: !loading,
  }), [currentPlan, loading]);

  return {
    ...context,
    ...helpers,
  };
};

/**
 * Hook para verificar una feature específica
 * Retorna información detallada sobre la feature
 * 
 * @param {string} featureKey 
 * @returns {Object}
 */
export const useFeatureAccess = (featureKey) => {
  const { hasFeature, currentPlan, loading } = useSubscription();

  return useMemo(() => {
    const canAccess = hasFeature(featureKey);
    const featureInfo = getFeatureInfo(featureKey);
    const minimumPlan = getMinimumPlanForFeature(featureKey);
    const needsUpgrade = !canAccess;

    return {
      // Estado
      canAccess,
      needsUpgrade,
      isLoading: loading,

      // Info de la feature
      featureKey,
      featureName: featureInfo?.name || featureKey,
      featureDescription: featureInfo?.description || '',
      featureIcon: featureInfo?.icon || 'Lock',

      // Info del plan requerido
      minimumPlan,
      currentPlan,

      // Add-on disponible?
      hasAddOn: !!featureInfo?.addOnPrice,
      addOnPrice: featureInfo?.addOnPrice || null,
    };
  }, [featureKey, hasFeature, currentPlan, loading]);
};

/**
 * Hook para verificar un límite específico
 * 
 * @param {string} limitKey - 'maxPatients' | 'maxUsers' | 'maxClinics'
 * @returns {Object}
 */
export const useLimitStatus = (limitKey) => {
  const { hasReachedLimit, isNearingLimit, usage, currentPlan, loading } = useSubscription();

  return useMemo(() => {
    const usageMap = {
      maxPatients: usage?.patientsCount ?? 0,
      maxUsers: usage?.usersCount ?? 1,
      maxClinics: usage?.clinicsCount ?? 1,
      maxStorageMB: usage?.storageUsedMB ?? 0,
    };

    const current = usageMap[limitKey] ?? 0;
    const reached = hasReachedLimit(limitKey);
    const near = isNearingLimit(limitKey);

    return {
      // Estado
      hasReached: reached,
      isNear: near,
      isLoading: loading,

      // Valores
      current,
      limitKey,
      currentPlan,

      // Para UI
      statusLevel: reached ? 'error' : near ? 'warning' : 'ok',
    };
  }, [limitKey, hasReachedLimit, isNearingLimit, usage, currentPlan, loading]);
};

// Export default
export default usePlanFeatures;