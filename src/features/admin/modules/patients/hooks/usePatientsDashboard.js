/**
 * @file usePatientsDashboard.js
 * @description Hook centralizado para el dashboard de Pacientes@dentalspot.cl.
 * Agrega métricas reales desde patients y profiles.
 */

import { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api/patientsApi';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const usePatientsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [patientsRes, metricsRes] = await Promise.allSettled([
        patientsApi.fetchPatients({ page: 0, limit: 8 }),
        (async () => {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
          const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const [totalRes, activeRes, monthRes, therapistsRes] = await Promise.all([
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
            supabase.from('patients').select('therapist_id').then(res => {
              const unique = new Set((res.data || []).map(r => r.therapist_id).filter(Boolean));
              return unique.size;
            }),
          ]);

          return {
            totalPatients: totalRes.count || 0,
            activePatients: activeRes.count || 0,
            newThisMonth: monthRes.count || 0,
            therapistsWithPatients: therapistsRes || 0,
          };
        })(),
      ]);

      let recent = patientsRes.status === 'fulfilled' ? patientsRes.value.data || [] : [];

      // Fetch therapist names (FK points to users, not profiles)
      if (recent.length) {
        const therapistIds = [...new Set(recent.map(p => p.therapist_id).filter(Boolean))];
        if (therapistIds.length) {
          const { data: therapists } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', therapistIds);
          const map = {};
          (therapists || []).forEach(t => { map[t.id] = t; });
          recent.forEach(p => { p.therapist = map[p.therapist_id] || null; });
        }
      }

      setRecentPatients(recent);
      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null);

    } catch (err) {
      logger.error('[usePatientsDashboard] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { metrics, recentPatients, loading, error, refresh: fetchAll };
};
