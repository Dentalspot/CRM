
import { useState, useRef, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supportApi } from '../api/supportApi';

/**
 * Hook to search users for support purposes.
 */
export const useUserSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const search = useCallback((query) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query || query.trim() === '') {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(async () => {
      try {
        const data = await supportApi.searchUsers(query);
        setResults(data || []);
      } catch (err) {
        logger.error('Error in useUserSearch:', err);
        setError(err.message || 'Error al buscar usuarios');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  return { results, loading, error, search };
};
