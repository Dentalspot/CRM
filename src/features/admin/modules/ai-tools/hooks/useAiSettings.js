import { useState, useEffect, useCallback } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to manage AI configuration — auto-fetches from ai_settings table.
 */
export const useAiSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiToolsApi.fetchSettings();
      setSettings(data || {});
    } catch (e) {
      console.error('useAiSettings fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (key, value) => {
    const result = await aiToolsApi.updateSettings(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    return result;
  };

  return { settings, saveSettings, loading, refetch: fetchSettings };
};
