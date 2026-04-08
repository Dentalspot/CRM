import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useAccessLog = (recordId) => {
  const [accessLog, setAccessLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccessLog = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      // Try clinical_access_log first (patient-level)
      const { data, error: fetchError } = await supabase
        .from('clinical_access_log')
        .select('*, accessed_by_profile:profiles!clinical_access_log_accessed_by_fkey(full_name, email)')
        .eq('patient_id', recordId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        logger.warn('Access log fetch error:', fetchError);
        setAccessLog([]);
      } else {
        setAccessLog(data || []);
      }
      setError(null);
    } catch (err) {
      logger.error('Error fetching access log:', err);
      setError(err);
      setAccessLog([]);
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchAccessLog(); }, [fetchAccessLog]);

  return { accessLog, loading, error, refetch: fetchAccessLog };
};
