import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { marketingApi } from '../api/marketingApi';

export const useMarketingDashboard = () => {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, campaignsRes, analyticsRes] = await Promise.allSettled([
        marketingApi.fetchSubscriberStats(),
        marketingApi.fetchCampaigns({ limit: 5 }),
        marketingApi.fetchEmailAnalytics('monthly'),
      ]);
      setStats(statsRes.status === 'fulfilled' ? statsRes.value : null);
      setCampaigns(campaignsRes.status === 'fulfilled' ? campaignsRes.value.data || [] : []);
      setAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value : null);
    } catch (err) {
      logger.error('[useMarketingDashboard] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { stats, campaigns, analytics, loading, error, refresh: fetchAll };
};
