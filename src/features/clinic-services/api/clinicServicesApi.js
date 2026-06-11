/**
 * @file src/features/clinic-services/api/clinicServicesApi.js
 *
 * CRUD del catalogo de servicios de la clinica.
 * Schema: public.services con specialty + RLS clinic-scoped.
 *
 * Principios:
 * - UI Honesty (Constitution §V): insert/update validan .select('id') retorna row.
 * - RLS strict (Constitution §II): assistant no puede mutar (policy en DB).
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

export const SPECIALTIES = [
  { value: 'prevencion', label: 'Prevención' },
  { value: 'operatoria', label: 'Operatoria / Restauradora' },
  { value: 'endodoncia', label: 'Endodoncia' },
  { value: 'periodoncia', label: 'Periodoncia' },
  { value: 'cirugia_oral', label: 'Cirugía Oral' },
  { value: 'ortodoncia', label: 'Ortodoncia' },
  { value: 'odontopediatria', label: 'Odontopediatría' },
  { value: 'estetica', label: 'Estética' },
  { value: 'implantologia', label: 'Implantología' },
  { value: 'protesis_fija', label: 'Prótesis Fija' },
  { value: 'protesis_removible', label: 'Prótesis Removible' },
  { value: 'rehabilitacion_oral', label: 'Rehabilitación Oral' },
  { value: 'radiologia', label: 'Radiología' },
  { value: 'patologia_oral', label: 'Patología Oral' },
  { value: 'otros', label: 'Otros' },
];

export function getSpecialtyLabel(value) {
  return SPECIALTIES.find((s) => s.value === value)?.label || 'Sin especialidad';
}

export async function listClinicsForOrg(organizationId) {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    logger.warn('[clinicServicesApi.listClinicsForOrg] failed', { message: error.message });
    throw error;
  }
  return data || [];
}

export async function listServicesByClinic(clinicId, { includeInactive = false } = {}) {
  let query = supabase
    .from('services')
    .select('id, clinic_id, name, description, specialty, price, currency, duration_minutes, is_active')
    .eq('clinic_id', clinicId)
    .order('specialty', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) {
    logger.warn('[clinicServicesApi.listServicesByClinic] failed', { message: error.message });
    throw error;
  }
  return (data || []).map((s) => ({
    ...s,
    price: Number(s.price) || 0,
    duration_minutes: Number(s.duration_minutes) || 0,
  }));
}

export async function createService(payload) {
  const required = ['clinic_id', 'name'];
  for (const k of required) {
    if (!payload[k]) throw new Error(`Campo requerido: ${k}`);
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      clinic_id: payload.clinic_id,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      specialty: payload.specialty || null,
      price: Number(payload.price) || 0,
      currency: payload.currency || 'CLP',
      duration_minutes: Number(payload.duration_minutes) || null,
      is_active: payload.is_active !== false,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.warn('[clinicServicesApi.createService] failed', { message: error?.message });
    throw error || new Error('No se pudo crear el servicio (RLS rechazo)');
  }
  return data;
}

export async function updateService(serviceId, patch) {
  const { data, error } = await supabase
    .from('services')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.description !== undefined && { description: patch.description?.trim() || null }),
      ...(patch.specialty !== undefined && { specialty: patch.specialty || null }),
      ...(patch.price !== undefined && { price: Number(patch.price) || 0 }),
      ...(patch.currency !== undefined && { currency: patch.currency }),
      ...(patch.duration_minutes !== undefined && {
        duration_minutes: Number(patch.duration_minutes) || null,
      }),
      ...(patch.is_active !== undefined && { is_active: patch.is_active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select('id')
    .single();

  if (error || !data) {
    logger.warn('[clinicServicesApi.updateService] failed', { message: error?.message });
    throw error || new Error('No se pudo actualizar (RLS rechazo o servicio inexistente)');
  }
  return data;
}

/**
 * Soft delete: marca is_active=false. Preserva referencias historicas
 * (treatment_budget_items.service_id sigue funcionando).
 */
export async function deactivateService(serviceId) {
  return updateService(serviceId, { is_active: false });
}

export async function reactivateService(serviceId) {
  return updateService(serviceId, { is_active: true });
}

/**
 * Hard delete: solo si NO esta usado por ningun budget item ni appointment.
 * Si esta usado → throw con mensaje claro para que la UI ofrezca desactivar.
 */
export async function deleteServiceIfUnused(serviceId) {
  const [{ count: budgetUses }, { count: appointmentUses }] = await Promise.all([
    supabase
      .from('treatment_budget_items')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', serviceId),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', serviceId),
  ]);

  if ((budgetUses || 0) > 0 || (appointmentUses || 0) > 0) {
    throw new Error(
      'Este servicio ya se uso en presupuestos o citas. No se puede eliminar — usa "Desactivar" en su lugar.',
    );
  }

  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) {
    logger.warn('[clinicServicesApi.deleteServiceIfUnused] failed', { message: error.message });
    throw error;
  }
}

export function groupServicesBySpecialty(services) {
  const groups = new Map();
  for (const spec of SPECIALTIES) {
    groups.set(spec.value, { label: spec.label, items: [] });
  }
  groups.set('_sin_especialidad', { label: 'Sin especialidad', items: [] });

  for (const svc of services) {
    const key = svc.specialty || '_sin_especialidad';
    if (!groups.has(key)) {
      groups.set(key, { label: getSpecialtyLabel(svc.specialty), items: [] });
    }
    groups.get(key).items.push(svc);
  }

  return Array.from(groups.entries())
    .filter(([, g]) => g.items.length > 0)
    .map(([value, g]) => ({ value, label: g.label, items: g.items }));
}
