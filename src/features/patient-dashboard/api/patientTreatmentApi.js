/**
 * @file src/features/patient-dashboard/api/patientTreatmentApi.js
 *
 * Spec 030 Bloque 3 — vista paciente "Mi tratamiento".
 *
 * Lee desde el lado del PACIENTE (auth.uid()) los datos de su budget activo,
 * items, balance y las indicaciones que el dentista dejó después de cada sesión.
 *
 * RLS confía en las policies existentes:
 * - `budgets_patient_select` (is_my_patient_record)
 * - `items_select` (transitivo via budget_id)
 * - `pp_patient_select` (is_own_patient)
 * - `ch_patient_select` (is_own_patient)
 *
 * NOTA DE CONFIDENCIALIDAD (deuda Bloque 4):
 * Hoy el paciente puede leer toda `clinical_history.session_notes` (la nota
 * técnica del dentista). Este módulo solo expone `summary` + `details.next_steps`
 * (filtro en CLIENTE, no en RLS). El Bloque 4 introducirá `clinical_notes_private`
 * para mover el control al backend.
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Resuelve el patient.id del paciente logueado (puede haber 1 row en `patients`
 * vinculada a su profile_id).
 *
 * @param {string} authUserId
 * @returns {Promise<string|null>}
 */
async function resolveMyPatientId(authUserId) {
  if (!authUserId) return null;
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn('[patientTreatmentApi.resolveMyPatientId] failed', { message: error.message });
    return null;
  }
  return data?.id || null;
}

/**
 * Lista budgets activos del paciente logueado (status borrador/enviado/aceptado/en_progreso).
 *
 * @param {string} authUserId
 * @returns {Promise<Array<{id, title, status, total, currency, created_at}>>}
 */
async function getMyActiveBudgets(patientId) {
  if (!patientId) return [];
  const { data, error } = await supabase
    .from('treatment_budgets')
    .select('id, title, status, total, currency, created_at, therapist_id')
    .eq('patient_id', patientId)
    .in('status', ['borrador', 'enviado', 'aceptado', 'en_progreso'])
    .order('created_at', { ascending: false });
  if (error) {
    logger.warn('[patientTreatmentApi.getMyActiveBudgets] failed', { message: error.message });
    return [];
  }
  return data || [];
}

/**
 * Lista items de un budget. Para vista paciente.
 *
 * @param {string} budgetId
 * @returns {Promise<Array<{id, description, quantity, unit_price, subtotal, status, completed_at, sort_order}>>}
 */
async function getBudgetItemsForPatient(budgetId) {
  if (!budgetId) return [];
  const { data, error } = await supabase
    .from('treatment_budget_items')
    .select('id, description, quantity, unit_price, subtotal, status, completed_at, sort_order')
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    logger.warn('[patientTreatmentApi.getBudgetItemsForPatient] failed', {
      message: error.message,
    });
    return [];
  }
  return (data || []).map((i) => ({
    ...i,
    unit_price: Number(i.unit_price) || 0,
    subtotal: Number(i.subtotal) || 0,
    quantity: Number(i.quantity) || 1,
  }));
}

/**
 * Lee balance del budget desde v_budget_balance.
 *
 * @param {string} budgetId
 * @returns {Promise<{total, total_paid, balance_due, payment_count}|null>}
 */
async function getBudgetBalanceForPatient(budgetId) {
  if (!budgetId) return null;
  const { data, error } = await supabase
    .from('v_budget_balance')
    .select('total, total_paid, balance_due, payment_count')
    .eq('budget_id', budgetId)
    .maybeSingle();
  if (error) {
    logger.warn('[patientTreatmentApi.getBudgetBalanceForPatient] failed', {
      message: error.message,
    });
    return null;
  }
  if (!data) return null;
  return {
    total: Number(data.total) || 0,
    total_paid: Number(data.total_paid) || 0,
    balance_due: Number(data.balance_due) || 0,
    payment_count: Number(data.payment_count) || 0,
  };
}

/**
 * Lista las últimas N indicaciones que el dentista dejó al paciente.
 * Se leen de `clinical_history.details.next_steps` ordenadas por fecha de sesión.
 *
 * Filtra en CLIENTE: solo retorna `summary` (resumen amable) + `next_steps`
 * (indicaciones explícitas), NO la `session_notes` técnica.
 *
 * @param {string} patientId
 * @param {number} limit
 * @returns {Promise<Array<{id, entry_date, summary, next_steps}>>}
 */
async function getMyRecentIndications(patientId, limit = 5) {
  if (!patientId) return [];
  const { data, error } = await supabase
    .from('clinical_history')
    .select('id, entry_date, summary, details')
    .eq('patient_id', patientId)
    .eq('entry_type', 'sesion')
    .order('entry_date', { ascending: false })
    .limit(limit);
  if (error) {
    logger.warn('[patientTreatmentApi.getMyRecentIndications] failed', {
      message: error.message,
    });
    return [];
  }
  return (data || [])
    .map((entry) => ({
      id: entry.id,
      entry_date: entry.entry_date,
      summary: entry.summary || null,
      next_steps: entry.details?.next_steps || null,
    }))
    .filter((entry) => entry.next_steps); // solo entries con indicaciones reales
}

/**
 * Datos consolidados para la pagina "Mi tratamiento" del paciente.
 *
 * @param {string} authUserId - auth.uid() del paciente logueado
 * @returns {Promise<{
 *   patientId: string|null,
 *   budgets: Array<Budget>,
 *   selectedBudget: Budget|null,
 *   items: Array<Item>,
 *   balance: {total, total_paid, balance_due, payment_count}|null,
 *   indications: Array<{id, entry_date, next_steps}>
 * }>}
 */
export async function getMyTreatmentOverview(authUserId) {
  const patientId = await resolveMyPatientId(authUserId);
  if (!patientId) {
    return {
      patientId: null,
      budgets: [],
      selectedBudget: null,
      items: [],
      balance: null,
      indications: [],
    };
  }

  const budgets = await getMyActiveBudgets(patientId);
  if (budgets.length === 0) {
    const indications = await getMyRecentIndications(patientId);
    return {
      patientId,
      budgets: [],
      selectedBudget: null,
      items: [],
      balance: null,
      indications,
    };
  }

  const selectedBudget = budgets[0];
  const [items, balance, indications] = await Promise.all([
    getBudgetItemsForPatient(selectedBudget.id),
    getBudgetBalanceForPatient(selectedBudget.id),
    getMyRecentIndications(patientId),
  ]);

  return {
    patientId,
    budgets,
    selectedBudget,
    items,
    balance,
    indications,
  };
}

/**
 * Re-fetch items + balance para un budget puntual (si el paciente selecciona otro).
 */
export async function getMyBudgetDetail(budgetId) {
  if (!budgetId) return { items: [], balance: null };
  const [items, balance] = await Promise.all([
    getBudgetItemsForPatient(budgetId),
    getBudgetBalanceForPatient(budgetId),
  ]);
  return { items, balance };
}
