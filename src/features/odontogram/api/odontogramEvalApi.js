import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

// ============================================================
// EVALUATIONS CRUD
// ============================================================

export const fetchEvaluations = async (therapistId, patientId = null) => {
  let query = supabase
    .from('odontogram_evaluations')
    .select('*, patients(id, profile_id, profiles(full_name, rut, birthdate))')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[odontogramEvalApi] fetchEvaluations error:', error);
    return { data: [], error };
  }

  // Flatten patient data for easier access
  const flattened = (data || []).map((ev) => ({
    ...ev,
    patient_name: ev.patients?.profiles?.full_name || 'Sin nombre',
    patient_rut: ev.patients?.profiles?.rut || '',
    patient_birthdate: ev.patients?.profiles?.birthdate || null,
  }));

  return { data: flattened, error: null };
};

export const fetchEvaluationById = async (id) => {
  const { data, error } = await supabase
    .from('odontogram_evaluations')
    .select('*, patients(id, profile_id, profiles(full_name, rut, birthdate))')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error('[odontogramEvalApi] fetchEvaluationById error:', error);
    return { data: null, error };
  }

  if (data) {
    data.patient_name = data.patients?.profiles?.full_name || 'Sin nombre';
    data.patient_rut = data.patients?.profiles?.rut || '';
    data.patient_birthdate = data.patients?.profiles?.birthdate || null;
  }

  return { data, error: null };
};

export const createEvaluation = async (evalData) => {
  // Lookup defensivo: si no viene organization_id, heredar del paciente
  if (!evalData.organization_id && evalData.patient_id) {
    const { data: pat } = await supabase
      .from('patients').select('organization_id').eq('id', evalData.patient_id).maybeSingle();
    evalData = { ...evalData, organization_id: pat?.organization_id || null };
  }

  const { data, error } = await supabase
    .from('odontogram_evaluations')
    .insert(evalData)
    .select()
    .single();

  if (error) logger.error('[odontogramEvalApi] createEvaluation error:', error);
  return { data, error };
};

export const updateEvaluation = async (id, updates) => {
  const { data, error } = await supabase
    .from('odontogram_evaluations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) logger.error('[odontogramEvalApi] updateEvaluation error:', error);
  return { data, error };
};

export const deleteEvaluation = async (id) => {
  const { error } = await supabase
    .from('odontogram_evaluations')
    .delete()
    .eq('id', id);

  if (error) logger.error('[odontogramEvalApi] deleteEvaluation error:', error);
  return { error };
};

// ============================================================
// REPORT TO CLINICAL HISTORY
// ============================================================

export const saveReportToFicha = async ({ evaluationId, patientId, therapistId, organizationId, evaluation, treatments }) => {
  // Build markdown summary
  const treatmentLines = (treatments || [])
    .map((t) => `- Diente ${t.tooth}: ${t.procedure} — $${(t.price || 0).toLocaleString('es-CL')}`)
    .join('\n');

  const total = (treatments || []).reduce((sum, t) => sum + (t.price || 0), 0);

  const summary = [
    `## Evaluación Odontológica ${evaluation.evaluation_type === 'inicial' ? 'Inicial' : 'de Tratamiento'}`,
    `**Fecha:** ${evaluation.evaluation_date}`,
    `**Estado:** ${evaluation.status}`,
    '',
    '### Tratamientos / Hallazgos',
    treatmentLines || '_Sin tratamientos registrados_',
    '',
    `### Presupuesto Total: $${total.toLocaleString('es-CL')}`,
    '',
    evaluation.notes ? `### Observaciones\n${evaluation.notes}` : '',
  ].filter(Boolean).join('\n');

  // Check if report already saved
  const { data: existing } = await supabase
    .from('clinical_history')
    .select('id')
    .eq('patient_id', patientId)
    .eq('entry_type', 'informe_odontograma')
    .contains('details', { evaluation_id: evaluationId })
    .maybeSingle();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('clinical_history')
      .update({
        session_notes: summary,
        details: { evaluation_id: evaluationId, treatments, budget_total: total },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    return { id: existing.id, updated: true, error };
  }

  // Create new
  const { data, error } = await supabase
    .from('clinical_history')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      organization_id: organizationId || null,
      entry_type: 'informe_odontograma',
      entry_date: evaluation.evaluation_date,
      summary: `Odontograma ${evaluation.evaluation_type} - ${treatments?.length || 0} procedimientos`,
      session_notes: summary,
      details: { evaluation_id: evaluationId, treatments, budget_total: total },
    })
    .select('id')
    .single();

  return { id: data?.id, updated: false, error };
};

// ============================================================
// FETCH THERAPIST SERVICES (for suggested prices)
// ============================================================

export const fetchTherapistServices = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_services')
    .select('id, service_name, price, duration_minutes')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('service_name');

  if (error) logger.error('[odontogramEvalApi] fetchTherapistServices error:', error);
  return { data: data || [], error };
};
