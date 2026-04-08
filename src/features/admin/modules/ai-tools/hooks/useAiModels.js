import { useState, useEffect, useCallback } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to manage AI model listing — reads from ai_settings table.
 */
export const useAiModels = (filters = {}) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiToolsApi.fetchModels(filters);
      setModels(res.data || []);
    } catch (e) {
      console.error('useAiModels fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  return { models, loading, refetch: fetchModels };
};
