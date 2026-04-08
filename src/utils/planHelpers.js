/**
 * @file src/utils/planHelpers.js
 * 
 * Funciones puras para lógica de planes
 * NO tienen side effects, NO llaman APIs, NO usan hooks
 * Son 100% testeable y reutilizables
 */

import {
  PLAN_NAMES,
  PLAN_HIERARCHY,
  PLAN_PRICING,
  PLAN_LIMITS,
  PLAN_FEATURES,
  FEATURE_INFO,
} from '@/constants/planFeatures.js';

// ============================================
// PLAN HELPERS
// ============================================

/**
 * Normaliza el nombre del plan a lowercase
 * @param {string} planName 
 * @returns {string}
 */
export const normalizePlanName = (planName) => {
  return planName?.toLowerCase() || PLAN_NAMES.FREE;
};

/**
 * Obtiene la información de pricing de un plan
 * @param {string} planName 
 * @returns {Object}
 */
export const getPlanPricing = (planName) => {
  const plan = normalizePlanName(planName);
  return PLAN_PRICING[plan] || PLAN_PRICING[PLAN_NAMES.FREE];
};

/**
 * Obtiene los límites de un plan
 * @param {string} planName 
 * @returns {Object}
 */
export const getPlanLimits = (planName) => {
  const plan = normalizePlanName(planName);
  return PLAN_LIMITS[plan] || PLAN_LIMITS[PLAN_NAMES.FREE];
};

/**
 * Obtiene un límite específico de un plan
 * @param {string} planName 
 * @param {string} limitKey - 'maxPatients' | 'maxUsers' | 'maxClinics' | 'maxStorageMB'
 * @returns {number}
 */
export const getPlanLimit = (planName, limitKey) => {
  const limits = getPlanLimits(planName);
  return limits[limitKey] ?? 0;
};

/**
 * Obtiene todas las features de un plan
 * @param {string} planName 
 * @returns {Object}
 */
export const getPlanFeatures = (planName) => {
  const plan = normalizePlanName(planName);
  return PLAN_FEATURES[plan] || PLAN_FEATURES[PLAN_NAMES.FREE];
};

// ============================================
// FEATURE HELPERS
// ============================================

/**
 * Verifica si un plan tiene acceso a una feature
 * @param {string} planName 
 * @param {string} featureKey 
 * @returns {boolean}
 */
export const hasFeature = (planName, featureKey) => {
  const features = getPlanFeatures(planName);
  const value = features[featureKey];

  if (typeof value === 'boolean') return value;
  if (value === 'limited') return true; // limited = tiene acceso pero restringido
  return !!value;
};

/**
 * Verifica si una feature está en modo limitado
 * @param {string} planName 
 * @param {string} featureKey 
 * @returns {boolean}
 */
export const isFeatureLimited = (planName, featureKey) => {
  const features = getPlanFeatures(planName);
  return features[featureKey] === 'limited';
};

/**
 * Obtiene la metadata de una feature para UI
 * @param {string} featureKey 
 * @returns {Object|null}
 */
export const getFeatureInfo = (featureKey) => {
  return FEATURE_INFO[featureKey] || null;
};

/**
 * Obtiene el plan mínimo requerido para una feature
 * @param {string} featureKey 
 * @returns {string}
 */
export const getMinimumPlanForFeature = (featureKey) => {
  // Primero buscar en FEATURE_INFO
  const info = FEATURE_INFO[featureKey];
  if (info?.minimumPlan) return info.minimumPlan;

  // Si no está definido, buscar el primer plan que lo tenga
  const planOrder = [PLAN_NAMES.FREE, PLAN_NAMES.INDIVIDUAL, PLAN_NAMES.PROFESSIONAL, PLAN_NAMES.CENTER];

  for (const plan of planOrder) {
    if (hasFeature(plan, featureKey)) {
      return plan;
    }
  }

  return PLAN_NAMES.CENTER; // Default al más alto
};

/**
 * Obtiene todas las features bloqueadas para un plan
 * @param {string} planName 
 * @returns {string[]}
 */
export const getBlockedFeatures = (planName) => {
  const features = getPlanFeatures(planName);
  return Object.entries(features)
    .filter(([_, value]) => value === false)
    .map(([key]) => key);
};

/**
 * Obtiene todas las features disponibles para un plan
 * @param {string} planName 
 * @returns {string[]}
 */
export const getAvailableFeatures = (planName) => {
  const features = getPlanFeatures(planName);
  return Object.entries(features)
    .filter(([_, value]) => value === true || value === 'limited')
    .map(([key]) => key);
};

// ============================================
// PLAN COMPARISON HELPERS
// ============================================

/**
 * Obtiene el nivel jerárquico de un plan
 * @param {string} planName 
 * @returns {number}
 */
export const getPlanLevel = (planName) => {
  const plan = normalizePlanName(planName);
  return PLAN_HIERARCHY[plan] ?? 0;
};

/**
 * Verifica si un plan es igual o superior a otro
 * @param {string} currentPlan 
 * @param {string} requiredPlan 
 * @returns {boolean}
 */
export const isPlanHigherOrEqual = (currentPlan, requiredPlan) => {
  return getPlanLevel(currentPlan) >= getPlanLevel(requiredPlan);
};

/**
 * Verifica si un plan es estrictamente superior a otro
 * @param {string} planA 
 * @param {string} planB 
 * @returns {boolean}
 */
export const isPlanHigher = (planA, planB) => {
  return getPlanLevel(planA) > getPlanLevel(planB);
};

/**
 * Obtiene el siguiente plan en la jerarquía
 * @param {string} currentPlan 
 * @returns {string|null}
 */
export const getNextPlan = (currentPlan) => {
  const currentLevel = getPlanLevel(currentPlan);

  const entry = Object.entries(PLAN_HIERARCHY).find(
    ([_, level]) => level === currentLevel + 1
  );

  return entry ? entry[0] : null;
};

/**
 * Obtiene el plan anterior en la jerarquía
 * @param {string} currentPlan 
 * @returns {string|null}
 */
export const getPreviousPlan = (currentPlan) => {
  const currentLevel = getPlanLevel(currentPlan);
  if (currentLevel === 0) return null;

  const entry = Object.entries(PLAN_HIERARCHY).find(
    ([_, level]) => level === currentLevel - 1
  );

  return entry ? entry[0] : null;
};

// ============================================
// LIMIT HELPERS
// ============================================

/**
 * Verifica si un uso ha alcanzado el límite
 * @param {string} planName 
 * @param {string} limitKey 
 * @param {number} currentUsage 
 * @returns {boolean}
 */
export const hasReachedLimit = (planName, limitKey, currentUsage) => {
  const limit = getPlanLimit(planName, limitKey);
  if (limit === Infinity) return false;
  return currentUsage >= limit;
};

/**
 * Calcula cuánto queda disponible de un límite
 * @param {string} planName 
 * @param {string} limitKey 
 * @param {number} currentUsage 
 * @returns {number}
 */
export const getRemainingLimit = (planName, limitKey, currentUsage) => {
  const limit = getPlanLimit(planName, limitKey);
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - currentUsage);
};

/**
 * Calcula el porcentaje de uso de un límite
 * @param {string} planName 
 * @param {string} limitKey 
 * @param {number} currentUsage 
 * @returns {number} 0-100
 */
export const getLimitUsagePercent = (planName, limitKey, currentUsage) => {
  const limit = getPlanLimit(planName, limitKey);
  if (limit === Infinity) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((currentUsage / limit) * 100));
};

/**
 * Verifica si está cerca del límite (80% o más)
 * @param {string} planName 
 * @param {string} limitKey 
 * @param {number} currentUsage 
 * @returns {boolean}
 */
export const isNearLimit = (planName, limitKey, currentUsage) => {
  const percent = getLimitUsagePercent(planName, limitKey, currentUsage);
  return percent >= 80;
};

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Formatea un precio en CLP
 * @param {number} amount 
 * @returns {string}
 */
export const formatPriceCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea un precio en USD
 * @param {number} amount 
 * @returns {string}
 */
export const formatPriceUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea un límite (maneja Infinity)
 * @param {number} limit 
 * @returns {string}
 */
export const formatLimit = (limit) => {
  if (limit === Infinity) return 'Ilimitado';
  return limit.toLocaleString('es-CL');
};