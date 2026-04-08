/**
 * @file useAiDashboard.js
 * @description Hook centralizado para el dashboard de IA@dentalspot.cl.
 * Usa aiToolsApi (actualmente mock, preparado para tablas reales).
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { aiToolsApi } from '../api/aiToolsApi';

export const useAiDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [models, setModels] = useState([]);
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, modelsRes, jobsRes] = await Promise.allSettled([
        aiToolsApi.fetchUsageStats('monthly'),
        aiToolsApi.fetchModels({ page: 0, limit: 5 }),
        aiToolsApi.fetchTrainingJobs({ page: 0, limit: 5 }),
      ]);

      setMetrics(statsRes.status === 'fulfilled' ? statsRes.value : null);
      setModels(modelsRes.status === 'fulfilled' ? modelsRes.value.data || [] : []);
      setTrainingJobs(jobsRes.status === 'fulfilled' ? jobsRes.value.data || [] : []);
    } catch (err) {
      logger.error('[useAiDashboard] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { metrics, models, trainingJobs, loading, error, refresh: fetchAll };
};
