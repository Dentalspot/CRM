import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useLegalSignatures = (params = {}) => {
  const [signatures, setSignatures] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSigs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await legalApi.fetchSignatures(params);
      setSignatures(data);
      setTotalCount(count);
    } catch (err) {
      logger.error('Error fetching signatures:', err);
    }
    setLoading(false);
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchSigs(); }, [fetchSigs]);

  return { signatures, totalCount, loading, refetch: fetchSigs };
};
