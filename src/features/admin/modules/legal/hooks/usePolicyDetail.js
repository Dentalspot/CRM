import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const usePolicyDetail = (id) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPolicy = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await legalApi.fetchPolicyById(id);
      setPolicy(data);
    } catch (err) {
      logger.error('Error fetching policy:', err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  return { policy, loading, refetch: fetchPolicy };
};
