import { useState, useEffect, useCallback } from 'react';
import { blogApi } from '../api/blogApi';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

export const useBlogCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogApi.fetchCategories();
      setCategories(data || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching categories:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las categorías.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
};