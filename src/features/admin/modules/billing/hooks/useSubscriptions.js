import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { billingApi } from '../api/billingApi';

export const useSubscriptions = (initialFilters = {}) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await billingApi.fetchSubscriptions({
        page: pagination.page,
        limit: pagination.limit,
        filters,
      });
      setSubscriptions(data);
      setPagination(prev => ({ ...prev, total: count }));
    } catch (err) {
      logger.error('useSubscriptions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    subscriptions,
    loading,
    error,
    pagination,
    setPage: (page) => setPagination(prev => ({ ...prev, page })),
    setFilters,
    refetch: fetchData,
  };
};
