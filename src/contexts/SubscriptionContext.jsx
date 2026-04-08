/**
 * @file src/contexts/SubscriptionContext.jsx
 * 
 * Contexto global para estado de suscripción
 * Provee datos y métodos a toda la aplicación
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCurrentSubscription, fetchUsageStats } from '@/api/subscriptionApi';
import {
  hasFeature as checkFeature,
  hasReachedLimit as checkLimit,
  getPlanPricing,
  getNextPlan,
  isNearLimit,
} from '@/utils/planHelpers';
import logger from '@/lib/utils/logger';
import { PLAN_NAMES, SUBSCRIPTION_ROLES } from '@/constants/planFeatures';

// ============================================
// CONTEXT
// ============================================

const SubscriptionContext = createContext(undefined);

// ============================================
// HOOK
// ============================================

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();

  // State
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(async () => {
    // Solo cargar si hay usuario con rol que puede tener suscripción
    if (!user?.id || !SUBSCRIPTION_ROLES.includes(user.role)) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch en paralelo
      const [subData, usageData] = await Promise.all([
        fetchCurrentSubscription(user.id),
        fetchUsageStats(user.id),
      ]);

      setSubscription(subData);
      setUsage(usageData);

    } catch (err) {
      logger.error('Error fetching subscription data:', err);
      setError(err.message);

      // Fallback para estabilidad de UI
      setSubscription({
        plan_name: PLAN_NAMES.FREE,
        status: 'active',
        isFree: true,
        isActive: true,
      });
      setUsage({
        patientsCount: 0,
        storageUsedMB: 0,
        usersCount: 1,
        clinicsCount: 1,
      });

    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  // Cargar al montar y cuando cambie el usuario
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentPlan = useMemo(() => {
    return subscription?.plan_name || PLAN_NAMES.FREE;
  }, [subscription?.plan_name]);

  const planInfo = useMemo(() => {
    return getPlanPricing(currentPlan);
  }, [currentPlan]);

  const nextPlan = useMemo(() => {
    return getNextPlan(currentPlan);
  }, [currentPlan]);

  const nextPlanInfo = useMemo(() => {
    return nextPlan ? getPlanPricing(nextPlan) : null;
  }, [nextPlan]);

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Verifica si el usuario tiene acceso a una feature
   */
  const hasFeature = useCallback((featureKey) => {
    return checkFeature(currentPlan, featureKey);
  }, [currentPlan]);

  /**
   * Verifica si el usuario ha alcanzado un límite
   */
  const hasReachedLimit = useCallback((limitKey) => {
    if (!usage) return false;

    const usageMap = {
      maxPatients: usage.patientsCount,
      maxUsers: usage.usersCount,
      maxClinics: usage.clinicsCount,
      maxStorageMB: usage.storageUsedMB,
    };

    return checkLimit(currentPlan, limitKey, usageMap[limitKey] || 0);
  }, [currentPlan, usage]);

  /**
   * Verifica si está cerca de un límite
   */
  const isNearingLimit = useCallback((limitKey) => {
    if (!usage) return false;

    const usageMap = {
      maxPatients: usage.patientsCount,
      maxUsers: usage.usersCount,
      maxClinics: usage.clinicsCount,
      maxStorageMB: usage.storageUsedMB,
    };

    return isNearLimit(currentPlan, limitKey, usageMap[limitKey] || 0);
  }, [currentPlan, usage]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo(() => ({
    // Estado
    subscription,
    usage,
    loading,
    error,

    // Plan actual
    currentPlan,
    planInfo,
    isFreePlan: currentPlan === PLAN_NAMES.FREE,
    isPaidPlan: currentPlan !== PLAN_NAMES.FREE,
    isActive: subscription?.isActive ?? false,
    isExpired: subscription?.isExpired ?? false,

    // Upgrade
    nextPlan,
    nextPlanInfo,
    canUpgrade: !!nextPlan,

    // Métodos
    hasFeature,
    hasReachedLimit,
    isNearingLimit,
    refetch: fetchData,

    // Shortcuts para features comunes
    canUseAI: hasFeature('aiReports'),
    canUseWhatsApp: hasFeature('whatsappReminders'),
    canSellInMarketplace: hasFeature('marketplaceSell'),
    canBuyInMarketplace: hasFeature('marketplaceBuy'),
    canUseMultiClinic: hasFeature('multiClinic'),
    canUseMetrics: hasFeature('metricsPanel'),

    // Shortcuts para límites
    hasReachedPatientLimit: hasReachedLimit('maxPatients'),
    isNearPatientLimit: isNearingLimit('maxPatients'),
    patientsCount: usage?.patientsCount ?? 0,

  }), [
    subscription,
    usage,
    loading,
    error,
    currentPlan,
    planInfo,
    nextPlan,
    nextPlanInfo,
    hasFeature,
    hasReachedLimit,
    isNearingLimit,
    fetchData,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;