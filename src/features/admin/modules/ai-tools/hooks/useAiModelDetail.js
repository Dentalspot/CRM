import { useState, useEffect } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to fetch specific model details.
 * Use: const { model, loading } = useAiModelDetail('gpt-4');
 */
export const useAiModelDetail = (modelId) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!modelId) return;
    aiToolsApi.fetchModelById(modelId).then(data => {
      setModel(data);
      setLoading(false);
    });
  }, [modelId]);

  return { model, loading };
};