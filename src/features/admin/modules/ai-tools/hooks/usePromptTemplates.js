import { useState, useEffect, useCallback } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook for prompt engineering management — auto-fetches from ai_prompt_templates.
 */
export const usePromptTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiToolsApi.fetchPromptTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.error('usePromptTemplates fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const saveTemplate = async (tpl) => {
    const result = await aiToolsApi.savePromptTemplate(tpl);
    await fetchTemplates();
    return result;
  };

  const deleteTemplate = async (id) => {
    await aiToolsApi.deletePromptTemplate(id);
    await fetchTemplates();
  };

  return { templates, saveTemplate, deleteTemplate, loading, refetch: fetchTemplates };
};
