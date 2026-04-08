
import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { patientsApi } from '../api/patientsApi';

/**
 * Hook for fetching and managing the patients list
 * @param {object} initialFilters 
 * @param {number} initialPage
 * @param {number} initialLimit
 * @returns {object} { patients, loading, error, totalCount, filters, setFilters, page, setPage, limit, setLimit, sort, setSort, refetch }
 */
export const usePatients = (initialFilters = {}, initialPage = 0, initialLimit = 20) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState({ column: 'created_at', direction: 'desc' });

  const fetchPatientsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await patientsApi.fetchPatients({ 
        page, 
        limit, 
        filters, 
        sort 
      });
      setPatients(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      logger.error('Error fetching patients:', err);
      setError(err.message || 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, sort]);

  useEffect(() => {
    fetchPatientsData();
  }, [fetchPatientsData]);

  return {
    patients,
    loading,
    error,
    totalCount,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilters,
    sort,
    setSort,
    refetch: fetchPatientsData
  };
};
