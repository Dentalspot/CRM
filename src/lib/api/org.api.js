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
 * Lista clínicas de una organización (normalmente 1 — para color coding + schedule).
 * Nota: la columna `timezone` NO existe en `clinics` (verificado 2026-04-24).
 * Se usa fallback 'America/Santiago' hardcoded (Chile beta only).
 * @param {string} organizationId
 * @returns {Promise<Array<{id, name, address, business_hours, schedule_text}>>}
 */
export async function getOrgClinics(organizationId) {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, address, business_hours, schedule_text')
    .eq('organization_id', organizationId);

  if (error) {
    logger.warn('getOrgClinics failed:', error.message);
    throw error;
  }
  // Agregar timezone sintético para coherencia con WeeklyAgendaView
  return (data || []).map((c) => ({ ...c, timezone: 'America/Santiago' }));
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
      patient:patients!appointments_patient_id_fkey(
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
 *
 * Schema real de blocked_times (verificado 2026-04-24):
 *   - start_time timestamptz, end_time timestamptz (NO hay columna date separada)
 * Se sigue el mismo pattern que therapist.api.js::getTherapistBlockedTimes.
 */
export async function getOrgBlockedTimes(organizationId, therapistId, startDate, endDate) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('therapist_id', therapistId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .order('start_time');

  if (error) {
    logger.warn('getOrgBlockedTimes failed:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Disponibilidad (horario base) del dentista para N días desde startDate.
 * Usa la RPC `get_therapist_availability` (única fuente — no hay tabla directa).
 *
 * Signature confirmada (20260401000000_baseline_schema.sql §get_therapist_availability):
 *   (p_therapist_identifier text, p_clinic_id uuid, p_start_date date, p_days integer)
 *   RETURNS TABLE(availability_date date, time_slots jsonb)
 *
 * clinicId puede ser null — la RPC lo maneja como "todas las clínicas del therapist".
 */
export async function getOrgAvailability(organizationId, therapistId, startDate, days, clinicId = null) {
  const { data, error } = await supabase.rpc('get_therapist_availability', {
    p_therapist_identifier: therapistId,
    p_clinic_id: clinicId,
    p_start_date: startDate,
    p_days: days,
  });

  if (error) {
    logger.warn('getOrgAvailability RPC failed:', error.message);
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

  // Dos queries — evita complicaciones de PostgREST con filter OR sobre embed aliased.
  // Query 1: buscar profiles que matcheen el término (via RLS "Org assistants can view patient profiles"
  // el asistente puede ver profiles de pacientes de su org).
  const { data: profileMatches, error: profErr } = await supabase
    .from('profiles')
    .select('id')
    .or(`full_name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
    .limit(50);

  if (profErr) {
    logger.warn('searchOrgPatients (profiles step) failed:', profErr.message);
    throw profErr;
  }

  const profileIds = (profileMatches || []).map((p) => p.id);
  if (profileIds.length === 0) return [];

  // Query 2: patients scoped a la org, con esos profile_ids
  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      profile_id,
      profile:profiles!patients_profile_id_fkey(full_name, email, phone)
    `)
    .eq('organization_id', organizationId)
    .eq('is_blacklisted', false)
    .in('profile_id', profileIds)
    .limit(20);

  if (error) {
    logger.warn('searchOrgPatients (patients step) failed:', error.message);
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
 * Nota: therapist_services usa `service_name` (NO `name`). Se alias para UI.
 */
export async function getOrgServicesForTherapist(therapistId) {
  const { data, error } = await supabase
    .from('therapist_services')
    .select('id, service_name, duration_minutes, price_clp, is_active')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('service_name');

  if (error) {
    logger.warn('getOrgServicesForTherapist failed:', error.message);
    throw error;
  }
  return (data || []).map((s) => ({ ...s, name: s.service_name }));
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
  // Nota: appointments NO tiene columna created_by_user_id en el schema actual.
  // Trazabilidad del creador se logra via clinical_audit_log (logClinicalAccess
  // en el caller). Si futuro spec agrega la columna, descomentar el assignment.
  const insertPayload = {
    ...payload,
    status: payload.status || 'scheduled',
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert(insertPayload)
    .select(`
      id, organization_id, clinic_id, therapist_id, patient_id, service_id,
      date, start_time, end_time, status, notes, created_at, updated_at,
      patient:patients!appointments_patient_id_fkey(
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
    throw new Error('No se pudo crear la cita. Verifica que tienes permisos sobre esta clínica.');
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
      patient:patients!appointments_patient_id_fkey(
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
    throw new Error('No se pudo actualizar la cita. Verifica permisos o que la cita existe.');
  }
  return data;
}

/**
 * Crea un bloqueo horario en nombre de un dentista.
 * RLS (blocked_times_assistant_insert — migration 20260424000001) valida.
 *
 * Helper: acepta { date, start_time, end_time } (strings separados) y combina
 * en timestamptz ISO con offset local del browser. Critical:
 *   - `new Date('2026-04-24T14:00:00')` interpreta LOCAL (timezone del browser)
 *   - `.toISOString()` convierte a UTC con offset explícito
 *   - Al leer de DB, JS `new Date(isoString)` vuelve a convertir correctamente a local
 * Sin este trick, Postgres interpretaría '2026-04-24T14:00:00' como UTC y el
 * bloque aparecería 3-4 horas antes en la UI del usuario chileno.
 */
export async function createOrgBlockedTime(payload) {
  let normalizedPayload = { ...payload };
  if (payload.date && typeof payload.start_time === 'string' && payload.start_time.length <= 8) {
    // Construir Date en timezone local del browser, luego serializar como ISO UTC
    const localStart = new Date(`${payload.date}T${payload.start_time}`);
    const localEnd = new Date(`${payload.date}T${payload.end_time}`);
    normalizedPayload.start_time = localStart.toISOString();
    normalizedPayload.end_time = localEnd.toISOString();
    delete normalizedPayload.date; // no existe la columna
  }

  const { data, error } = await supabase
    .from('blocked_times')
    .insert(normalizedPayload)
    .select('*')
    .maybeSingle();

  if (error) {
    logger.warn('createOrgBlockedTime failed:', error.message);
    throw error;
  }
  if (!data) {
    throw new Error('No se pudo crear el bloqueo. Verifica permisos.');
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
