import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch reviews for a specific marketplace item
 * @param {string} itemId - marketplace_item_id
 */
export const fetchItemReviews = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(full_name, avatar_url)
      `)
      .eq('marketplace_item_id', itemId) // Correcto: usa marketplace_item_id
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to expected format
    return (data || []).map(review => ({
      ...review,
      comment: review.content, // El campo en DB es 'content', frontend espera 'comment'
    }));
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    throw error;
  }
};

/**
 * Check if the current user has purchased the item and completed the order
 * @param {string} itemId - marketplace_item_id
 * @param {string} userId
 */
export const checkUserPurchase = async (itemId, userId) => {
  if (!userId || !itemId) return false;

  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order:marketplace_orders!inner(buyer_id, status)
      `)
      .eq('marketplace_item_id', itemId)
      .eq('order.buyer_id', userId)
      .eq('order.status', 'completed')
      .limit(1);

    if (error) {
      logger.error('Error checking purchase:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    logger.error('Error checking purchase:', error);
    return false;
  }
};

/**
 * Submit or update a review
 * @param {Object} reviewData - { marketplace_item_id, reviewer_id, rating, content/comment }
 */
export const submitReview = async (reviewData) => {
  try {
    // Normalize field names
    const normalizedData = {
      marketplace_item_id: reviewData.marketplace_item_id || reviewData.item_id,
      reviewer_id: reviewData.reviewer_id,
      rating: reviewData.rating,
      content: reviewData.content || reviewData.comment, // DB usa 'content'
      title: reviewData.title || null,
      is_visible: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('marketplace_reviews')
      .upsert(normalizedData, {
        onConflict: 'marketplace_item_id,reviewer_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    // Return with comment alias for frontend compatibility
    return {
      ...data,
      comment: data.content
    };
  } catch (error) {
    logger.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * Get the user's vote for a specific review
 * @param {string} reviewId
 * @param {string} userId
 */
export const getUserVote = async (reviewId, userId) => {
  if (!userId || !reviewId) return null;

  try {
    const { data, error } = await supabase
      .from('review_helpful_votes')
      .select('is_helpful')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching vote:', error);
      return null;
    }

    // Convert boolean to vote_type string
    if (data === null) return null;
    return data.is_helpful ? 'helpful' : 'unhelpful';
  } catch (error) {
    logger.error('Error fetching vote:', error);
    return null;
  }
};

/**
 * Cast a vote on a review (helpful/unhelpful)
 * Toggles if same vote exists, updates if different.
 * @param {string} reviewId
 * @param {string} userId
 * @param {string} voteType - 'helpful' or 'unhelpful'
 */
export const castVote = async (reviewId, userId, voteType) => {
  try {
    // Convert voteType to boolean for DB
    const isHelpful = voteType === 'helpful';

    // Check existing vote first
    const existingVote = await getUserVote(reviewId, userId);

    if (existingVote === voteType) {
      // If clicking same vote, remove it (toggle off)
      const { error } = await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;
      return null; // Vote removed
    } else {
      // Insert or Update
      const { data, error } = await supabase
        .from('review_helpful_votes')
        .upsert({
          review_id: reviewId,
          user_id: userId,
          is_helpful: isHelpful,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'review_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        vote_type: data.is_helpful ? 'helpful' : 'unhelpful'
      };
    }
  } catch (error) {
    logger.error('Error casting vote:', error);
    throw error;
  }
};

/**
 * Get review statistics for an item
 * @param {string} itemId
 */
export const getReviewStats = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select('rating')
      .eq('marketplace_item_id', itemId)
      .eq('is_visible', true);

    if (error) throw error;

    const reviews = data || [];
    const total = reviews.length;

    if (total === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const distribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      total,
      average: (sum / total).toFixed(1),
      distribution
    };
  } catch (error) {
    logger.error('Error getting review stats:', error);
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

/**
 * Report a review
 * @param {string} reviewId
 * @param {string} reporterId
 * @param {string} reason
 */
export const reportReview = async (reviewId, reporterId, reason) => {
  try {
    const { data, error } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reporter_id: reporterId,
        reason: reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error reporting review:', error);
    throw error;
  }
};