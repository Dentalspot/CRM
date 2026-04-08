/**
 * @file useClinicalHistoryDashboard.js
 * @description Hook centralizado para el dashboard de Ficha@dentalspot.cl.
 * Agrega métricas reales desde clinical_history, audit_logs y profiles.
 */

import { useState, useEffect, useCallback } from 'react';
import { clinicalHistoryApi } from '../api/clinicalHistoryApi';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useClinicalHistoryDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [recordsRes, metricsRes] = await Promise.allSettled([
        clinicalHistoryApi.fetchClinicalRecords({ page: 0, limit: 8 }),
        (async () => {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
          const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const [totalRes, monthRes, weekRes, therapistsRes] = await Promise.all([
            supabase.from('clinical_history').select('*', { count: 'exact', head: true }),
            supabase.from('clinical_history').select('*', { count: 'exact', head: true }).gte('entry_date', startOfMonth),
            supabase.from('clinical_history').select('*', { count: 'exact', head: true }).gte('entry_date', last7d),
            supabase.from('clinical_history').select('therapist_id').then(res => {
              const unique = new Set((res.data || []).map(r => r.therapist_id).filter(Boolean));
              return unique.size;
            }),
          ]);

          return {
            totalRecords: totalRes.count || 0,
            recordsThisMonth: monthRes.count || 0,
            recordsThisWeek: weekRes.count || 0,
            activeTherapists: therapistsRes || 0,
          };
        })(),
      ]);

      setRecentRecords(recordsRes.status === 'fulfilled' ? recordsRes.value.data || [] : []);
      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null);

    } catch (err) {
      logger.error('[useClinicalHistoryDashboard] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { metrics, recentRecords, loading, error, refresh: fetchAll };
};
