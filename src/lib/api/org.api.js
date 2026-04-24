/**
 * @file src/lib/api/org.api.js
 *
 * Módulo API para queries scopeadas por `organization_id`. Paralelo a
 * `src/features/therapist/services/therapist.api.js` pero pensado para roles
 * que operan a nivel de organización completa (assistant, clinic_admin).
 *
 * Contrato: specs/024-assistant-rich-calendar/contracts/org-calendar-api.md
 *
 * Principios:
 * - Todas las funciones confían en RLS (no hacen verificación manual de auth)
 * - Errores se throw (nunca return null)
 * - SELECTs retornan `[]` en lugar de null
 * - Mutaciones retornan la row afectada (para verificar data.length > 0 — UI Honesty)
 *
 * Reutilizado por:
 * - AssistantCalendarPage (spec 024)
 * - ClinicAdminCalendarPage (spec 025 futuro)
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

// ============================================================================
// SELECTS
// ============================================================================

/**
 * Lista dentistas activos de una organización.
 * @param {string} organizationId
 * @returns {Promise<Array<{id: string, full_name: string, email: string}>>}
 */
export async function getOrgDentists(organizationId) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      profiles:user_id (id, full_name, email)
    `)
    .eq('organization_id', organizationId)
    .eq('role', 'dentist')
    .eq('is_active', true);

  if (error) {
    logger.warn('getOrgDentists failed:', error.message);
    throw error;
  }

  return (data || [])
    .map((row) => ({
      id: row.user_id,
      full_name: row.profiles?.full_name || 'Sin nombre',
      email: row.profiles?.email || null,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

/**
 * Lista clínicas de una organización (normalmente 1 — para color coding + timezone).
 * @param {string} organizationId
 * @returns {Promise<Array<{id, name, address, timezone, business_hours}>>}
 */
export async function getOrgClinics(organizationId) {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, address, timezone, business_hours')
    .eq('organization_id', organizationId);

  if (error) {
    logger.warn('getOrgClinics failed:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Lista citas de un dentista específico en un rango de fechas.
 * RLS (spec 023 — appt_assistant_select) enforces que solo miembros de la org ven estas citas.
 *
 * @param {string} organizationId
 * @param {string} therapistId - user_id del dentista seleccionado
 * @param {string} startDate - 'yyyy-MM-dd'
 * @param {string} endDate - 'yyyy-MM-dd'
 */
export async function getOrgAppointments(organizationId, therapistId, startDate, endDate) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, organization_id, clinic_id, therapist_id, patient_id, service_id,
      date, start_time, end_time, status, notes, created_at, updated_at,
      patients:patients!appointments_patient_id_fkey(
        id, profile:profiles!patients_profile_id_fkey(full_name, phone, email)
      ),
      therapist:profiles!appointments_therapist_id_fkey(id, full_name)
    `)
    .eq('organization_id', organizationId)
    .eq('therapist_id', therapistId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time');

  if (error) {
    logger.warn('getOrgAppointments failed:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Lista bloqueos horarios del dentista en un rango.
 * RLS (blocked_times_assistant_select — migration 20260424000001) enforces scope.
 */
export async function getOrgBlockedTimes(organizationId, therapistId, startDate, endDate) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('id, therapist_id, clinic_id, date, start_time, end_time, reason')
    .eq('therapist_id', therapistId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time');

  if (error) {
    logger.warn('getOrgBlockedTimes failed:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Disponibilidad (horario base) del dentista para N días desde startDate.
 * Usa la RPC existente `get_therapist_availability` si está disponible.
 * Fallback: query directa a `therapist_availability`.
 */
export async function getOrgAvailability(organizationId, therapistId, startDate, days) {
  // Intentar RPC primero (ya usado por el dentista en therapist.api.js)
  try {
    const { data, error } = await supabase.rpc('get_therapist_availability', {
      p_therapist_id: therapistId,
      p_start_date: startDate,
      p_days: days,
    });
    if (!error && data) return data;
  } catch (rpcErr) {
    logger.warn('RPC get_therapist_availability failed, falling back:', rpcErr?.message);
  }

  // Fallback: query directa a therapist_availability
  const { data, error } = await supabase
    .from('therapist_availability')
    .select('*')
    .eq('therapist_id', therapistId);

  if (error) {
    logger.warn('getOrgAvailability fallback failed:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Autocomplete de pacientes de una organización.
 * Retorna solo datos administrativos (nombre, email, phone) — compliance Ley 21.719.
 */
export async function searchOrgPatients(organizationId, term) {
  if (!term || term.length < 2) return [];

  const cleanTerm = String(term).trim().replace(/[%_]/g, '');
  if (!cleanTerm) return [];

  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      profile_id,
      profile:profiles!patients_profile_id_fkey(full_name, email, phone)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`profile.full_name.ilike.%${cleanTerm}%,profile.email.ilike.%${cleanTerm}%`)
    .limit(20);

  if (error) {
    logger.warn('searchOrgPatients failed:', error.message);
    throw error;
  }

  return (data || []).map((p) => ({
    id: p.id,
    profile_id: p.profile_id,
    full_name: p.profile?.full_name || 'Sin nombre',
    email: p.profile?.email || null,
    phone: p.profile?.phone || null,
  }));
}

/**
 * Lista servicios activos de un dentista (para elegir al crear cita).
 */
export async function getOrgServicesForTherapist(therapistId) {
  const { data, error } = await supabase
    .from('therapist_services')
    .select('id, name, duration_minutes, price_clp, is_active')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    logger.warn('getOrgServicesForTherapist failed:', error.message);
    throw error;
  }
  return data || [];
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Crea una cita nueva.
 * RLS (appt_assistant_insert — spec 023) valida que el asistente puede insertar.
 *
 * @param {object} payload
 * @returns {Promise<object>} cita creada con datos de paciente
 * @throws si insert falla o no devuelve data (UI Honesty §V)
 */
export async function createOrgAppointment(payload) {
  // Obtener user actual para created_by_user_id
  const { data: { user } } = await supabase.auth.getUser();

  const insertPayload = {
    ...payload,
    status: payload.status || 'scheduled',
    created_by_user_id: user?.id || null,
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert(insertPayload)
    .select(`
      id, organization_id, clinic_id, therapist_id, patient_id, service_id,
      date, start_time, end_time, status, notes, created_at, updated_at,
      patients:patients!appointments_patient_id_fkey(
        id, profile:profiles!patients_profile_id_fkey(full_name, phone, email)
      ),
      therapist:profiles!appointments_therapist_id_fkey(id, full_name)
    `)
    .maybeSingle();

  if (error) {
    logger.warn('createOrgAppointment failed:', error.message);
    throw error;
  }
  if (!data) {
    // RLS rechazó silenciosamente (política WITH CHECK falló)
    throw new Error('No se pudo crear la cita. Verificá que tenés permisos sobre esta clínica.');
  }
  return data;
}

/**
 * Edita una cita existente.
 * RLS (appt_assistant_update — spec 023) valida.
 */
export async function updateOrgAppointment(id, changes) {
  const { data, error } = await supabase
    .from('appointments')
    .update(changes)
    .eq('id', id)
    .select(`
      id, organization_id, clinic_id, therapist_id, patient_id, service_id,
      date, start_time, end_time, status, notes, created_at, updated_at,
      patients:patients!appointments_patient_id_fkey(
        id, profile:profiles!patients_profile_id_fkey(full_name, phone, email)
      ),
      therapist:profiles!appointments_therapist_id_fkey(id, full_name)
    `)
    .maybeSingle();

  if (error) {
    logger.warn('updateOrgAppointment failed:', error.message);
    throw error;
  }
  if (!data) {
    throw new Error('No se pudo actualizar la cita. Verificá permisos o que la cita existe.');
  }
  return data;
}

/**
 * Crea un bloqueo horario en nombre de un dentista.
 * RLS (blocked_times_assistant_insert — migration 20260424000001) valida.
 */
export async function createOrgBlockedTime(payload) {
  const { data, error } = await supabase
    .from('blocked_times')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    logger.warn('createOrgBlockedTime failed:', error.message);
    throw error;
  }
  if (!data) {
    throw new Error('No se pudo crear el bloqueo. Verificá permisos.');
  }
  return data;
}

/**
 * Elimina un bloqueo horario.
 * RLS (blocked_times_assistant_delete — migration 20260424000001) valida.
 */
export async function deleteOrgBlockedTime(id) {
  const { error } = await supabase
    .from('blocked_times')
    .delete()
    .eq('id', id);

  if (error) {
    logger.warn('deleteOrgBlockedTime failed:', error.message);
    throw error;
  }
}
