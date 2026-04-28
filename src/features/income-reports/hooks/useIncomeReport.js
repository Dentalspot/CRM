import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook que carga ingresos desde v_income_summary aplicando filtros.
 * Devuelve también los KPIs agregados.
 *
 * @param {object} filters - { dateFrom, dateTo, method, therapistId? }
 * @param {string} role - 'therapist' | 'clinic' | 'assistant'
 */
export const useIncomeReport = (filters, role) => {
  const [rows, setRows] = useState([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Pagos del período
      let q = supabase.from('v_income_summary').select('*');
      if (filters.dateFrom) q = q.gte('payment_date', filters.dateFrom);
      if (filters.dateTo) q = q.lte('payment_date', filters.dateTo);
      if (filters.method) q = q.eq('payment_method', filters.method);
      if (filters.therapistId) q = q.eq('therapist_id', filters.therapistId);

      const { data: payments, error: paymentsErr } = await q
        .order('payment_date', { ascending: false })
        .limit(1000);
      if (paymentsErr) throw paymentsErr;

      setRows(payments || []);

      // 2) Saldos pendientes (de presupuestos activos, sin filtro temporal)
      let bq = supabase
        .from('v_budget_balance')
        .select('balance_due, status, therapist_id, clinic_id');
      bq = bq.in('status', ['enviado', 'aceptado', 'en_progreso']);
      if (filters.therapistId) bq = bq.eq('therapist_id', filters.therapistId);

      const { data: balances, error: balErr } = await bq;
      if (balErr) throw balErr;

      const totalPending = (balances || []).reduce(
        (acc, b) => acc + Number(b.balance_due || 0),
        0
      );
      setPendingBalance(totalPending);
    } catch (err) {
      logger.error('[useIncomeReport] error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters.dateFrom, filters.dateTo, filters.method, filters.therapistId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs derivados
  const kpis = useMemo(() => {
    const totalGross = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const totalCommission = rows.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
    const totalNet = rows.reduce((acc, r) => acc + Number(r.net_amount || 0), 0);

    // Si es dentista: relevante "neto"; si es clínica: relevante "comisión retenida"
    return {
      totalGross,
      totalCommission,
      totalNet,
      pendingBalance,
      paymentCount: rows.length,
    };
  }, [rows, pendingBalance]);

  return {
    rows,
    kpis,
    loading,
    error,
    refresh: fetchData,
  };
};

/**
 * Lista los dentistas disponibles para filtrar (usado en vista clínica).
 */
export const useClinicTherapists = (enabled, clinicId) => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    setLoading(true);

    let q = supabase
      .from('clinic_therapists')
      .select('therapist_id, therapist:therapist_id(id, full_name)')
      .eq('is_active', true);
    if (clinicId) q = q.eq('clinic_id', clinicId);

    q.then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        logger.warn('[useClinicTherapists] error:', error);
        setTherapists([]);
      } else {
        const list = (data || []).map(r => r.therapist).filter(Boolean);
        setTherapists(list);
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [enabled, clinicId]);

  return { therapists, loading };
};
