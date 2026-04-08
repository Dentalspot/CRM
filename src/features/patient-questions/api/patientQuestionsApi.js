import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Obtiene las preguntas de un paciente.
 * @param {string} patientId - El UUID del paciente.
 */
export const fetchQuestions = async (patientId) => {
  if (!patientId) {
    throw new Error('El ID del paciente es requerido');
  }

  const { data, error } = await supabase
    .from('patient_questions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching questions:', error);
    throw error;
  }

  return data;
};

/**
 * Crea una nueva pregunta.
 * @param {object} questionData - Los datos de la pregunta { patient_id, title, body }.
 */
export const createQuestion = async (questionData) => {
  const { data, error } = await supabase
    .from('patient_questions')
    .insert([{
      ...questionData,
      status: 'pending' // El estado inicial es siempre 'pending'.
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating question:', error);
    throw error;
  }

  return data;
};

/**
 * Actualiza una pregunta existente.
 * @param {string} questionId - El UUID de la pregunta.
 * @param {object} updates - Los campos a actualizar { title, body }.
 */
export const updateQuestion = async (questionId, updates) => {
  const { data, error } = await supabase
    .from('patient_questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating question:', error);
    throw error;
  }

  return data;
};

/**
 * Elimina una pregunta.
 * @param {string} questionId - El UUID de la pregunta.
 */
export const deleteQuestion = async (questionId) => {
  const { error } = await supabase
    .from('patient_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    logger.error('Error deleting question:', error);
    throw error;
  }

  return true;
};