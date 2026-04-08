import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useWithdrawals = (filters) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.fetchWithdrawals(filters).then(res => {
      setWithdrawals(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { withdrawals, loading };
};