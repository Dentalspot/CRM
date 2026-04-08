import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useMarketplaceMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    marketplaceApi.fetchMetrics().then(setMetrics);
  }, []);
  return { metrics, loading: !metrics };
};