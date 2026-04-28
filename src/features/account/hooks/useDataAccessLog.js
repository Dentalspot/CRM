import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook que devuelve el log de accesos/modificaciones a los datos del paciente.
 * Solo aplica para rol patient.
 */
export const useDataAccessLog = (limit = 50, enabled = true) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLog = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_my_data_access_log', { p_limit: limit });
      if (rpcErr) throw rpcErr;
      setEntries(data || []);
    } catch (err) {
      logger.warn('[useDataAccessLog] error:', err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  return { entries, loading, error, refresh: fetchLog };
};
