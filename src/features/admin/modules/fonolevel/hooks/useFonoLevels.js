import { useState, useEffect, useCallback } from 'react';
import { fonoLevelApi } from '../api/fonoLevelApi';

/**
 * Hook to fetch and manage a list of therapists' DentalLevels.
 * @param {object} initialFilters - Initial filtering and sorting options.
 * @returns {{levels: Array, loading: boolean, error: Error|null, pagination: object, refetch: function}}
 */
export const useDentalLevels = (initialFilters = {}) => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });

  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await fonoLevelApi.fetchTherapistLevels({ ...pagination, filters: initialFilters });
      setLevels(data);
      setPagination(prev => ({ ...prev, total: count }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [initialFilters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  return { levels, loading, error, pagination, refetch: fetchLevels };
};