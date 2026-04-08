/**
 * @file useSupportDashboard.js
 * @description Hook centralizado para el dashboard de Debug@dentalspot.cl.
 * Agrega métricas reales desde support_tickets, support_incidents,
 * audit_logs y profiles vía supportApi.
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supportApi } from '../api/supportApi';

export const useSupportDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, ticketsRes, incidentsRes, healthRes] = await Promise.allSettled([
        supportApi.fetchDashboardMetrics(),
        supportApi.fetchTickets({ page: 0, limit: 6, status: 'open' }),
        supportApi.fetchIncidents({ page: 0, limit: 5 }),
        supportApi.fetchSystemHealth(),
      ]);

      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null);
      setRecentTickets(ticketsRes.status === 'fulfilled' ? ticketsRes.value.data || [] : []);
      setActiveIncidents(incidentsRes.status === 'fulfilled' ? incidentsRes.value.data || [] : []);
      setSystemHealth(healthRes.status === 'fulfilled' ? healthRes.value : null);

    } catch (err) {
      logger.error('[useSupportDashboard] Critical error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    metrics, recentTickets, activeIncidents, systemHealth,
    loading, error, refresh: fetchAll,
  };
};
