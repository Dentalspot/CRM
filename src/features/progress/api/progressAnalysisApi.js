
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Analyze patient progress using AI
 */
export const analyzeProgress = async (patientId, reportType = 'monthly') => {
  try {
    // 1. Fetch Patient Context FIRST to get profile_id
    // We need profile_id to query logs, as patient_activity_logs uses profile_id
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        id,
        profile_id,
        diagnosis,
        treatment_stage,
        profile:profiles!patients_profile_id_fkey(full_name, birthdate)
      `)
      .eq('id', patientId)
      .maybeSingle(); // Changed to maybeSingle() to prevent errors

    if (patientError) throw new Error(`Error fetching patient context: ${patientError.message}`);
    if (!patient) throw new Error('Paciente no encontrado o no disponible.');
    if (!patient.profile_id) throw new Error('El paciente no tiene un perfil asociado.');

    // 2. Fetch Logs using profile_id
    // FIX: Specify FK to resolve PGRST201 ambiguous relationship
    const { data: logs, error: logsError } = await supabase
      .from('patient_activity_logs')
      .select(`
        id,
        activity_type,
        duration_minutes,
        score,
        notes,
        completion_date,
        achievement_level,
        created_at,
        activity:patient_activities!patient_activity_logs_activity_id_fkey(name, description)
      `)
      .eq('patient_id', patient.profile_id) // Use profile_id here
      .order('completion_date', { ascending: true });

    if (logsError) throw logsError;

    // 3. Prepare Context
    const patientContext = {
      name: patient.profile?.full_name,
      diagnosis: patient.diagnosis,
      stage: patient.treatment_stage,
      age: patient.profile?.birthdate // Logic to calc age is in backend or ignore
    };

    // 4. Call Edge Function
    const { data: analysis, error: aiError } = await supabase.functions.invoke('analyze-progress', {
      body: { logs, patientContext, reportType }
    });

    if (aiError) throw aiError;

    return analysis;
  } catch (error) {
    logger.error('Error analyzing progress:', error);
    throw error;
  }
};

/**
 * Save a progress report
 */
export const saveProgressReport = async (reportData) => {
  // Validate that patient_id corresponds to a valid profile
  if (!reportData.patient_id) {
    throw new Error('Patient ID is required');
  }

  const { data: profileCheck, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', reportData.patient_id)
    .maybeSingle(); // Changed to maybeSingle()

  if (profileError || !profileCheck) {
    throw new Error('El ID del paciente no corresponde a un perfil de usuario válido. No se puede guardar el reporte.');
  }

  const { data, error } = await supabase
    .from('progress_reports')
    .insert(reportData)
    .select(); // Remove .single() from insert, handle array

  if (error) throw error;
  
  const report = data?.[0];
  if (!report) throw new Error("No se pudo verificar el reporte guardado.");
  
  return report;
};

/**
 * Get all progress reports for a patient (by profile_id)
 */
export const getProgressReports = async (patientProfileId) => {
  const { data, error } = await supabase
    .from('progress_reports')
    .select('*')
    .eq('patient_id', patientProfileId)
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Share/unshare a report with patient
 */
export const shareReport = async (reportId, shareWithPatient = true) => {
  const { data, error } = await supabase
    .from('progress_reports')
    .update({ shared_with_patient: shareWithPatient })
    .eq('id', reportId)
    .select(); // Changed from .single() to handle array safely

  if (error) throw error;
  
  const report = data?.[0];
  if (!report) throw new Error("No se pudo verificar la actualización del reporte.");
  
  return report;
};

/**
 * Log a patient activity
 */
export const logActivity = async (logData) => {
  const { data, error } = await supabase
    .from('patient_activity_logs')
    .insert({
      ...logData,
      completion_date: logData.completion_date || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select(); // Avoid .single() on insert just in case

  if (error) throw error;
  
  const log = data?.[0];
  if (!log) throw new Error("Error al registrar la actividad.");
  
  return log;
};

/**
 * Wrapper for logActivity (alias)
 */
export const logActivityToDatabase = async (logData) => {
  return logActivity(logData);
};

/**
 * Get all activity logs for a patient
 */
export const getPatientActivityLogs = async (patientId) => {
  // FIX: Specify FK to resolve PGRST201 ambiguous relationship
  const { data, error } = await supabase
    .from('patient_activity_logs')
    .select(`
      *,
      activity:patient_activities!patient_activity_logs_activity_id_fkey(name, description)
    `)
    .eq('patient_id', patientId)
    .order('completion_date', { ascending: false });

  if (error) throw error;
  return data;
};

export default {
  analyzeProgress,
  saveProgressReport,
  getProgressReports,
  shareReport,
  logActivity,
  logActivityToDatabase,
  getPatientActivityLogs
};
