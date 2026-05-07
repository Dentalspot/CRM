import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const getTherapistAppointments = async (therapistId, start, end, clinicId = null) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients (
        id,
        full_name,
        email,
        phone,
        rut,
        profile:profiles!patients_profile_id_fkey (
          full_name,
          email,
          phone
        )
      ),
      service:therapist_services (
        id,
        service_name,
        duration_minutes,
        price_clp
      ),
      clinics (
        id,
        name,
        modalidad
      )
    `)
    .eq('therapist_id', therapistId)
    .gte('date', start)
    .lte('date', end);

  if (clinicId && clinicId !== 'all') {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointment = async (id, updates) => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTherapistClinics = async (therapistId) => {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

export const blockTimeSlot = async (blockData) => {
  const { data, error } = await supabase
    .from('blocked_times')
    .insert([blockData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBlockedTimes = async (therapistId, start, end) => {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('therapist_id', therapistId)
    .gte('start_time', start)
    .lte('end_time', end);

  if (error) throw error;
  return data;
};

export const rescheduleAppointmentDragDrop = async (appointmentId, newDate, newStartTime, newEndTime) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Funciones para el paciente
export const getPatientAppointments = async (profileId) => {
  // Resolve patients.id from profile_id (auth.uid())
  // appointments.patient_id → patients.id, NOT profiles.id
  const { data: patientRecord } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  const resolvedPatientId = patientRecord?.id || profileId;

  // Query directa — sin RPC
  // Joins opcionales separados para evitar 400 cuando FKs son null
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      therapist:profiles!appointments_therapist_id_fkey(full_name)
    `)
    .eq('patient_id', resolvedPatientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    logger.error('appointments query error:', error);
    throw error;
  }

  return { data: data || [] };
};

export const cancelPatientAppointment = async (appointmentId, userId, cancellationReason) => {
  const { data, error } = await supabase
    .rpc('cancel_appointment', {
      p_appointment_id: appointmentId,
      p_user_id: userId,
      p_cancellation_reason: cancellationReason || 'Cancelado por el paciente'
    });

  if (error) throw error;
  return data;
};