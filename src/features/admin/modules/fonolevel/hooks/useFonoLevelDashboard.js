/**
 * @file useDentalLevelDashboard.js
 * @description Hook centralizado para DentalLevel@dentalspot.cl.
 * Intenta RPCs reales, fallback graceful si no existen.
 */
import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useDentalLevelDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [topTherapists, setTopTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, therapistsRes] = await Promise.allSettled([
        (async () => {
          const [totalRes, verifiedRes, specialtiesRes] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist').eq('is_verified', true),
            supabase.from('specialties').select('*', { count: 'exact', head: true }),
          ]);
          return {
            totalTherapists: totalRes.count || 0,
            verifiedTherapists: verifiedRes.count || 0,
            totalSpecialties: specialtiesRes.count || 0,
          };
        })(),
        supabase
          .from('profiles')
          .select('id, full_name, role, is_verified, created_at')
          .eq('role', 'therapist')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : null);
      setTopTherapists(therapistsRes.status === 'fulfilled' ? therapistsRes.value.data || [] : []);
    } catch (err) {
      logger.error('[useDentalLevelDashboard] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { metrics, topTherapists, loading, error, refresh: fetchAll };
};
