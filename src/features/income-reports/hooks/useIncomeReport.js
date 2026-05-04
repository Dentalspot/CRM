import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook que carga ingresos desde v_income_summary aplicando filtros.
 * Devuelve también los KPIs agregados y un breakdown por clínica.
 *
 * @param {object} filters - { dateFrom, dateTo, method, therapistId?, clinicId? }
 * @param {string} role - 'therapist' | 'clinic' | 'assistant'
 */
export const useIncomeReport = (filters, role) => {
  const [rows, setRows] = useState([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [clinicsMap, setClinicsMap] = useState({});
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

      // Filtro nuevo: clínica. 'unassigned' = pagos sin clinic_id.
      if (filters.clinicId === 'unassigned') {
        q = q.is('clinic_id', null);
      } else if (filters.clinicId) {
        q = q.eq('clinic_id', filters.clinicId);
      }

      const { data: payments, error: paymentsErr } = await q
        .order('payment_date', { ascending: false })
        .limit(1000);
      if (paymentsErr) throw paymentsErr;

      // 2) Mapa clinic_id → nombre. Nos aseguramos de cargar todas las clínicas
      // referenciadas por los pagos (incluso las no propias del user — útil para
      // dentista que pasó por varias clínicas).
      const clinicIds = Array.from(new Set((payments || []).map(p => p.clinic_id).filter(Boolean)));
      let nameMap = {};
      if (clinicIds.length > 0) {
        const { data: cs } = await supabase
          .from('clinics')
          .select('id, name')
          .in('id', clinicIds);
        nameMap = (cs || []).reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {});
      }
      setClinicsMap(nameMap);

      // Enriquecer rows con clinic_name
      const enriched = (payments || []).map(p => ({
        ...p,
        clinic_name: p.clinic_id ? (nameMap[p.clinic_id] || 'Clínica desconocida') : 'Sin clínica',
      }));
      setRows(enriched);

      // 3) Saldos pendientes (de presupuestos activos, sin filtro temporal)
      let bq = supabase
        .from('v_budget_balance')
        .select('balance_due, status, therapist_id, clinic_id');
      bq = bq.in('status', ['enviado', 'aceptado', 'en_progreso']);
      if (filters.therapistId) bq = bq.eq('therapist_id', filters.therapistId);
      if (filters.clinicId === 'unassigned') {
        bq = bq.is('clinic_id', null);
      } else if (filters.clinicId) {
        bq = bq.eq('clinic_id', filters.clinicId);
      }

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
  }, [filters.dateFrom, filters.dateTo, filters.method, filters.therapistId, filters.clinicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs derivados
  const kpis = useMemo(() => {
    const totalGross = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const totalCommission = rows.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
    const totalNet = rows.reduce((acc, r) => acc + Number(r.net_amount || 0), 0);

    // Breakdown por clínica: { clinic_id|null → { name, gross, net, count } }
    const breakdownMap = new Map();
    for (const r of rows) {
      const key = r.clinic_id || '__unassigned__';
      const name = r.clinic_id ? (clinicsMap[r.clinic_id] || 'Clínica desconocida') : 'Sin clínica';
      const prev = breakdownMap.get(key) || { name, gross: 0, net: 0, commission: 0, count: 0 };
      prev.gross += Number(r.amount || 0);
      prev.net += Number(r.net_amount || 0);
      prev.commission += Number(r.commission_amount || 0);
      prev.count += 1;
      breakdownMap.set(key, prev);
    }
    // Orden: mayor monto primero
    const byClinic = Array.from(breakdownMap.values()).sort((a, b) => b.gross - a.gross);

    return {
      totalGross,
      totalCommission,
      totalNet,
      pendingBalance,
      paymentCount: rows.length,
      byClinic,
    };
  }, [rows, pendingBalance, clinicsMap]);

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

/**
 * Lista las clínicas asociadas al dentista (owned + linked) para el filtro.
 * Para vista clínica se puede pasar enabled=false.
 */
export const useTherapistOwnClinics = (enabled, therapistId) => {
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    if (!enabled || !therapistId) return;
    let mounted = true;

    (async () => {
      try {
        const [ownedRes, linkedRes] = await Promise.all([
          supabase.from('clinics').select('id, name, organization_id').eq('therapist_id', therapistId),
          supabase
            .from('clinic_therapists')
            .select('clinic:clinics(id, name, organization_id)')
            .eq('therapist_id', therapistId)
            .eq('is_active', true),
        ]);
        if (!mounted) return;
        const owned = ownedRes.data || [];
        const linked = (linkedRes.data || []).map(r => r.clinic).filter(Boolean);
        const all = [...owned, ...linked];
        const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
        unique.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClinics(unique);
      } catch (err) {
        logger.warn('[useTherapistOwnClinics] error:', err?.message);
        setClinics([]);
      }
    })();

    return () => { mounted = false; };
  }, [enabled, therapistId]);

  return clinics;
};
