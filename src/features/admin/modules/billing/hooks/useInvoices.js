import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*, therapist:profiles!billing_invoices_therapist_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      logger.error('useInvoices error:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { invoices, loading, refetch: fetchData };
};
