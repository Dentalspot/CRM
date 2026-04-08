import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCommissionCalculation(productId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: transactions, error: err } = await supabase
        .from('marketplace_transactions')
        .select('amount, commission_amount, created_at')
        .eq('product_id', productId);
      if (err) throw err;

      const totalSales = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCommission = (transactions || []).reduce((sum, t) => sum + (t.commission_amount || 0), 0);
      const averageCommission = transactions?.length > 0 ? totalCommission / transactions.length : 0;

      setData({ totalSales, totalCommission, averageCommission, transactions: transactions || [] });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}