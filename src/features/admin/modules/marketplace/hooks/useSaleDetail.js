import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useSaleDetail = (saleId) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saleId) {
      marketplaceApi.fetchSaleById(saleId).then(data => {
        setSale(data);
        setLoading(false);
      });
    }
  }, [saleId]);

  return { sale, loading };
};