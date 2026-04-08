import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const fetchArticleById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching article:', error);
    throw error;
  }
};

export const saveArticle = async (articleData) => {
  try {
    const { id, ...dataToSave } = articleData;
    let query;

    if (id) {
      // Update existing
      query = supabase
        .from('blog_posts')
        .update({ ...dataToSave, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
    } else {
      // Insert new
      query = supabase
        .from('blog_posts')
        .insert([{ ...dataToSave, created_at: new Date().toISOString() }])
        .select();
    }

    const { data, error } = await query;
    if (error) throw error;
    return data[0];
  } catch (error) {
    logger.error('Error saving article:', error);
    throw error;
  }
};

export const fetchTherapistArticles = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('author_id', therapistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching therapist articles:', error);
    throw error;
  }
};

/**
 * Get quick stats for the blog widget
 */
export const getBlogStats = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('status')
      .eq('author_id', therapistId);

    if (error) throw error;

    const pending = data.filter(p => p.status === 'pending_review').length;
    const published = data.filter(p => p.status === 'published').length;

    return { pending, published };
  } catch (error) {
    logger.error('Error fetching blog stats:', error);
    // Return zeros on error to not break UI
    return { pending: 0, published: 0 };
  }
};