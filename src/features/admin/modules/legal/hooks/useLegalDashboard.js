import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useLegalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, docsData, policiesData] = await Promise.all([
        legalApi.fetchDashboardStats(),
        legalApi.fetchDocuments({ limit: 5 }),
        legalApi.fetchPolicies({ limit: 5 }),
      ]);
      setStats(statsData);
      setRecentDocs(docsData.data);
      setPolicies(policiesData.data);
    } catch (err) {
      logger.error('Error loading legal dashboard:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { stats, recentDocs, policies, loading, refresh: fetchAll };
};
