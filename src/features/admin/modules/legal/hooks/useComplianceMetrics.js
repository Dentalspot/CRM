import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useComplianceMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalApi.fetchComplianceMetrics();
      setMetrics(data);
    } catch (err) {
      logger.error('Error fetching compliance metrics:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};
