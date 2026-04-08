import { useState, useEffect } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook for token and cost usage stats.
 */
export const useAiUsageStats = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    aiToolsApi.fetchUsageStats('monthly').then(setStats);
  }, []);

  return { stats, loading: !stats };
};