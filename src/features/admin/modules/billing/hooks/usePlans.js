import { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../api/billingApi';

export const usePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingApi.fetchPlans();
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const savePlan = async (planData) => {
    const data = await billingApi.upsertPlan(planData);
    await fetchData();
    return data;
  };

  const deletePlan = async (id) => {
    await billingApi.deletePlan(id);
    await fetchData();
  };

  return { plans, loading, error, savePlan, deletePlan, refetch: fetchData };
};
