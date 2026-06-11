import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { scheduleEmailReminder } from '@/features/reminders/api/remindersApi';
import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';

/**
 * Crea un registro clínico de sesión en clinical_history.
 *
 * Spec 030 Bloque 4: split notas público/privado.
 *   - Row "público" (is_professional_only=false): el paciente la ve. Contiene
 *     sessionNotes + objectives + nextSteps (resumen + indicaciones).
 *   - Row "privado" (is_professional_only=true): solo dentista/admin. Contiene
 *     privateNotes (detalle técnico, observaciones confidenciales).
 *
 * Las dos rows comparten appointment_id y se distinguen por is_professional_only.
 * Si privateNotes viene vacío/null, NO se crea row privada (comportamiento legacy).
 *
 * La policy ch_patient_select filtra is_professional_only=true a nivel RLS:
 * el frontend del paciente nunca recibe la fila privada aunque pida SELECT *.
 */
export const createSessionRecord = async ({
  patientId,
  therapistId,
  appointmentId,
  sessionNotes,
  objectives,
  nextSteps,
  privateNotes, // Bloque 4
}) => {
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();
  const orgId = pat?.organization_id || null;

  const summary = (sessionNotes || '').slice(0, 200);
  const trimmedPrivate = (privateNotes || '').trim();

  // ── Row pública (visible al paciente) ─────────────────────────────────────
  const { data: existingPublic } = await supabase
    .from('clinical_history')
    .select('id')
    .eq('appointment_id', appointmentId)
    .or('is_professional_only.is.null,is_professional_only.eq.false')
    .maybeSingle();

  const publicPayload = {
    summary,
    session_notes: sessionNotes || null,
    entry_date: new Date().toISOString(),
    details: {
      objectives_worked: objectives || null,
      next_steps: nextSteps || null,
      source: 'post_session_flow',
    },
  };

  let publicData, publicError;

  if (existingPublic) {
    ({ data: publicData, error: publicError } = await supabase
      .from('clinical_history')
      .update(publicPayload)
      .eq('id', existingPublic.id)
      .select()
      .single());
  } else {
    ({ data: publicData, error: publicError } = await supabase
      .from('clinical_history')
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        organization_id: orgId,
        appointment_id: appointmentId,
        entry_type: 'sesion',
        is_external: false,
        is_professional_only: false,
        ...publicPayload,
      })
      .select()
      .single());
  }

  if (publicError) throw publicError;

  // ── Row privada (solo dentista/admin) — solo si hay contenido ─────────────
  if (trimmedPrivate) {
    const { data: existingPrivate } = await supabase
      .from('clinical_history')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('is_professional_only', true)
      .maybeSingle();

    const privatePayload = {
      summary: trimmedPrivate.slice(0, 200),
      session_notes: trimmedPrivate,
      entry_date: new Date().toISOString(),
      details: { source: 'post_session_flow_private' },
    };

    if (existingPrivate) {
      const { error: privateError } = await supabase
        .from('clinical_history')
        .update(privatePayload)
        .eq('id', existingPrivate.id);
      if (privateError) throw privateError;
    } else {
      const { error: privateError } = await supabase
        .from('clinical_history')
        .insert({
          patient_id: patientId,
          therapist_id: therapistId,
          organization_id: orgId,
          appointment_id: appointmentId,
          entry_type: 'sesion',
          is_external: false,
          is_professional_only: true,
          ...privatePayload,
        });
      if (privateError) throw privateError;
    }
  }

  return publicData;
};

/**
 * Registra un pago de sesión en patient_payments.
 *
 * Spec 030: ahora acepta `budgetId` opcional. Cuando viene, se vincula al budget
 * para que `v_budget_balance` calcule el saldo correctamente, y se registra
 * entry en `clinical_audit_log` con resource_type='payment' (FR-019).
 */
export const registerSessionPayment = async ({
  patientId,
  therapistId,
  appointmentId,
  amount,
  method,
  budgetId = null,
}) => {
  // Heredar organization_id del paciente
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();
  const orgId = pat?.organization_id || null;

  const { data, error } = await supabase
    .from('patient_payments')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      organization_id: orgId,
      appointment_id: appointmentId,
      budget_id: budgetId,
      amount: parseInt(amount, 10),
      payment_method: method,
      concept: 'Sesión de tratamiento',
      payment_date: new Date().toISOString(),
      // Spec 030: la VIEW v_budget_balance filtra por status='completed'.
      // Antes era 'paid' (legacy fonokit) y los pagos quedaban invisibles en
      // el balance del paciente. Alineado al patrón del resto de spec 030.
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .select('id, amount, budget_id, appointment_id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No se pudo registrar el pago (RLS rechazó)');

  // Spec 030 FR-019: audit log entry para pagos desde PostSession
  if (orgId) {
    await logClinicalAccess({
      organization_id: orgId,
      user_id: therapistId,
      patient_id: patientId,
      action: 'create',
      resource_type: 'payment',
      resource_id: data.id,
      reason: `from_postsession:${appointmentId}`,
    });
  }

  return data;
};

/**
 * Agenda la próxima cita copiando datos de la cita anterior.
 */
export const scheduleNextAppointment = async ({
  patientId,
  therapistId,
  clinicId,
  previousAppointment,
  nextDate,
  nextTime,
  nextEndTime,
}) => {
  const startTime = nextTime || previousAppointment.start_time;
  const endTime = nextEndTime || previousAppointment.end_time;
  const prevDateStr = previousAppointment.date;

  // Calculate duration from start and end times
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);

  // Heredar organization_id de la cita anterior. Si no viene, lookup del paciente.
  // Las policies RLS de spec 028 + trigger check_appointment_dentist requieren
  // que el actor sea dentista activo en esa org, por eso es crítico.
  let organizationId = previousAppointment.organization_id || null;
  if (!organizationId && patientId) {
    const { data: pat } = await supabase
      .from('patients').select('organization_id').eq('id', patientId).maybeSingle();
    organizationId = pat?.organization_id || null;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      clinic_id: clinicId || previousAppointment.clinic_id || null,
      organization_id: organizationId,
      // Heredar box de la cita anterior — spec 028 lo hace obligatorio si la
      // clínica tiene boxes configurados (no podemos saber acá sin extra query).
      box_id: previousAppointment.box_id || null,
      date: nextDate,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration > 0 ? duration : (previousAppointment.duration_minutes || 45),
      modality_patient: previousAppointment.modality_patient || null,
      service_id: previousAppointment.service_id || null,
      status: 'scheduled',
      notes: `Continuación - sesión anterior: ${prevDateStr}`,
    })
    .select()
    .single();

  if (error) throw error;

  // Schedule email reminder (same logic as AppointmentModal)
  try {
    const { data: therapistDetails } = await supabase
      .from('therapist_details')
      .select('reminder_preferences')
      .eq('user_id', therapistId)
      .single();

    const prefs = therapistDetails?.reminder_preferences || {};
    const emailEnabled = prefs.email_enabled !== false;
    const hoursBefore = prefs.timing_hours || 24;

    if (emailEnabled) {
      const appointmentDateTime = new Date(`${nextDate}T${startTime}`);
      const scheduledTime = new Date(appointmentDateTime);
      scheduledTime.setHours(scheduledTime.getHours() - hoursBefore);

      if (scheduledTime > new Date()) {
        await scheduleEmailReminder(data.id, therapistId, 'patient', scheduledTime.toISOString());
      }
    }
  } catch (reminderErr) {
    logger.error('Error scheduling reminder for rebooking:', reminderErr);
  }

  return data;
};

/**
 * Obtiene citas completadas sin nota clínica (últimos 30 días).
 */
export const getPendingDocumentation = async (therapistId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceDate = thirtyDaysAgo.toISOString().split('T')[0];

  // 1. Obtener citas completadas recientes
  const { data: completed, error: completedErr } = await supabase
    .from('appointments')
    .select(`
      id, date, start_time, patient_id,
      patient:patients!appointments_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(full_name)
      )
    `)
    .eq('therapist_id', therapistId)
    .eq('status', 'completed')
    .gte('date', sinceDate)
    .order('date', { ascending: false })
    .limit(50);

  if (completedErr) throw completedErr;
  if (!completed?.length) return [];

  // 2. Buscar cuáles ya tienen nota clínica
  const ids = completed.map((a) => a.id);
  const { data: documented } = await supabase
    .from('clinical_history')
    .select('appointment_id')
    .in('appointment_id', ids);

  const documentedSet = new Set(documented?.map((d) => d.appointment_id) || []);

  return completed.filter((a) => !documentedSet.has(a.id)).slice(0, 10);
};

/**
 * Obtiene citas completadas sin pago registrado (últimos 30 días).
 */
export const getPendingPayments = async (therapistId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceDate = thirtyDaysAgo.toISOString().split('T')[0];

  // 1. Obtener citas completadas recientes con servicio
  const { data: completed, error: completedErr } = await supabase
    .from('appointments')
    .select(`
      id, date, start_time, patient_id, service_id,
      patient:patients!appointments_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(full_name)
      ),
      service:therapist_services!appointments_service_id_fkey(
        id, service_name, price_clp
      )
    `)
    .eq('therapist_id', therapistId)
    .eq('status', 'completed')
    .gte('date', sinceDate)
    .order('date', { ascending: false })
    .limit(50);

  if (completedErr) throw completedErr;
  if (!completed?.length) return [];

  // 2. Buscar cuáles ya tienen pago
  const ids = completed.map((a) => a.id);
  const { data: paid } = await supabase
    .from('patient_payments')
    .select('appointment_id')
    .eq('status', 'paid')
    .in('appointment_id', ids);

  const paidSet = new Set(paid?.map((p) => p.appointment_id) || []);

  return completed.filter((a) => !paidSet.has(a.id)).slice(0, 10);
};
