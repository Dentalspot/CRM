import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useCommissions = (filters) => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.fetchCommissions(filters).then(res => {
      setCommissions(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { commissions, loading, approve: marketplaceApi.approveCommission };
};