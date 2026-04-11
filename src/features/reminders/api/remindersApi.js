import { supabase } from '@/lib/supabaseClient';

export const getScheduledReminders = async (therapistId) => {
  const { data, error } = await supabase
    .from('scheduled_reminders')
    .select(`
      *,
      appointment:appointments (
        id,
        date,
        start_time,
        patient:patients!appointments_patient_id_fkey (
          id,
          profile:profiles!patients_profile_id_fkey (
            full_name,
            email,
            phone
          )
        )
      )
    `)
    .eq('therapist_id', therapistId)
    .order('scheduled_time', { ascending: true });

  return { data, error };
};

export const getReminderLogs = async (therapistId) => {
  const { data, error } = await supabase
    .from('reminder_logs')
    .select(`
      *,
      appointment:appointments!inner (
        id,
        therapist_id,
        patient:patients!appointments_patient_id_fkey (
          id,
          profile:profiles!patients_profile_id_fkey (
            full_name
          )
        )
      )
    `)
    .eq('appointment.therapist_id', therapistId)
    .order('sent_at', { ascending: false })
    .limit(50);

  return { data, error };
};

export const scheduleEmailReminder = async (appointmentId, therapistId, reminderType, scheduledTime) => {
  // Get patient profile_id from appointment → patients → profiles
  const { data: appointment } = await supabase
    .from('appointments')
    .select('patient_id, patients(profile_id)')
    .eq('id', appointmentId)
    .maybeSingle();

  // scheduled_reminders.patient_id references profiles(id), not patients(id)
  const profileId = appointment?.patients?.profile_id;
  if (!profileId) return { error: { message: 'Appointment or patient profile not found' } };

  const { data, error } = await supabase
    .from('scheduled_reminders')
    .insert({
      appointment_id: appointmentId,
      therapist_id: therapistId,
      patient_id: profileId,
      reminder_type: reminderType,
      scheduled_time: scheduledTime,
      status: 'pending'
    })
    .select()
    .single();

  return { data, error };
};

export const deleteReminder = async (reminderId) => {
  const { error } = await supabase
    .from('scheduled_reminders')
    .delete()
    .eq('id', reminderId);

  return { error };
};

export const sendTestReminder = async (appointmentId, email) => {
  const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
    body: { 
      appointment_id: appointmentId, 
      test_email: email, 
      is_test: true 
    }
  });

  return { data, error };
};