import { useState, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useLegalSearch = () => {
  const [results, setResults] = useState({ documents: [], policies: [] });
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await legalApi.searchLegal(query);
      setResults(data);
    } catch (err) {
      logger.error('Legal search error:', err);
    }
    setLoading(false);
  }, []);

  return { results, loading, search };
};
