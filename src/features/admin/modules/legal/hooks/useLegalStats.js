import { useState, useEffect } from 'react';
import { legalApi } from '../api/legalApi';

export const useLegalStats = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { legalApi.fetchDashboardStats().then(setStats); }, []);
  return { stats, loading: !stats };
};