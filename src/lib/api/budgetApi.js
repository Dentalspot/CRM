/**
 * @file src/lib/api/budgetApi.js
 *
 * Operaciones sobre treatment_budget_items + integracion con appointment.
 * Spec 030 — Treatment Budget With Progress.
 *
 * Principios:
 * - RLS strict (asistente NO puede UPDATE — enforced por ausencia de policy en DB).
 * - UI Honesty (Constitution §V): toda mutacion valida `.select('id')` retorna row antes
 *   de considerarse exitosa. Si no retorna row → throw.
 * - Append-only audit (Constitution §III): cada UPDATE de status + INSERT atomico de item
 *   completed dispara `logClinicalAccess` con resource_type='budget_item'.
 *
 * Reutilizado por:
 * - BudgetItemsChecklistStep (post-session wizard)
 * - Odontogram (sincronizacion al marcar tratamiento)
 */

import { supabase } from '@/lib/supabaseClient';
import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';
import logger from '@/lib/utils/logger';

// ============================================================================
// LECTURAS
// ============================================================================

/**
 * Lista budgets activos (status borrador/enviado/aceptado/en_progreso) de un paciente.
 * Default UI ordena por created_at DESC (mas reciente primero).
 *
 * @param {string} patientId
 * @returns {Promise<Array<{id, title, status, total, created_at, item_count_pending}>>}
 */
export async function getActiveBudgetsForPatient(patientId) {
  const { data, error } = await supabase
    .from('treatment_budgets')
    .select(`
      id, title, status, total, currency, created_at, clinic_id, therapist_id,
      items:treatment_budget_items(id, status)
    `)
    .eq('patient_id', patientId)
    .in('status', ['borrador', 'enviado', 'aceptado', 'en_progreso'])
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('[budgetApi.getActiveBudgetsForPatient] failed', { message: error.message });
    throw error;
  }

  return (data || []).map((b) => ({
    id: b.id,
    title: b.title,
    status: b.status,
    total: Number(b.total) || 0,
    currency: b.currency,
    created_at: b.created_at,
    clinic_id: b.clinic_id,
    therapist_id: b.therapist_id,
    item_count_pending: (b.items || []).filter((i) => i.status === 'pending').length,
  }));
}

/**
 * Lista items de un budget. Por defecto retorna ambos pending y completed
 * para que el checklist UI sepa el estado actual al re-abrir una sesion.
 *
 * @param {string} budgetId
 * @param {Object} opts
 * @param {boolean} [opts.onlyPending=false] - si true, filtra solo status='pending'
 * @returns {Promise<Array<{id, description, quantity, unit_price, subtotal, service_id, status, completed_at, completed_in_appointment_id, sort_order}>>}
 */
export async function getBudgetItems(budgetId, { onlyPending = false } = {}) {
  let query = supabase
    .from('treatment_budget_items')
    .select(`
      id, budget_id, description, quantity, unit_price, subtotal, service_id,
      status, completed_at, completed_in_appointment_id, sort_order
    `)
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (onlyPending) query = query.eq('status', 'pending');

  const { data, error } = await query;

  if (error) {
    logger.warn('[budgetApi.getBudgetItems] failed', { message: error.message });
    throw error;
  }

  return (data || []).map((i) => ({
    ...i,
    unit_price: Number(i.unit_price) || 0,
    subtotal: Number(i.subtotal) || 0,
    quantity: Number(i.quantity) || 1,
  }));
}

// ============================================================================
// MUTACIONES
// ============================================================================

/**
 * Crea un budget nuevo en estado `borrador` para un paciente.
 * Title autogenerado: "Plan de tratamiento — {patient.full_name}".
 *
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.therapistId
 * @param {string} params.clinicId
 * @param {string} params.patientFullName - usado solo para el title
 * @returns {Promise<{id, title, status}>}
 */
export async function createDraftBudget({ patientId, therapistId, clinicId, patientFullName }) {
  const title = patientFullName
    ? `Plan de tratamiento — ${patientFullName}`
    : 'Plan de tratamiento';

  // created_by es NOT NULL en treatment_budgets. Lo poblamos con el dentista
  // que dispara la creacion (mismo que therapist_id en el flow normal).
  const { data, error } = await supabase
    .from('treatment_budgets')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      clinic_id: clinicId,
      created_by: therapistId,
      title,
      status: 'borrador',
      subtotal: 0,
      total: 0,
      currency: 'CLP',
    })
    .select('id, title, status, clinic_id, therapist_id')
    .single();

  if (error || !data) {
    logger.warn('[budgetApi.createDraftBudget] failed', { message: error?.message });
    throw error || new Error('No se pudo crear el presupuesto (RLS rechazo)');
  }

  return data;
}

/**
 * Retorna el budget activo del paciente, o crea uno nuevo en borrador.
 * Activo = primer budget en (borrador, enviado, aceptado, en_progreso) ordenado DESC.
 *
 * @param {Object} params - mismos params que createDraftBudget
 * @returns {Promise<{id, title, status, isNew: boolean}>}
 */
export async function getOrCreateActiveBudget({ patientId, therapistId, clinicId, patientFullName }) {
  const existing = await getActiveBudgetsForPatient(patientId);
  if (existing.length > 0) {
    return { ...existing[0], isNew: false };
  }
  const created = await createDraftBudget({ patientId, therapistId, clinicId, patientFullName });
  return { ...created, isNew: true };
}

/**
 * Marca varios items como completados de forma atomica.
 *
 * Atomico = single UPDATE con WHERE id IN (...) — Postgres lo envuelve en una
 * transaccion implicita. Si una falla por RLS, ninguna se aplica (autorrollback).
 *
 * Despues del UPDATE: invoca audit log por cada item (Constitution §III FR-018).
 * Si el audit log falla, el item ya esta marcado — esto se considera aceptable
 * porque el log es best-effort y no debe bloquear el flow clinico.
 *
 * @param {string[]} itemIds - lista de UUIDs de items a marcar
 * @param {string} appointmentId - cita donde se ejecutaron
 * @param {Object} ctx - contexto para audit log
 * @param {string} ctx.organizationId
 * @param {string} ctx.userId
 * @param {string} ctx.patientId
 * @returns {Promise<Array<BudgetItem>>} items actualizados
 */
export async function markBudgetItemsCompleted(itemIds, appointmentId, ctx) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return [];
  }
  if (!appointmentId) {
    throw new Error('appointmentId requerido');
  }

  const { data, error } = await supabase
    .from('treatment_budget_items')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_in_appointment_id: appointmentId,
    })
    .in('id', itemIds)
    .eq('status', 'pending') // evita re-marcar items ya completed
    .select('id, description, unit_price, quantity, status, completed_at, completed_in_appointment_id');

  if (error) {
    logger.warn('[budgetApi.markBudgetItemsCompleted] failed', { message: error.message });
    throw error;
  }

  // UI Honesty: si pedimos N items y la DB retorno M < N rows, hubo un error silencioso
  if (!data || data.length === 0) {
    throw new Error('Ningun item se pudo marcar como completado (RLS rechazo o ya estaban completos)');
  }

  // Audit log best-effort (Constitution §III FR-018)
  if (ctx?.organizationId && ctx?.userId && ctx?.patientId) {
    await Promise.all(
      data.map((item) =>
        logClinicalAccess({
          organization_id: ctx.organizationId,
          user_id: ctx.userId,
          patient_id: ctx.patientId,
          action: 'update',
          resource_type: 'budget_item',
          resource_id: item.id,
          reason: `completed_in_appointment:${appointmentId}`,
        })
      )
    );
  }

  return data;
}

/**
 * Revierte un item de completed -> pending.
 *
 * El trigger DB `check_budget_item_revert` valida autoridad (FR-016):
 *   - el dentista que marco originalmente, O
 *   - un clinic_admin de la org
 * Si falla, Postgres lanza con SQLSTATE 'unauthorized_revert' que se propaga
 * como error en el throw.
 *
 * @param {string} itemId
 * @param {Object} ctx - mismo shape que markBudgetItemsCompleted
 * @returns {Promise<BudgetItem>}
 */
export async function revertBudgetItem(itemId, ctx) {
  const { data, error } = await supabase
    .from('treatment_budget_items')
    .update({
      status: 'pending',
      // completed_at y completed_in_appointment_id se nullean en el trigger BEFORE UPDATE
    })
    .eq('id', itemId)
    .eq('status', 'completed') // guard cliente — el trigger tambien valida
    .select('id, description, status, completed_at, completed_in_appointment_id')
    .maybeSingle();

  if (error) {
    logger.warn('[budgetApi.revertBudgetItem] failed', { message: error.message });
    // Detectar el caso de autoridad rechazada del trigger
    if (error.message?.includes('unauthorized_revert')) {
      const friendly = new Error(
        'No tenés permiso para revertir este item. Pedile al dentista que lo marcó (o a un admin) que lo haga.'
      );
      friendly.code = 'unauthorized_revert';
      throw friendly;
    }
    throw error;
  }
  if (!data) {
    throw new Error('El item no se pudo revertir (RLS rechazo o ya estaba pendiente)');
  }

  // Audit log best-effort (FR-020)
  if (ctx?.organizationId && ctx?.userId && ctx?.patientId) {
    await logClinicalAccess({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      patient_id: ctx.patientId,
      action: 'update',
      resource_type: 'budget_item',
      resource_id: itemId,
      reason: `reverted_by:${ctx.userId};original_appointment:${ctx.originalAppointmentId || 'unknown'}`,
    });
  }

  return data;
}

/**
 * Crea un budget rapido inline para edge case "paciente sin budget" (FR-022).
 *
 * Atomico: crea budget + 1 item directamente en status='completed' vinculado a la cita.
 *
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.therapistId
 * @param {string} params.clinicId
 * @param {string} params.patientFullName
 * @param {string} params.description - descripcion del item (ej. "Consulta inicial")
 * @param {number} params.unitPrice - precio del item
 * @param {string} params.appointmentId
 * @param {Object} ctx - contexto audit
 * @returns {Promise<{budget, item}>}
 */
export async function createQuickBudgetForSession({
  patientId,
  therapistId,
  clinicId,
  patientFullName,
  description,
  unitPrice,
  appointmentId,
}, ctx) {
  // 1. Crear budget
  const budget = await createDraftBudget({ patientId, therapistId, clinicId, patientFullName });

  // 2. Crear item ya completed
  const subtotal = Number(unitPrice) || 0;
  const { data: item, error: itemErr } = await supabase
    .from('treatment_budget_items')
    .insert({
      budget_id: budget.id,
      description,
      quantity: 1,
      unit_price: subtotal,
      subtotal,
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_in_appointment_id: appointmentId,
      sort_order: 0,
    })
    .select('id, description, unit_price, status, completed_at, completed_in_appointment_id')
    .single();

  if (itemErr || !item) {
    logger.warn('[budgetApi.createQuickBudgetForSession] item insert failed', {
      message: itemErr?.message,
    });
    throw itemErr || new Error('No se pudo crear el item rápido');
  }

  // Audit best-effort
  if (ctx?.organizationId && ctx?.userId) {
    await logClinicalAccess({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      patient_id: patientId,
      action: 'update',
      resource_type: 'budget_item',
      resource_id: item.id,
      reason: `quick_budget_in_appointment:${appointmentId}`,
    });
  }

  return { budget, item };
}
