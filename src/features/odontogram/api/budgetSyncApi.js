/**
 * @file src/features/odontogram/api/budgetSyncApi.js
 *
 * Crea/actualiza items del budget cuando el dentista marca tratamientos en el odontograma.
 * Spec 030 — User Story 3: odontograma como entry point para items del presupuesto.
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { getOrCreateActiveBudget } from '@/lib/api/budgetApi';

/**
 * Lookup en therapist_services del dentista por nombre de tratamiento.
 * Match case-insensitive con LIKE (ej. "Endodoncia" matches "ENDODONCIA molar").
 *
 * @param {string} therapistId
 * @param {string} treatmentName
 * @returns {Promise<{service_id: string|null, unit_price: number}>}
 */
export async function findServiceByTreatmentName(therapistId, treatmentName) {
  if (!therapistId || !treatmentName) {
    return { service_id: null, unit_price: 0 };
  }

  const { data, error } = await supabase
    .from('therapist_services')
    .select('id, service_name, price_clp')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .ilike('service_name', `%${treatmentName}%`)
    .order('price_clp', { ascending: false })
    .limit(1);

  if (error) {
    logger.warn('[budgetSyncApi.findServiceByTreatmentName] failed', {
      message: error.message,
    });
    return { service_id: null, unit_price: 0 };
  }

  if (!data || data.length === 0) {
    return { service_id: null, unit_price: 0 };
  }

  return {
    service_id: data[0].id,
    unit_price: Number(data[0].price_clp) || 0,
  };
}

/**
 * Crea un item del budget vinculado a un diente + tratamiento.
 *
 * Logica:
 * 1. Obtiene o crea budget activo del paciente (estado 'borrador').
 * 2. Lookup en therapist_services para autocompletar service_id + unit_price.
 * 3. INSERT en treatment_budget_items con description="{Treatment} diente {tooth}".
 *
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.therapistId
 * @param {string} params.clinicId
 * @param {string} [params.patientFullName] - para title del budget si se crea uno nuevo
 * @param {string|null} [params.tooth] - numero del diente (ej. "36"), null para tratamientos generales
 * @param {string} params.treatment - nombre del tratamiento (ej. "Endodoncia")
 * @returns {Promise<{item: Object, budget: Object, wasNewBudget: boolean}>}
 */
export async function createBudgetItemFromOdontogram({
  patientId,
  therapistId,
  clinicId,
  patientFullName,
  tooth,
  treatment,
}) {
  if (!patientId || !therapistId || !clinicId || !treatment) {
    throw new Error('patientId, therapistId, clinicId y treatment son requeridos');
  }

  // 1. Budget activo (o crear)
  const budget = await getOrCreateActiveBudget({
    patientId,
    therapistId,
    clinicId,
    patientFullName,
  });

  // 2. Lookup servicio
  const { service_id, unit_price } = await findServiceByTreatmentName(therapistId, treatment);

  // 3. Description chilena: "Endodoncia diente 36" o "Limpieza completa" (sin diente)
  const description = tooth
    ? `${treatment} diente ${tooth}`
    : treatment;

  // 4. INSERT item
  const subtotal = unit_price; // quantity default = 1
  const { data: item, error: itemErr } = await supabase
    .from('treatment_budget_items')
    .insert({
      budget_id: budget.id,
      service_id,
      description,
      quantity: 1,
      unit_price,
      subtotal,
      sort_order: 0,
      status: 'pending',
    })
    .select(
      'id, budget_id, service_id, description, quantity, unit_price, subtotal, status, sort_order, created_at'
    )
    .single();

  if (itemErr || !item) {
    logger.warn('[budgetSyncApi.createBudgetItemFromOdontogram] insert failed', {
      message: itemErr?.message,
    });
    throw itemErr || new Error('No se pudo agregar el item al presupuesto (RLS rechazó)');
  }

  return {
    item,
    budget,
    wasNewBudget: budget.isNew === true,
  };
}
