import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para obtener el plan de crecimiento profesional del terapeuta
 * Conecta con RPC get_therapist_growth_plan()
 */
export const useTherapistGrowth = (therapistId) => {
  const [growthPlan, setGrowthPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrowthPlan = useCallback(async () => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('get_therapist_growth_plan', { p_therapist_id: therapistId });

      if (rpcError) throw rpcError;
      
      setGrowthPlan(data);
    } catch (err) {
      logger.error('Error fetching growth plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchGrowthPlan();
  }, [fetchGrowthPlan]);

  return { growthPlan, loading, error, refetch: fetchGrowthPlan };
};

/**
 * Hook para buscar cursos del catálogo
 * Conecta con RPC search_courses()
 */
export const useCourseSearch = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const search = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('search_courses', {
          p_specialty_slug: filters.specialty || null,
          p_education_level: filters.level || null,
          p_modality: filters.modality || null,
          p_limit: filters.limit || 20,
          p_offset: filters.offset || 0,
        });

      if (rpcError) throw rpcError;

      setCourses(data?.results || []);
      setTotalCount(data?.total_count || 0);
    } catch (err) {
      logger.error('Error searching courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { courses, totalCount, loading, error, search };
};

export default useTherapistGrowth;