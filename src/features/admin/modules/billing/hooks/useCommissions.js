import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPaid: 0, pending: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*, wallet:wallets(user_id, user:profiles!wallets_user_id_fkey(full_name, email))')
        .in('reference_type', ['sale', 'purchase'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCommissions(data || []);

      const totalPaid = (data || []).filter(t => t.type === 'credit' && t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0);
      const pending = (data || []).filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats({ totalPaid, pending });
    } catch (err) {
      logger.error('useCommissions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { commissions, loading, stats, refetch: fetchData };
};
