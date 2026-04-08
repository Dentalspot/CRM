import { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../api/billingApi';

export const useCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await billingApi.fetchCoupons();
      setCoupons(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createCoupon = async (couponData) => {
    const data = await billingApi.createCoupon(couponData);
    await fetchData();
    return data;
  };

  const updateCoupon = async (id, updates) => {
    const data = await billingApi.updateCoupon(id, updates);
    await fetchData();
    return data;
  };

  return { coupons, loading, error, createCoupon, updateCoupon, refetch: fetchData };
};
