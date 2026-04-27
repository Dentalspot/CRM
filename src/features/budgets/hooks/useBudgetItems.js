import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Lista los items de un presupuesto.
 * Usado en la vista expandible (paciente y dentista).
 */
export const useBudgetItems = (budgetId, enabled = true) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!budgetId || !enabled) return;
    let mounted = true;
    setLoading(true);

    supabase
      .from('treatment_budget_items')
      .select('id, description, quantity, unit_price, subtotal, sort_order')
      .eq('budget_id', budgetId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          logger.warn('[useBudgetItems] error:', error);
          setItems([]);
        } else {
          setItems(data || []);
        }
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [budgetId, enabled]);

  return { items, loading };
};
