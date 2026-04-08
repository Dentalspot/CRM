import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook for error statistics and trends.
 */
export const useErrorAnalysis = (period) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    supportApi.fetchErrorStats(period).then(setStats);
  }, [period]);
  return { stats, loading: !stats };
};