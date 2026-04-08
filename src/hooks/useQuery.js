import logger from '@/lib/utils/logger';
import { useState, useEffect, useCallback } from 'react';

const useQuery = (key, queryFn, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(options.enabled !== false);

  const fetchData = useCallback(async () => {
    if (options.enabled === false) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err);
      logger.error(`Error in useQuery for key "${key}":`, err);
    } finally {
      setLoading(false);
    }
  }, [key, options.enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
};

export default useQuery;