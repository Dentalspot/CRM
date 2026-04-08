
import { supabase } from '@/lib/supabaseClient';
import { CUTOFF_SCORES, clasificarRango } from '@/features/ados2/constants/ados2Items';

// ─────────────────────────────────────────────
// EVALUACIONES
// ─────────────────────────────────────────────

export const fetchEvaluations = async (therapistId, patientId = null) => {
  let q = supabase
    .from('ados2_evaluations')
    .select('*, patient:patients!ados2_evaluations_patient_id_fkey(id, profile:profiles!patients_profile_id_fkey(full_name, birthdate, rut))')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error } = await q;
  if (error) throw error;
  // Flatten patient data for backward compatibility
  return (data || []).map(ev => ({
    ...ev,
    patient: ev.patient ? { id: ev.patient.id, full_name: ev.patient.profile?.full_name, birthdate: ev.patient.profile?.birthdate, rut: ev.patient.profile?.rut } : null,
  }));
};

export const fetchEvaluationById = async (id) => {
  const { data, error } = await supabase
    .from('ados2_evaluations')
    .select('*, patient:patients!ados2_evaluations_patient_id_fkey(id, profile:profiles!patients_profile_id_fkey(full_name, birthdate, rut)), responses:ados2_item_responses(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (data?.patient) {
    data.patient = { id: data.patient.id, full_name: data.patient.profile?.full_name, birthdate: data.patient.profile?.birthdate, rut: data.patient.profile?.rut };
  }
  return data;
};

export const createEvaluation = async (evalData) => {
  const { data, error } = await supabase
    .from('ados2_evaluations')
    .insert(evalData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEvaluationStatus = async (id, status, observaciones = null) => {
  const updateData = { status, updated_at: new Date().toISOString() };
  if (observaciones !== null) updateData.observaciones = observaciones;
  const { data, error } = await supabase
    .from('ados2_evaluations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEvaluation = async (id) => {
  const { error } = await supabase.from('ados2_evaluations').delete().eq('id', id);
  if (error) throw error;
};

// ─────────────────────────────────────────────
// RESPUESTAS POR ÍTEM
// ─────────────────────────────────────────────

export const saveItemResponses = async (evaluationId, responses) => {
  const rows = responses.map(r => ({
    evaluation_id: evaluationId,
    item_code: r.code,
    item_name: r.name,
    domain: r.domain,
    raw_score: r.score,
    algorithm_score: [7, 8, 9].includes(r.score) ? 0 : r.score === 3 ? 2 : r.score,
  }));

  // Borrar respuestas anteriores y reemplazar
  await supabase.from('ados2_item_responses').delete().eq('evaluation_id', evaluationId);
  if (rows.length > 0) {
    const { error } = await supabase.from('ados2_item_responses').insert(rows);
    if (error) throw error;
  }
};

// ─────────────────────────────────────────────
// GUARDAR INFORME EN FICHA CLÍNICA
// ─────────────────────────────────────────────

/**
 * Save an ADOS-2 report to clinical_history so it persists in the patient's file.
 * If a report already exists for this evaluation, it updates it instead of creating a duplicate.
 */
export const saveReportToFicha = async ({ evaluationId, patientId, therapistId, evaluation, results, entryDate }) => {
  const rangoLabels = {
    autismo: 'Autismo',
    espectro_autista: 'Espectro Autista',
    no_tea: 'No TEA',
    moderada_severa: 'Preocupación Moderada-Severa',
    leve_moderada: 'Preocupación Leve-Moderada',
    poco_ninguna: 'Poco/Ninguna Preocupación',
  };

  const rango = evaluation.rango_preocupacion || results?.rango;
  const rangoLabel = rangoLabels[rango] || rango || 'No calculado';

  const summary = `Informe ADOS-2 — Módulo ${evaluation.module} — Resultado: ${rangoLabel} (Total: ${evaluation.total_global ?? results?.total_global ?? '—'})`;

  const sessionNotes = [
    `## Informe Evaluación ADOS-2`,
    `**Módulo:** ${evaluation.module}`,
    `**Fecha evaluación:** ${evaluation.fecha_evaluacion || ''}`,
    `**Examinador:** ${evaluation.examinador || ''}`,
    ``,
    `### Resultados`,
    `- **Total AS:** ${evaluation.total_as ?? results?.total_as ?? '—'}`,
    `- **Total CRR:** ${evaluation.total_crr ?? results?.total_crr ?? '—'}`,
    evaluation.module === '4' ? `- **Total COM:** ${evaluation.total_com ?? results?.total_com ?? '—'}` : null,
    `- **Total Global:** ${evaluation.total_global ?? results?.total_global ?? '—'}`,
    `- **Rango de Preocupación:** ${rangoLabel}`,
    ``,
    evaluation.observaciones ? `### Observaciones Clínicas\n${evaluation.observaciones}` : null,
    evaluation.informacion_adicional ? `### Información Adicional\n${evaluation.informacion_adicional}` : null,
  ].filter(Boolean).join('\n');

  const details = {
    evaluation_id: evaluationId,
    report_type: 'ados2',
    module: evaluation.module,
    algorithm: evaluation.algorithm,
    total_as: evaluation.total_as ?? results?.total_as,
    total_crr: evaluation.total_crr ?? results?.total_crr,
    total_com: evaluation.total_com ?? results?.total_com,
    total_global: evaluation.total_global ?? results?.total_global,
    rango_preocupacion: rango,
    saved_at: new Date().toISOString(),
  };

  // Check if already saved
  const { data: existing } = await supabase
    .from('clinical_history')
    .select('id')
    .eq('patient_id', patientId)
    .eq('entry_type', 'informe_tea')
    .contains('details', { evaluation_id: evaluationId })
    .maybeSingle();

  if (existing) {
    // Update existing
    const updateData = {
      summary,
      session_notes: sessionNotes,
      details,
      visibility: 'all',
      updated_at: new Date().toISOString(),
    };
    if (entryDate) updateData.entry_date = new Date(entryDate).toISOString();
    const { error } = await supabase
      .from('clinical_history')
      .update(updateData)
      .eq('id', existing.id);
    if (error) throw error;
    return { id: existing.id, updated: true };
  }

  // Create new entry
  const { data, error } = await supabase
    .from('clinical_history')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      entry_type: 'informe_tea',
      entry_date: entryDate ? new Date(entryDate).toISOString() : (evaluation.fecha_evaluacion ? new Date(evaluation.fecha_evaluacion).toISOString() : new Date().toISOString()),
      summary,
      session_notes: sessionNotes,
      details,
      status: 'completada',
      visibility: 'all',
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id, updated: false };
};

/**
 * Check if a report has already been saved to clinical_history for this evaluation.
 */
export const checkReportSaved = async (evaluationId, patientId) => {
  const { data, error } = await supabase
    .from('clinical_history')
    .select('id, created_at')
    .eq('patient_id', patientId)
    .eq('entry_type', 'informe_tea')
    .contains('details', { evaluation_id: evaluationId })
    .maybeSingle();

  if (error) return null;
  return data;
};

// ─────────────────────────────────────────────
// CÁLCULO DE PUNTAJES
// ─────────────────────────────────────────────

/**
 * Intenta calcular vía RPC server-side.
 * Si la función no existe, hace fallback client-side.
 */
export const calculateScores = async (evaluationId) => {
  const { data, error } = await supabase.rpc('calculate_ados2_scores', {
    p_evaluation_id: evaluationId,
  });

  // 42883 = function does not exist → fallback client-side
  if (error && (error.code === '42883' || error.message?.includes('does not exist'))) {
    return calculateScoresClientSide(evaluationId);
  }
  if (error) throw error;
  return data;
};

/**
 * Cálculo client-side cuando no hay RPC disponible.
 * Suma algorithm_score por dominio, clasifica rango según CUTOFF_SCORES.
 */
const calculateScoresClientSide = async (evaluationId) => {
  const eval_ = await fetchEvaluationById(evaluationId);
  const responses = eval_.responses || [];
  const mod = eval_.module;
  const algorithm = eval_.algorithm;

  // Sumar por dominio
  const sumDomain = (domain) =>
    responses
      .filter(r => r.domain === domain)
      .reduce((sum, r) => sum + (r.algorithm_score ?? 0), 0);

  const total_as = sumDomain('AS');
  const total_crr = sumDomain('CRR');
  const total_com = sumDomain('COM');

  let total_global;
  let rango = null;

  if (mod === '4') {
    // Módulo 4: resultado final = COM + ISR (AS)
    total_global = total_com + total_as;

    const cutoffs = CUTOFF_SCORES['4']?.com_isr;
    if (cutoffs) {
      rango = clasificarRango(total_global, cutoffs, false);
    }
  } else if (mod === 'T') {
    // Módulo T: AS + CRR, rangos de preocupación
    total_global = total_as + total_crr;

    const algKey = algorithm || 'todos_ninos';
    const cutoffs = CUTOFF_SCORES.T?.[algKey];
    if (cutoffs) {
      rango = clasificarRango(total_global, cutoffs, true);
    }
  } else {
    // Módulos 1, 2, 3: AS + CRR
    total_global = total_as + total_crr;

    const moduleCutoffs = CUTOFF_SCORES[mod];
    const algKey = algorithm || Object.keys(moduleCutoffs || {})[0] || 'unico';
    const cutoffs = moduleCutoffs?.[algKey];
    if (cutoffs) {
      rango = clasificarRango(total_global, cutoffs, false);
    }
  }

  // Guardar resultados en la evaluación
  const updateData = {
    total_as,
    total_crr,
    total_global,
    rango_preocupacion: rango,
    updated_at: new Date().toISOString(),
  };
  if (mod === '4') updateData.total_com = total_com;

  const { error } = await supabase
    .from('ados2_evaluations')
    .update(updateData)
    .eq('id', evaluationId);
  if (error) throw error;

  return {
    total_as,
    total_crr,
    total_com: mod === '4' ? total_com : null,
    total_global,
    rango,
  };
};
