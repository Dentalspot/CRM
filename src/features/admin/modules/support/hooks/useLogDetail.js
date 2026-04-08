import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook for single log detail.
 */
export const useLogDetail = (logId) => {
  const [log, setLog] = useState(null);
  useEffect(() => {
    if (logId) supportApi.fetchLogById(logId).then(setLog);
  }, [logId]);
  return { log, loading: !log };
};