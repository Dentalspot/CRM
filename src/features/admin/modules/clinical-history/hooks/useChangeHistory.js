import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useChangeHistory = (recordId) => {
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChanges = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      // Query admin_audit_logs for changes related to this record
      const { data, error: fetchError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .contains('details', { recordId })
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        logger.warn('Change history fetch error:', fetchError);
        setChangeHistory([]);
      } else {
        setChangeHistory(data || []);
      }
      setError(null);
    } catch (err) {
      logger.error('Error fetching change history:', err);
      setError(err);
      setChangeHistory([]);
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchChanges(); }, [fetchChanges]);

  return { changeHistory, loading, error, refetch: fetchChanges };
};
