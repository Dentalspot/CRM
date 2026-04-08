import { useState, useEffect, useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useBlogSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, status, specialty_id, created_at')
        .ilike('title', `%${searchTerm.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      logger.error('Blog search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    loading,
  };
};
