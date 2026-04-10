import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sends a message to the AI chatbot edge function.
 * @param {string} userMessage - The message text from the user.
 * @param {Object} patientContext - Context data about the patient (appointments, etc.).
 * @param {Array} chatHistory - Previous messages in the conversation.
 * @returns {Promise<Object>} - The response from the AI including text and suggestions.
 */
export const sendChatMessage = async (userMessage, patientContext, chatHistory, isPublic = false) => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-with-ai', {
      body: {
        userMessage,
        patientContext,
        chatHistory: (chatHistory || []).slice(-10),
        useRAG: !isPublic,
        isPublic
      },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    logger.error('Error sending chat message:', err);
    throw err;
  }
};

// --- FAQ CRUD Operations ---

/**
 * Fetches all FAQs from the database.
 * @returns {Promise<{success: boolean, data: Array, error: Object}>}
 */
export const fetchAllFaqs = async () => {
  try {
    const { data, error } = await supabase
      .from('faq_chatbot')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    return { success: false, error };
  }
};

/**
 * Creates a new FAQ entry.
 * @param {Object} faqData - { question, answer, category }
 * @returns {Promise<{success: boolean, data: Object, error: Object}>}
 */
export const createFaq = async (faqData) => {
  try {
    const { data, error } = await supabase
      .from('faq_chatbot')
      .insert([{
        question: faqData.question,
        answer: faqData.answer,
        category: faqData.category || 'general',
        link: faqData.link || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    return { success: false, error };
  }
};

/**
 * Updates an existing FAQ entry.
 * @param {string} faqId - The UUID of the FAQ to update
 * @param {Object} faqData - { question, answer, category }
 * @returns {Promise<{success: boolean, data: Object, error: Object}>}
 */
export const updateFaq = async (faqId, faqData) => {
  try {
    const { data, error } = await supabase
      .from('faq_chatbot')
      .update({
        question: faqData.question,
        answer: faqData.answer,
        category: faqData.category,
        link: faqData.link || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', faqId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    return { success: false, error };
  }
};

/**
 * Deletes an FAQ entry by ID.
 * @param {string} faqId - The UUID of the FAQ to delete
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const deleteFaq = async (faqId) => {
  try {
    const { error } = await supabase
      .from('faq_chatbot')
      .delete()
      .eq('id', faqId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    return { success: false, error };
  }
};