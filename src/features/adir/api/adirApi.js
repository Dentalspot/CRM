
import { supabase } from '@/lib/supabaseClient';
import {
  ADIR_DOMAINS,
  ADIR_CUTOFFS,
  getActiveDomains,
  getActiveBDomain,
  toAlgorithmScore,
  clasificarAdir,
} from '@/features/adir/constants/adirItems';

// ─────────────────────────────────────────────
// EVALUACIONES
// ─────────────────────────────────────────────

export const fetchEvaluations = async (therapistId, patientId = null) => {
  let q = supabase
    .from('adir_evaluations')
    .select('*, patient:patients!adir_evaluations_patient_id_fkey(id, profile:profiles!patients_profile_id_fkey(full_name, birthdate, rut))')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(ev => ({
    ...ev,
    patient: ev.patient ? { id: ev.patient.id, full_name: ev.patient.profile?.full_name, birthdate: ev.patient.profile?.birthdate } : null,
  }));
};

export const fetchEvaluationById = async (id) => {
  const { data, error } = await supabase
    .from('adir_evaluations')
    .select('*, patient:patients!adir_evaluations_patient_id_fkey(id, profile:profiles!patients_profile_id_fkey(full_name, birthdate, rut)), responses:adir_item_responses(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (data?.patient) {
    data.patient = { id: data.patient.id, full_name: data.patient.profile?.full_name, birthdate: data.patient.profile?.birthdate };
  }
  return data;
};

export const createEvaluation = async (evalData) => {
  const { data, error } = await supabase
    .from('adir_evaluations')
    .insert(evalData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEvaluation = async (id, updateData) => {
  const { data, error } = await supabase
    .from('adir_evaluations')
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
  const { data, error } = await supabase
    .from('adir_evaluations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEvaluation = async (id) => {
  const { error } = await supabase.from('adir_evaluations').delete().eq('id', id);
  if (error) throw error;
};

// ─────────────────────────────────────────────
// RESPUESTAS POR ÍTEM
// ─────────────────────────────────────────────

/**
 * Guarda las respuestas de una evaluación ADI-R.
 * Soporta múltiples períodos por ítem (current, 4_5_years, ever).
 */
export const saveItemResponses = async (evaluationId, responses) => {
  const rows = responses.map(r => ({
    evaluation_id: evaluationId,
    item_code: r.code,
    item_name: r.name,
    domain: r.domain,
    raw_score: r.score,
    algorithm_score: toAlgorithmScore(r.score),
    period: r.period || 'current',
    notes: r.notes || null,
  }));

  // Borrar respuestas anteriores y reemplazar
  await supabase.from('adir_item_responses').delete().eq('evaluation_id', evaluationId);
  if (rows.length > 0) {
    const { error } = await supabase.from('adir_item_responses').insert(rows);
    if (error) throw error;
  }
};

// ─────────────────────────────────────────────
// CÁLCULO DE PUNTAJES
// ─────────────────────────────────────────────

/**
 * Calcula los scores del algoritmo diagnóstico ADI-R.
 * 
 * Diferencias con ADOS-2:
 * - ADI-R usa el período "4_5_years" O "ever" para el algoritmo (no "current")
 *   EXCEPTO dominio D que siempre usa "ever".
 * - La clasificación requiere cumplir TODOS los dominios (A, B, C, D).
 * - No hay "rango de preocupación", es binario: cumple/no cumple por dominio.
 */
export const calculateScores = async (evaluationId) => {
  const eval_ = await fetchEvaluationById(evaluationId);
  const responses = eval_.responses || [];
  const verbalStatus = eval_.verbal_status || 'verbal';
  const activeBDomain = getActiveBDomain(verbalStatus);

  // Para el algoritmo, usar las puntuaciones del período "4_5_years" cuando existan,
  // fallback a "current". Dominio D siempre usa "ever".
  const getAlgorithmScore = (itemCode, domain) => {
    const targetPeriod = domain === 'D' ? 'ever' : '4_5_years';
    
    // Buscar en período preferido primero
    let response = responses.find(
      r => r.item_code === itemCode && r.period === targetPeriod
    );
    // Fallback a current si no hay dato del período preferido
    if (!response) {
      response = responses.find(
        r => r.item_code === itemCode && r.period === 'current'
      );
    }
    // Fallback a cualquier período
    if (!response) {
      response = responses.find(r => r.item_code === itemCode);
    }

    return response ? (response.algorithm_score ?? toAlgorithmScore(response.raw_score)) : 0;
  };

  // Sumar por dominio
  const sumDomain = (domainKey) => {
    const domainData = ADIR_DOMAINS[domainKey];
    if (!domainData) return null;
    return domainData.items.reduce(
      (sum, item) => sum + getAlgorithmScore(item.code, domainKey),
      0
    );
  };

  const total_a = sumDomain('A');
  const total_b = sumDomain(activeBDomain);
  const total_c = sumDomain('C');
  const total_d = sumDomain('D');

  // Clasificar
  const totals = { A: total_a, B: total_b, C: total_c, D: total_d };
  const { cumple, clasificacion } = clasificarAdir(totals, verbalStatus);

  // Guardar resultados
  const updateData = {
    total_a,
    total_b,
    total_c,
    total_d,
    cumple_criterio_a: cumple.A,
    cumple_criterio_b: cumple.B,
    cumple_criterio_c: cumple.C,
    cumple_criterio_d: cumple.D,
    clasificacion,
    status: 'completada',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('adir_evaluations')
    .update(updateData)
    .eq('id', evaluationId);
  if (error) throw error;

  return { total_a, total_b, total_c, total_d, cumple, clasificacion };
};

// ─────────────────────────────────────────────
// HELPERS DE VALIDACIÓN
// ─────────────────────────────────────────────

/**
 * Verifica qué ítems faltan por puntuar.
 * Retorna un objeto { domain: [itemCodes] } con los faltantes.
 */
export const getMissingItems = (responses, verbalStatus) => {
  const activeDomains = getActiveDomains(verbalStatus);
  const missing = {};

  activeDomains.forEach(domainKey => {
    const domainData = ADIR_DOMAINS[domainKey];
    if (!domainData) return;

    const missingInDomain = domainData.items.filter(item => {
      // Al menos un período debe tener respuesta
      return !responses.some(r => r.item_code === item.code);
    });

    if (missingInDomain.length > 0) {
      missing[domainKey] = missingInDomain.map(i => i.code);
    }
  });

  return missing;
};

/**
 * Calcula el porcentaje de completitud de la evaluación.
 */
export const getCompletionPercentage = (responses, verbalStatus) => {
  const activeDomains = getActiveDomains(verbalStatus);
  let totalItems = 0;
  let completedItems = 0;

  activeDomains.forEach(domainKey => {
    const domainData = ADIR_DOMAINS[domainKey];
    if (!domainData) return;

    domainData.items.forEach(item => {
      totalItems++;
      if (responses.some(r => r.item_code === item.code)) {
        completedItems++;
      }
    });
  });

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};
