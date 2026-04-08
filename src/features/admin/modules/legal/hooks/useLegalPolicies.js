import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useLegalPolicies = (params = {}) => {
  const [policies, setPolicies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await legalApi.fetchPolicies(params);
      setPolicies(data);
      setTotalCount(count);
    } catch (err) {
      logger.error('Error fetching policies:', err);
    }
    setLoading(false);
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  return { policies, totalCount, loading, refetch: fetchPolicies };
};
