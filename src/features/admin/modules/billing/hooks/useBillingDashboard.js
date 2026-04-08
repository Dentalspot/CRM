/**
 * @file useBillingDashboard.js
 * @description Hook centralizado para el dashboard de Pagos@dentalspot.cl
 * Orquesta todas las llamadas a billingApi y expone data + estados.
 * Usa Promise.allSettled para resiliencia (si una query falla, las demás siguen).
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { billingApi } from '../api/billingApi';

export const useBillingDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState({ data: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, subsRes, plansRes, couponsRes] = await Promise.allSettled([
        billingApi.fetchDashboardMetrics(),
        billingApi.fetchSubscriptions({ page: 0, limit: 8 }),
        billingApi.fetchPlans(),
        billingApi.fetchCoupons(),
      ]);

      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null);
      setRecentSubs(subsRes.status === 'fulfilled' ? subsRes.value.data : []);
      setPlans(plansRes.status === 'fulfilled' ? plansRes.value : []);
      setCoupons(couponsRes.status === 'fulfilled' ? couponsRes.value : { data: [], count: 0 });

      // Si alguna query falló, marcar error parcial
      const failures = [metricsRes, subsRes, plansRes, couponsRes].filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.warn('[useBillingDashboard] Partial failures:', failures.map(f => f.reason));
      }
    } catch (err) {
      logger.error('[useBillingDashboard] Critical error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { metrics, recentSubs, plans, coupons, loading, error, refresh: fetchAll };
};