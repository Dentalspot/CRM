import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { notifyPaymentRegistered, notifyBudgetCompleted } from './useBudgetNotifications';

/**
 * Lista pagos vinculados a un presupuesto.
 */
export const usePayments = (budgetId) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    if (!budgetId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('patient_payments')
        .select('*')
        .eq('budget_id', budgetId)
        .order('payment_date', { ascending: false });
      if (err) throw err;
      setPayments(data || []);
    } catch (err) {
      logger.error('[usePayments] error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refresh: fetchPayments };
};

/**
 * Registrar un pago vinculado a un presupuesto.
 * payload: { budget_id, patient_id, therapist_id, amount, payment_method, payment_date, concept?, notes? }
 */
export const createPayment = async (payload) => {
  const { data, error } = await supabase
    .from('patient_payments')
    .insert({
      budget_id: payload.budget_id,
      patient_id: payload.patient_id,
      therapist_id: payload.therapist_id,
      amount: Math.round(Number(payload.amount)),
      currency: 'CLP',
      payment_method: payload.payment_method,
      payment_date: payload.payment_date,
      status: 'completed',
      concept: payload.concept || null,
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Notificaciones in-app (fire-and-forget)
  try {
    const { data: budget } = await supabase
      .from('treatment_budgets')
      .select('id, budget_number, title, total, currency, patient_id, therapist_id, status')
      .eq('id', payload.budget_id)
      .single();

    if (budget) {
      const { data: pat } = await supabase
        .from('patients')
        .select('profile_id')
        .eq('id', budget.patient_id)
        .single();
      const patientProfileId = pat?.profile_id;

      // Notificación de pago registrado (siempre)
      notifyPaymentRegistered({ budget, amount: payload.amount, patientProfileId });

      // Si el pago llevó al status "pagado" → notificación adicional de presupuesto completo
      // Verificamos status post-INSERT (el trigger DB ya lo actualizó)
      const { data: refreshed } = await supabase
        .from('treatment_budgets')
        .select('status')
        .eq('id', payload.budget_id)
        .single();
      if (refreshed?.status === 'pagado') {
        notifyBudgetCompleted({ budget, patientProfileId });
      }
    }
  } catch (err) {
    // ignore — no bloquea
  }

  return data;
};

/**
 * Eliminar un pago. El trigger DB ajusta el status del budget automáticamente.
 */
export const deletePayment = async (paymentId) => {
  const { error } = await supabase
    .from('patient_payments')
    .delete()
    .eq('id', paymentId);
  if (error) throw error;
};
