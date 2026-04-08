import { useState, useEffect } from 'react';
import { billingApi } from '../api/billingApi';

/**
 * Hook for dashboard high-level metrics
 * @returns {object} { metrics, loading, refresh }
 */
export const useBillingMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi.fetchDashboardMetrics().then(data => {
        setMetrics(data);
        setLoading(false);
    });
  }, []);

  return {
    metrics,
    loading,
    refresh: () => {}
  };
};