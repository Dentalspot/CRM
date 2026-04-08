import { supabase } from '@/lib/supabaseClient';
import { SENSORIAL_SECTIONS, SECTION_NORMS, classifyScore } from '../constants/sensorialItems';

// ─── Evaluations CRUD ───

export const fetchEvaluations = async (therapistId, patientId = null) => {
  let query = supabase
    .from('sensorial_evaluations')
    .select(`
      *,
      patient:patients!sensorial_evaluations_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(full_name)
      )
    `)
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const fetchEvaluationById = async (id) => {
  const { data, error } = await supabase
    .from('sensorial_evaluations')
    .select(`
      *,
      patient:patients!sensorial_evaluations_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(full_name)
      ),
      responses:sensorial_item_responses(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createEvaluation = async (evalData) => {
  const { data, error } = await supabase
    .from('sensorial_evaluations')
    .insert(evalData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvaluation = async (id, updateData) => {
  const { data, error } = await supabase
    .from('sensorial_evaluations')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvaluationStatus = async (id, status, observaciones = null) => {
  const updateData = { status, updated_at: new Date().toISOString() };
  if (observaciones !== null) updateData.observaciones = observaciones;

  const { error } = await supabase
    .from('sensorial_evaluations')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
};

export const deleteEvaluation = async (id) => {
  const { error } = await supabase
    .from('sensorial_evaluations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ─── Item Responses ───

export const saveItemResponses = async (evaluationId, responses) => {
  const rows = responses.map(r => ({
    evaluation_id: evaluationId,
    item_code: r.code,
    item_name: r.name,
    section: r.section,
    score: r.score,
    notes: r.notes || null,
  }));

  const { error } = await supabase
    .from('sensorial_item_responses')
    .upsert(rows, { onConflict: 'evaluation_id,item_code' });

  if (error) throw error;
};

// ─── Scoring & Classification ───

export const calculateScores = async (evaluationId) => {
  // Fetch all responses
  const { data: responses, error } = await supabase
    .from('sensorial_item_responses')
    .select('*')
    .eq('evaluation_id', evaluationId);

  if (error) throw error;

  // Group by section and sum
  const sectionScores = {};
  const sectionClassifications = {};

  Object.keys(SENSORIAL_SECTIONS).forEach(sectionKey => {
    const sectionResponses = (responses || []).filter(r => r.section === sectionKey);
    const total = sectionResponses.reduce((sum, r) => sum + (r.score || 0), 0);
    sectionScores[sectionKey] = total;
    sectionClassifications[sectionKey] = classifyScore(total, sectionKey);
  });

  // Overall score
  const totalScore = Object.values(sectionScores).reduce((sum, s) => sum + s, 0);

  // Count atypical sections
  const atypicalCount = Object.values(sectionClassifications)
    .filter(c => c === 'more' || c === 'much_more' || c === 'less' || c === 'much_less').length;

  // Overall classification
  let overallClassification;
  if (atypicalCount >= 4) overallClassification = 'significativo';
  else if (atypicalCount >= 2) overallClassification = 'moderado';
  else if (atypicalCount >= 1) overallClassification = 'leve';
  else overallClassification = 'tipico';

  // Save to evaluation
  const updateData = {
    scores_by_section: sectionScores,
    classifications_by_section: sectionClassifications,
    total_score: totalScore,
    overall_classification: overallClassification,
    atypical_sections: atypicalCount,
    status: 'completada',
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('sensorial_evaluations')
    .update(updateData)
    .eq('id', evaluationId);

  if (updateError) throw updateError;

  return { sectionScores, sectionClassifications, totalScore, overallClassification, atypicalCount };
};

// ─── Helpers ───

export const getCompletionPercentage = (responses) => {
  const totalItems = Object.values(SENSORIAL_SECTIONS)
    .reduce((sum, s) => sum + s.items.length, 0);
  const answered = (responses || []).filter(r => r.score > 0).length;
  return Math.round((answered / totalItems) * 100);
};

export const getMissingSections = (responses) => {
  const missing = [];
  Object.entries(SENSORIAL_SECTIONS).forEach(([key, section]) => {
    const sectionResponses = (responses || []).filter(r => r.section === key && r.score > 0);
    if (sectionResponses.length < section.items.length) {
      missing.push({ key, label: section.label, answered: sectionResponses.length, total: section.items.length });
    }
  });
  return missing;
};
