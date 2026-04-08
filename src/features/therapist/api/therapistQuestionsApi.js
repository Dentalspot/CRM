import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Get all questions available for therapists to answer
 * Usually filters by status 'pending' (unanswered)
 */
export const getPatientQuestions = async ({ status = 'pending', limit = 50 } = {}) => {
  try {
    // Removed avatar_url from the selection because it does not exist on the profiles table.
    // The UI will handle the missing avatar by showing initials.
    let query = supabase
      .from('patient_questions')
      .select(`
        *,
        patient:profiles!patient_questions_patient_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching patient questions:', error);
    throw error;
  }
};

/**
 * Get count of open questions
 */
export const getOpenQuestionsCount = async () => {
  try {
    const { count, error } = await supabase
      .from('patient_questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error('Error counting questions:', error);
    return 0;
  }
};

/**
 * Submit an answer (creates a blog post draft linked to the question)
 * Actually, usually we just link to the blog creation flow, 
 * but this function might update the question status if needed directly.
 */
export const updateQuestionStatus = async (questionId, status) => {
  try {
    const { data, error } = await supabase
      .from('patient_questions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating question status:', error);
    throw error;
  }
};