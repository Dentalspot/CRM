import { useState, useCallback, useEffect } from 'react';
import { blogApi } from '../api/blogApi';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

export const useBlogPosts = (initialFilters = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ page: 0, limit: 10, ...initialFilters });
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await blogApi.fetchPosts(filters);
      setPosts(data || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err) {
      logger.error('Error fetching blog posts:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los artículos.",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 0 })); // Reset page on filter change
  };
  
  const setPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
    totalCount,
    filters,
    updateFilters,
    setPage
  };
};