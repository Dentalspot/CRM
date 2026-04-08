import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.fetchCoupons().then(setCoupons).finally(() => setLoading(false));
  }, []);

  return { coupons, loading };
};