import { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../api/billingApi';

export const usePayments = (initialFilters = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await billingApi.fetchPayments({
        page: pagination.page,
        limit: pagination.limit,
        filters,
      });
      setPayments(data);
      setPagination(prev => ({ ...prev, total: count }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processRefund = async (id) => {
    try {
      await billingApi.processRefund(id);
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  return { payments, loading, error, pagination, setPage: (p) => setPagination(prev => ({ ...prev, page: p })), setFilters, processRefund, refetch: fetchData };
};
