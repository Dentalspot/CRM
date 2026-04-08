import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook for live system health metrics.
 */
export const useSystemHealth = () => {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    supportApi.fetchSystemHealth().then(setHealth);
  }, []);
  return { health, loading: !health };
};