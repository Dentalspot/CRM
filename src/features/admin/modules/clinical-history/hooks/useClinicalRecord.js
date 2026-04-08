import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { clinicalHistoryApi } from '../api/clinicalHistoryApi';

export const useClinicalRecord = (recordId) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecord = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const data = await clinicalHistoryApi.fetchClinicalRecordDetail(recordId);
      setRecord(data);
      setError(null);
    } catch (err) {
      logger.error('Error fetching clinical record:', err);
      setError(err);
      setRecord(null);
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  return { record, loading, error, refetch: fetchRecord };
};
