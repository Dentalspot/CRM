import { useState, useEffect, useCallback } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to fetch evaluation reports from ai_feedback table.
 */
export const useAiEvaluations = () => {
  const [evaluations, setEvaluations] = useState({ items: [], stats: {} });
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiToolsApi.fetchEvaluations();
      setEvaluations(data || { items: [], stats: {} });
    } catch (e) {
      console.error('useAiEvaluations fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  return { evaluations, loading, refetch: fetchEvaluations };
};
