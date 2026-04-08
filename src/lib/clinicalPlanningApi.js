/**
 * Clinical Planning API
 *
 * Handles clinical history, treatment plans, sessions, and calendar integration.
 * Includes support for viewing external therapist sessions (metadata only).
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { apiHandler } from '@/lib/api/apiHandler';

// ============================================
// CLINICAL HISTORY ENTRIES
// ============================================

/**
 * Create a new clinical history entry
 */
export const createClinicalEntry = apiHandler.mutation('createClinicalEntry', async (entryData) => {
  const { data, error } = await supabase
    .from('clinical_history')
    .insert({
      patient_id: entryData.patient_id,
      therapist_id: entryData.therapist_id,
      entry_type: entryData.entry_type,
      entry_date: entryData.entry_date || new Date().toISOString(),
      summary: entryData.summary,
      session_notes: entryData.session_notes,
      objectives_worked: entryData.objectives_worked,
      activities_performed: entryData.activities_performed,
      patient_response: entryData.patient_response,
      recommendations: entryData.recommendations,
      next_session_plan: entryData.next_session_plan,
      attachments: entryData.attachments,
      appointment_id: entryData.appointment_id || null,
      assigned_plan_id: entryData.assigned_plan_id || null,
      details: entryData.details || null,
      is_external: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Update an existing clinical history entry
 */
export const updateClinicalEntry = apiHandler.mutation('updateClinicalEntry', async (entryId, updates) => {
  const { data, error } = await supabase
    .from('clinical_history')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Delete a clinical history entry
 */
export const deleteClinicalEntry = apiHandler.mutation('deleteClinicalEntry', async (entryId) => {
  const { error } = await supabase
    .from('clinical_history')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
  return true;
});

/**
 * Get clinical history for a patient (including external sessions)
 */
export const getClinicalHistory = apiHandler.mutation('getClinicalHistory', async (patientId, options = {}) => {
  const {
    includeExternal = true,
    entryType = null,
    limit = 100,
    offset = 0
  } = options;

  // Try RPC first (handles external session privacy)
  try {
    const { data, error } = await supabase.rpc('get_patient_clinical_timeline', {
      p_patient_id: patientId,
      p_include_external: includeExternal,
      p_limit: limit,
      p_offset: offset
    });

    if (!error && data) {
      // Filter by type if specified
      if (entryType) {
        return data.filter(entry => entry.entry_type === entryType);
      }
      return data;
    }
  } catch (rpcError) {
    logger.warn('RPC not available, falling back to direct query');
  }

  // Fallback to direct query
  // FIX: Specify the exact relationship for therapist_details to resolve PGRST201
  let query = supabase
    .from('clinical_history')
    .select(`
      *,
      therapist:profiles!clinical_history_therapist_id_fkey(
        id,
        full_name,
        therapist_details!therapist_details_user_id_fkey(professional_title),
        therapist_branding!therapist_branding_therapist_id_fkey(avatar_url)
      ),
      appointment:appointments(id, date, start_time, end_time, status)
    `)
    .eq('patient_id', patientId)
    .order('entry_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (entryType) {
    query = query.eq('entry_type', entryType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
});

/**
 * Get external sessions count for a patient
 */
export const getExternalSessionsCount = apiHandler('getExternalSessionsCount', async (patientId) => {
  const { data, error } = await supabase.rpc('get_patient_external_sessions_count', {
    p_patient_id: patientId
  });

  if (error) throw error;
  return data?.[0] || { total_external: 0, external_therapists: [] };
}, { total_external: 0, external_therapists: [] });

// ============================================
// CALENDAR INTEGRATION
// ============================================

/**
 * Get clinical events for calendar display
 */
export const getClinicalCalendarEvents = apiHandler('getClinicalCalendarEvents', async (therapistId, startDate, endDate) => {
  const { data, error } = await supabase.rpc('get_clinical_calendar_events', {
    p_therapist_id: therapistId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) throw error;
  return data || [];
}, []);

/**
 * Link clinical history entry to appointment
 */
export const linkEntryToAppointment = apiHandler.mutation('linkEntryToAppointment', async (entryId, appointmentId) => {
  const { data, error } = await supabase
    .from('clinical_history')
    .update({ appointment_id: appointmentId })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Create clinical entry from completed appointment
 */
export const createEntryFromAppointment = apiHandler.mutation('createEntryFromAppointment', async (appointmentId, additionalData = {}) => {
  // Get appointment details
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!appointments_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(full_name)
      )
    `)
    .eq('id', appointmentId)
    .single();

  if (aptError) throw aptError;

  // Check if entry already exists
  const { data: existing } = await supabase
    .from('clinical_history')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create entry
  const entryData = {
    patient_id: appointment.patient_id,
    therapist_id: appointment.therapist_id,
    entry_type: 'sesion_terapia',
    entry_date: `${appointment.date}T${appointment.start_time}`,
    summary: additionalData.summary || `Sesión con ${appointment.patient?.profile?.full_name || 'paciente'}`,
    session_notes: additionalData.session_notes || appointment.notes,
    appointment_id: appointmentId,
    ...additionalData
  };

  return createClinicalEntry(entryData);
});

// ============================================
// TREATMENT PLANS
// ============================================

/**
 * Get treatment plan templates for a therapist
 */
export const getTreatmentPlanTemplates = apiHandler.mutation('getTreatmentPlanTemplates', async (therapistId) => {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_template', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
});

/**
 * Get assigned plans for a patient
 */
export const getPatientAssignedPlans = apiHandler.mutation('getPatientAssignedPlans', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_assigned_plans')
    .select(`
      *,
      template:treatment_plans!patient_assigned_plans_plan_template_id_fkey(
        id, name, description, duration_weeks, recommended_sessions
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
});

/**
 * Assign a plan to a patient
 */
export const assignPlanToPatient = apiHandler.mutation('assignPlanToPatient', async (assignmentData) => {
  const { data, error } = await supabase
    .from('patient_assigned_plans')
    .insert({
      patient_id: assignmentData.patient_id,
      therapist_id: assignmentData.therapist_id,
      plan_template_id: assignmentData.plan_template_id,
      name: assignmentData.name,
      start_date: assignmentData.start_date,
      status: 'active',
      total_sessions: assignmentData.total_sessions,
      completed_sessions: 0,
      progress_percentage: 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Delete an assigned plan (with cascade)
 */
export const deleteAssignedPlan = apiHandler.mutation('deleteAssignedPlan', async (assignedPlanId) => {
  // Get related sessions first
  const { data: sessions } = await supabase
    .from('plan_sessions')
    .select('id')
    .eq('assigned_plan_id', assignedPlanId);

  // Delete session activities
  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    await supabase
      .from('session_activities')
      .delete()
      .in('session_id', sessionIds);
  }

  // Delete appointments linked to this plan
  await supabase
    .from('appointments')
    .delete()
    .eq('recurring_group_id', assignedPlanId);

  // Delete plan sessions
  await supabase
    .from('plan_sessions')
    .delete()
    .eq('assigned_plan_id', assignedPlanId);

  // Delete clinical history entries
  await supabase
    .from('clinical_history')
    .delete()
    .eq('assigned_plan_id', assignedPlanId);

  // Finally delete the assigned plan
  const { error } = await supabase
    .from('patient_assigned_plans')
    .delete()
    .eq('id', assignedPlanId);

  if (error) throw error;
  return true;
});

// ============================================
// PLAN SESSIONS
// ============================================

/**
 * Get sessions for an assigned plan
 */
export const getPlanSessions = apiHandler.mutation('getPlanSessions', async (assignedPlanId) => {
  const { data, error } = await supabase
    .from('plan_sessions')
    .select(`
      *,
      activities:session_activities(*)
    `)
    .eq('assigned_plan_id', assignedPlanId)
    .order('session_number', { ascending: true });

  if (error) throw error;
  return data || [];
});

/**
 * Create sessions for a plan
 */
export const createBulkSessions = apiHandler.mutation('createBulkSessions', async (sessions) => {
  const { data, error } = await supabase
    .from('plan_sessions')
    .insert(sessions)
    .select();

  if (error) throw error;
  return data;
});

/**
 * Update a plan session
 */
export const updatePlanSession = apiHandler.mutation('updatePlanSession', async (sessionId, updates) => {
  const { data, error } = await supabase
    .from('plan_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Mark session as complete and create clinical history entry
 */
export const completeSession = apiHandler.mutation('completeSession', async (sessionId, completionData = {}) => {
  // Update session status
  const { data: session, error: sessionError } = await supabase
    .from('plan_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: completionData.notes
    })
    .eq('id', sessionId)
    .select(`
      *,
      assigned_plan:patient_assigned_plans(
        id, patient_id, therapist_id, name
      )
    `)
    .single();

  if (sessionError) throw sessionError;

  // Update plan progress
  const { data: allSessions } = await supabase
    .from('plan_sessions')
    .select('status')
    .eq('assigned_plan_id', session.assigned_plan_id);

  const completedCount = allSessions?.filter(s => s.status === 'completed').length || 0;
  const totalCount = allSessions?.length || 1;
  const progress = Math.round((completedCount / totalCount) * 100);

  await supabase
    .from('patient_assigned_plans')
    .update({
      completed_sessions: completedCount,
      progress_percentage: progress,
      status: progress >= 100 ? 'completed' : 'active'
    })
    .eq('id', session.assigned_plan_id);

  // Create clinical history entry (if not auto-created by trigger)
  try {
    await createClinicalEntry({
      patient_id: session.assigned_plan.patient_id,
      therapist_id: session.assigned_plan.therapist_id,
      entry_type: 'sesion_terapia',
      entry_date: new Date().toISOString(),
      summary: `Sesión ${session.session_number} completada - ${session.assigned_plan.name}`,
      session_notes: completionData.notes,
      assigned_plan_id: session.assigned_plan_id
    });
  } catch (err) {
    logger.warn('Clinical history entry may already exist:', err);
  }

  return session;
});

// ============================================
// RECURRING APPOINTMENTS
// ============================================

/**
 * Create recurring appointments for a plan
 */
export const createRecurringAppointments = apiHandler.mutation('createRecurringAppointments', async (appointmentsData, assignedPlanId) => {
  try {
    const { data, error } = await supabase.rpc('create_recurring_appointments', {
      appointments_json: appointmentsData,
      group_id: assignedPlanId
    });

    if (error) throw error;
    return data;
  } catch (rpcError) {
    // Fallback to direct insert
    const appointments = appointmentsData.map(apt => ({
      ...apt,
      recurring_group_id: assignedPlanId
    }));

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (error) throw error;
    return data;
  }
});

/**
 * Delete recurring appointments
 */
export const deleteRecurringAppointments = apiHandler.mutation('deleteRecurringAppointments', async (groupId, futureOnly = true) => {
  let query = supabase
    .from('appointments')
    .delete()
    .eq('recurring_group_id', groupId);

  if (futureOnly) {
    query = query.gte('date', new Date().toISOString().split('T')[0]);
  }

  const { error } = await query;
  if (error) throw error;
  return true;
});

// ============================================
// CLINICAL ENTRY TYPES
// ============================================

/**
 * Get available clinical entry types
 */
export const getClinicalEntryTypes = apiHandler('getClinicalEntryTypes', async () => {
  const { data, error } = await supabase
    .from('clinical_entry_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}, [
  { code: 'sesion_terapia', label: 'Sesión de Terapia', icon: 'stethoscope' },
  { code: 'evaluacion_inicial', label: 'Evaluación Inicial', icon: 'clipboard-list' },
  { code: 'evaluacion_seguimiento', label: 'Evaluación de Seguimiento', icon: 'target' },
  { code: 'nota_evolucion', label: 'Nota de Evolución', icon: 'file-text' },
  { code: 'plan_tratamiento', label: 'Plan de Tratamiento', icon: 'target' },
  { code: 'alta_terapeutica', label: 'Alta Terapéutica', icon: 'check-circle' },
  { code: 'interconsulta', label: 'Interconsulta', icon: 'message-square' }
]);

export default {
  // Clinical History
  createClinicalEntry,
  updateClinicalEntry,
  deleteClinicalEntry,
  getClinicalHistory,
  getExternalSessionsCount,
  getClinicalEntryTypes,

  // Calendar Integration
  getClinicalCalendarEvents,
  linkEntryToAppointment,
  createEntryFromAppointment,

  // Treatment Plans
  getTreatmentPlanTemplates,
  getPatientAssignedPlans,
  assignPlanToPatient,
  deleteAssignedPlan,

  // Plan Sessions
  getPlanSessions,
  createBulkSessions,
  updatePlanSession,
  completeSession,

  // Recurring Appointments
  createRecurringAppointments,
  deleteRecurringAppointments
};
