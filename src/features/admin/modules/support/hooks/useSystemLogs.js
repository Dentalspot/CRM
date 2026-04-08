import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook to fetch system logs.
 */
export const useSystemLogs = (filters) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportApi.fetchSystemLogs(filters).then(res => {
      setLogs(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { logs, loading };
};