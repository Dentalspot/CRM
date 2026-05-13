import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { notifyBudgetSent, notifyBudgetAccepted } from './useBudgetNotifications';

/**
 * Hook para listar presupuestos de un paciente y refrescar.
 * Lee desde v_budget_balance para incluir saldo (total_paid, balance_due).
 */
export const useBudgets = (patientId) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('v_budget_balance')
        .select('*')
        .eq('patient_id', patientId)
        .order('budget_number', { ascending: false });

      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err) {
      logger.error('[useBudgets] error fetching:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, loading, error, refresh: fetchBudgets };
};

/**
 * Crear presupuesto + items en una transacción lógica.
 * payload: {
 *   patient_id, therapist_id, clinic_id?, title, description?,
 *   discount_percentage, currency?, items: [{ description, quantity, unit_price, service_id? }]
 * }
 */
export const createBudget = async (payload) => {
  const { items = [], ...header } = payload;

  // B4 fix: resolver clinic_id si no vino en el payload.
  // El tenancy de treatment_budgets se ancla en clinic_id (ver RLS budgets_team_select
  // en migration 20260425000007). Si queda NULL, el clinic_admin/asistente/colegas
  // del therapist no ven el presupuesto (solo el dentista dueño vía budgets_therapist_all).
  // Cascada de resolución:
  //   1) team_members → clínica donde el therapist es miembro activo (caso invitado)
  //   2) clinics.therapist_id → clínica propia del dentista (caso dentista solo)
  let resolvedClinicId = header.clinic_id || null;
  if (!resolvedClinicId && header.therapist_id) {
    try {
      const { data: tm } = await supabase
        .from('team_members')
        .select('clinic_id')
        .eq('user_id', header.therapist_id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (tm?.clinic_id) {
        resolvedClinicId = tm.clinic_id;
      } else {
        const { data: ownClinic } = await supabase
          .from('clinics')
          .select('id')
          .eq('therapist_id', header.therapist_id)
          .limit(1)
          .maybeSingle();
        if (ownClinic?.id) {
          resolvedClinicId = ownClinic.id;
        }
      }
    } catch (lookupErr) {
      logger.warn('[createBudget] no pude resolver clinic_id automáticamente:', lookupErr);
    }
  }

  // 1) Insertar header
  const { data: budget, error: budgetError } = await supabase
    .from('treatment_budgets')
    .insert({
      patient_id: header.patient_id,
      therapist_id: header.therapist_id,
      clinic_id: resolvedClinicId,
      title: header.title,
      description: header.description || null,
      discount_percentage: header.discount_percentage || 0,
      currency: header.currency || 'CLP',
      status: header.status || 'borrador',
      created_by: header.therapist_id,
      sent_at: header.status === 'enviado' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (budgetError) throw budgetError;

  // 2) Insertar items (si hay)
  if (items.length > 0) {
    const itemsPayload = items.map((it, idx) => ({
      budget_id: budget.id,
      service_id: it.service_id || null,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: Number(it.quantity) * Number(it.unit_price),
      sort_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from('treatment_budget_items')
      .insert(itemsPayload);

    if (itemsError) {
      // Rollback manual: borrar el header si falla el insert de items
      await supabase.from('treatment_budgets').delete().eq('id', budget.id);
      throw itemsError;
    }
  }

  // Notificaciones (fire-and-forget) cuando se crea directamente como "enviado"
  if (budget.status === 'enviado') {
    try {
      const { data: pat } = await supabase
        .from('patients')
        .select('profile_id')
        .eq('id', budget.patient_id)
        .single();
      notifyBudgetSent({ budget, patientProfileId: pat?.profile_id });
    } catch (err) {
      // ignore — no bloquea creación
    }
  }

  return budget;
};

/**
 * Cargar header + items de un presupuesto (para edición).
 */
export const fetchBudgetWithItems = async (budgetId) => {
  const { data: budget, error: budgetErr } = await supabase
    .from('treatment_budgets')
    .select('*')
    .eq('id', budgetId)
    .single();
  if (budgetErr) throw budgetErr;

  const { data: items, error: itemsErr } = await supabase
    .from('treatment_budget_items')
    .select('*')
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true });
  if (itemsErr) throw itemsErr;

  return { budget, items: items || [] };
};

/**
 * Actualizar presupuesto: reemplaza header + items.
 * Solo permitido si status = 'borrador' (validado en el caller).
 */
export const updateBudget = async (budgetId, payload) => {
  const { items = [], ...header } = payload;

  // 1) Update header
  // B4 fix: NO actualizamos clinic_id en updates. El clinic_id es la ancla de tenancy
  // (ver RLS budgets_team_select) y se setea en createBudget. Permitir que el form lo
  // sobrescriba a NULL —porque el state arranca null y el form no expone setter UI—
  // dejaba presupuestos huérfanos del team al editar.
  const { error: updErr } = await supabase
    .from('treatment_budgets')
    .update({
      title: header.title,
      description: header.description || null,
      discount_percentage: header.discount_percentage || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId);
  if (updErr) throw updErr;

  // 2) Replace items: delete all + insert new
  const { error: delErr } = await supabase
    .from('treatment_budget_items')
    .delete()
    .eq('budget_id', budgetId);
  if (delErr) throw delErr;

  if (items.length > 0) {
    const itemsPayload = items.map((it, idx) => ({
      budget_id: budgetId,
      service_id: it.service_id || null,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: Number(it.quantity) * Number(it.unit_price),
      sort_order: idx,
    }));
    const { error: insErr } = await supabase
      .from('treatment_budget_items')
      .insert(itemsPayload);
    if (insErr) throw insErr;
  }
};

/**
 * Aceptar un presupuesto (transición enviado → aceptado).
 * Usa RPC SECURITY DEFINER porque el paciente no tiene UPDATE directo.
 */
export const acceptBudget = async (budgetId) => {
  const { error } = await supabase.rpc('accept_budget', { p_budget_id: budgetId });
  if (error) throw error;

  // Notificación al dentista (fire-and-forget)
  try {
    const { data: budget } = await supabase
      .from('treatment_budgets')
      .select('id, budget_number, title, therapist_id, patient_id')
      .eq('id', budgetId)
      .single();

    if (budget) {
      const { data: pat } = await supabase
        .from('patients')
        .select('profile_id')
        .eq('id', budget.patient_id)
        .single();
      let patientName = 'Paciente';
      if (pat?.profile_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', pat.profile_id)
          .single();
        if (prof?.full_name) patientName = prof.full_name;
      }
      notifyBudgetAccepted({ budget, patientName });
    }
  } catch (err) {
    // ignore — no bloquea
  }
};

/**
 * Cancelar un presupuesto (cambia status, no borra).
 */
export const cancelBudget = async (budgetId) => {
  const { error } = await supabase
    .from('treatment_budgets')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', budgetId);

  if (error) throw error;
};

/**
 * Cambiar status (borrador → enviado, etc).
 */
export const updateBudgetStatus = async (budgetId, newStatus) => {
  const updates = { status: newStatus, updated_at: new Date().toISOString() };
  if (newStatus === 'enviado') updates.sent_at = new Date().toISOString();
  if (newStatus === 'aceptado') updates.accepted_at = new Date().toISOString();
  if (newStatus === 'pagado') updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from('treatment_budgets')
    .update(updates)
    .eq('id', budgetId);

  if (error) throw error;

  // Si el cambio es a "enviado", notificar al paciente
  if (newStatus === 'enviado') {
    try {
      const { data: budget } = await supabase
        .from('treatment_budgets')
        .select('id, budget_number, title, total, currency, patient_id, therapist_id')
        .eq('id', budgetId)
        .single();
      if (budget) {
        const { data: pat } = await supabase
          .from('patients')
          .select('profile_id')
          .eq('id', budget.patient_id)
          .single();
        notifyBudgetSent({ budget, patientProfileId: pat?.profile_id });
      }
    } catch (err) {
      // ignore — no bloquea
    }
  }
};
