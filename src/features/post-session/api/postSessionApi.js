import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { scheduleEmailReminder } from '@/features/reminders/api/remindersApi';

/**
 * Crea un registro clínico de sesión en clinical_history.
 */
export const createSessionRecord = async ({
  patientId,
  therapistId,
  appointmentId,
  sessionNotes,
  objectives,
  nextSteps,
}) => {
  // Heredar organization_id del paciente
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();
  const orgId = pat?.organization_id || null;

  const summary = (sessionNotes || '').slice(0, 200);

  // Check if entry already exists for this appointment
  const { data: existing } = await supabase
    .from('clinical_history')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  let data, error;

  if (existing) {
    // Update existing entry
    ({ data, error } = await supabase
      .from('clinical_history')
      .update({
        summary,
        session_notes: sessionNotes || null,
        entry_date: new Date().toISOString(),
        details: {
          objectives_worked: objectives || null,
          next_steps: nextSteps || null,
          source: 'post_session_flow',
        },
      })
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    // Insert new entry
    ({ data, error } = await supabase
      .from('clinical_history')
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        organization_id: orgId,
        appointment_id: appointmentId,
        entry_type: 'sesion',
        entry_date: new Date().toISOString(),
        summary,
        session_notes: sessionNotes || null,
        details: {
          objectives_worked: objectives || null,
          next_steps: nextSteps || null,
          source: 'post_session_flow',
        },
        is_external: false,
      })
      .select()
      .single());
  }

  if (error) throw error;
  return data;
};

/**
 * Registra un pago de sesión en patient_payments.
 */
export const registerSessionPayment = async ({
  patientId,
  therapistId,
  appointmentId,
  amount,
  method,
}) => {
  // Heredar organization_id del paciente
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();

  const { data, error } = await supabase
    .from('patient_payments')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      organization_id: pat?.organization_id || null,
      appointment_id: appointmentId,
      amount: parseInt(amount, 10),
      payment_method: method,
      concept: 'Sesión de terapia',
      payment_date: new Date().toISOString(),
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
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

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      clinic_id: clinicId || previousAppointment.clinic_id || null,
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
