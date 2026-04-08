import { supabase } from '@/lib/supabaseClient';
import { lookupTecal, TECAL_SECTIONS } from '@/features/pie/constants/tecalNorms';
import { lookupStsg } from '@/features/pie/constants/stsgNorms';
import { lookupTeprosif } from '@/features/pie/constants/teprosifNorms';
import logger from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════
// Helpers genéricos
// ═══════════════════════════════════════════════════

const patientJoin = (table) =>
  `*, patient:patients!${table}_patient_id_fkey(id, profile:profiles!patients_profile_id_fkey(full_name, birthdate, rut))`;

const flattenPatient = (ev) => {
  if (!ev) return ev;
  if (ev.patient) {
    ev.patient = {
      id: ev.patient.id,
      full_name: ev.patient.profile?.full_name,
      birthdate: ev.patient.profile?.birthdate,
    };
  }
  return ev;
};

async function fetchList(table, therapistId, patientId = null) {
  let q = supabase
    .from(table)
    .select(patientJoin(table))
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(flattenPatient);
}

async function fetchById(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select(patientJoin(table))
    .eq('id', id)
    .single();
  if (error) throw error;
  return flattenPatient(data);
}

async function insert(table, evalData) {
  const { data, error } = await supabase.from(table).insert(evalData).select().single();
  if (error) throw error;
  return data;
}

async function update(table, id, updateData) {
  const { data, error } = await supabase
    .from(table)
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════
// TECAL
// ═══════════════════════════════════════════════════

export const fetchTecalEvaluations = (tid, pid) => fetchList('tecal_evaluations', tid, pid);
export const fetchTecalById = (id) => fetchById('tecal_evaluations', id);
export const createTecalEvaluation = (d) => insert('tecal_evaluations', d);
export const updateTecalEvaluation = (id, d) => update('tecal_evaluations', id, d);
export const deleteTecalEvaluation = (id) => remove('tecal_evaluations', id);

/**
 * Calculate TECAL results from item-level responses
 * items_responses: { "1": true, "2": false, ... } (true=correct)
 * Computes errors per section from individual items, then classifies
 */
export async function calculateTecalResults(id) {
  const ev = await fetchTecalById(id);
  const responses = ev.items_responses || {};

  // Count errors per section from individual items
  const vocabItems = Array.from({ length: 41 }, (_, i) => i + 1);   // 1-41
  const morfoItems = Array.from({ length: 48 }, (_, i) => i + 42);  // 42-89
  const sintItems  = Array.from({ length: 12 }, (_, i) => i + 90);  // 90-101

  const countErrors = (items) => items.filter(n => responses[String(n)] === false).length;

  const errVocab = countErrors(vocabItems);
  const errMorfo = countErrors(morfoItems);
  const errSint  = countErrors(sintItems);

  const pVocab = TECAL_SECTIONS.vocabulario.total - errVocab;
  const pMorfo = TECAL_SECTIONS.morfologia.total - errMorfo;
  const pSint  = TECAL_SECTIONS.sintaxis.total - errSint;
  const pTotal = pVocab + pMorfo + pSint;

  const rV = lookupTecal('vocabulario', pVocab);
  const rM = lookupTecal('morfologia', pMorfo);
  const rS = lookupTecal('sintaxis', pSint);
  const rT = lookupTecal('total', pTotal);

  const results = {
    errores_vocabulario: errVocab, errores_morfologia: errMorfo, errores_sintaxis: errSint,
    puntaje_vocabulario: pVocab, puntaje_morfologia: pMorfo,
    puntaje_sintaxis: pSint, puntaje_total: pTotal,
    de_vocabulario: rV.de, de_morfologia: rM.de, de_sintaxis: rS.de, de_total: rT.de,
    resultado_vocabulario: rV.resultado, resultado_morfologia: rM.resultado,
    resultado_sintaxis: rS.resultado, resultado_total: rT.resultado,
    status: 'completada',
  };

  return update('tecal_evaluations', id, results);
}

// ═══════════════════════════════════════════════════
// STSG
// ═══════════════════════════════════════════════════

export const fetchStsgEvaluations = (tid, pid) => fetchList('stsg_evaluations', tid, pid);
export const fetchStsgById = (id) => fetchById('stsg_evaluations', id);
export const createStsgEvaluation = (d) => insert('stsg_evaluations', d);
export const updateStsgEvaluation = (id, d) => update('stsg_evaluations', id, d);
export const deleteStsgEvaluation = (id) => remove('stsg_evaluations', id);

/**
 * Calculate STSG results from phrase-level responses
 * Puntaje is pre-calculated in the frontend and saved before this call.
 * items_responses: { "r1a": true, "r1b": false, ..., "e1a": true, ... }
 */
export async function calculateStsgResults(id) {
  const ev = await fetchStsgById(id);
  const age = ev.edad_anios || 3;

  const rR = lookupStsg('receptivo', age, ev.puntaje_receptivo || 0);
  const rE = lookupStsg('expresivo', age, ev.puntaje_expresivo || 0);

  const results = {
    percentil_receptivo: rR.percentil, resultado_receptivo: rR.resultado,
    percentil_expresivo: rE.percentil, resultado_expresivo: rE.resultado,
    status: 'completada',
  };

  return update('stsg_evaluations', id, results);
}

// ═══════════════════════════════════════════════════
// TEPROSIF-R
// ═══════════════════════════════════════════════════

export const fetchTeprosifEvaluations = (tid, pid) => fetchList('teprosif_evaluations', tid, pid);
export const fetchTeprosifById = (id) => fetchById('teprosif_evaluations', id);
export const createTeprosifEvaluation = (d) => insert('teprosif_evaluations', d);
export const updateTeprosifEvaluation = (id, d) => update('teprosif_evaluations', id, d);
export const deleteTeprosifEvaluation = (id) => remove('teprosif_evaluations', id);

export async function calculateTeprosifResults(id) {
  const ev = await fetchTeprosifById(id);
  const age = ev.edad_anios || 3;
  const total = (ev.total_estructurales || 0) + (ev.total_asimilacion || 0) + (ev.total_sustitucion || 0);
  const r = lookupTeprosif(age, total);

  const results = {
    total_procesos: total,
    resultado: r.resultado,
    status: 'completada',
  };

  return update('teprosif_evaluations', id, results);
}
