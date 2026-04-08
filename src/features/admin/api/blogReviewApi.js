import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch all articles pending review
 */
export const fetchPendingArticles = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching pending articles:', error);
    throw error;
  }
};

/**
 * Process article review (Approve or Reject)
 */
export const reviewArticle = async ({ articleId, reviewerId, action, comments }) => {
  try {
    // 1. Determine new status based on action
    const newStatus = action === 'approved' ? 'published' : 'draft';
    const publishedAt = action === 'approved' ? new Date().toISOString() : null;

    // 2. Update blog_post status
    const updateData = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (publishedAt) {
      updateData.published_at = publishedAt;
    }

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', articleId);

    if (updateError) throw updateError;

    // 3. Create review record
    const { error: reviewError } = await supabase
      .from('blog_reviews')
      .insert({
        blog_post_id: articleId,
        reviewer_id: reviewerId,
        action,
        comments,
        reviewed_at: new Date().toISOString()
      });

    if (reviewError) throw reviewError;

    return true;
  } catch (error) {
    logger.error('Error processing review:', error);
    throw error;
  }
};