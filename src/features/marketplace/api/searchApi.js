import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const saveSearch = async (userId, name, filters) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_saved_searches')
      .insert({
        user_id: userId,
        name,
        filters
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error saving search:', error);
    throw error;
  }
};

export const getSavedSearches = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching saved searches:', error);
    throw error;
  }
};

export const deleteSavedSearch = async (searchId) => {
  try {
    const { error } = await supabase
      .from('marketplace_saved_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error deleting saved search:', error);
    throw error;
  }
};