/**
 * @file useMarketplaceDashboard.js
 * @description Hook centralizado para el dashboard de Marketplace@dentalspot.cl.
 * Agrega métricas reales desde marketplace_purchases, marketplace_payouts,
 * marketplace_items y wallet_transactions.
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const COMMISSION_RATE = 0.10;

export const useMarketplaceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [purchasesRes, payoutsRes, productsRes, pendingProductsRes] = await Promise.allSettled([
        // All purchases this month
        supabase
          .from('marketplace_purchases')
          .select('*, buyer:profiles!marketplace_purchases_buyer_id_fkey(full_name), plan:marketplace_plans!marketplace_purchases_marketplace_plan_id_fkey(name)')
          .order('created_at', { ascending: false })
          .limit(200),
        // Pending payouts
        supabase
          .from('marketplace_payouts')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),
        // Active products count
        supabase
          .from('marketplace_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        // Pending approval products
        supabase
          .from('marketplace_items')
          .select('*')
          .eq('is_approved', false)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Process purchases
      const allPurchases = purchasesRes.status === 'fulfilled' ? (purchasesRes.value.data || []) : [];
      const completed = allPurchases.filter(p => p.payment_status === 'completed');
      const monthPurchases = completed.filter(p => new Date(p.created_at) >= startOfMonth);
      const paidMonthPurchases = monthPurchases.filter(p => p.payment_method !== 'free');

      const totalVolumeMonth = monthPurchases.reduce((sum, p) => sum + (p.price_paid || 0), 0);
      const totalCommissionsMonth = paidMonthPurchases.reduce((sum, p) => sum + Math.round((p.price_paid || 0) * COMMISSION_RATE), 0);

      const payoutsData = payoutsRes.status === 'fulfilled' ? (payoutsRes.value.data || []) : [];

      setRecentSales(allPurchases.slice(0, 8));
      setPendingWithdrawals(payoutsData);
      setPendingProducts(pendingProductsRes.status === 'fulfilled' ? (pendingProductsRes.value.data || []) : []);
      setMetrics({
        totalVolumeMonth,
        totalSalesMonth: monthPurchases.length,
        commissionRevenue: totalCommissionsMonth,
        pendingCommissions: 0,
        pendingWithdrawalsAmount: payoutsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        pendingWithdrawalsCount: payoutsData.length,
        activeProducts: productsRes.status === 'fulfilled' ? (productsRes.value.count || 0) : 0,
      });

    } catch (err) {
      logger.error('[useMarketplaceDashboard] Critical error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    metrics, recentSales, pendingWithdrawals, pendingProducts,
    loading, error, refresh: fetchAll,
  };
};
