import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useSales = (filters) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.fetchSales(filters).then(res => {
      setSales(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { sales, loading, refetch: () => {} };
};