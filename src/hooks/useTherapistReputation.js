import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para obtener la reputación clínica de un terapeuta
 * Conecta con RPC get_therapist_reputation()
 */
export const useTherapistReputation = (therapistId) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReputation = useCallback(async () => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('get_therapist_reputation', { p_therapist_id: therapistId });

      if (rpcError) throw rpcError;

      setReputation(data);
    } catch (err) {
      logger.error('Error fetching therapist reputation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { reputation, loading, error, refetch: fetchReputation };
};

/**
 * Hook para búsqueda con filtros de reputación
 * Conecta con RPC search_therapists_with_reputation()
 */
export const useReputationSearch = (initialFilters = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const search = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('search_therapists_with_reputation', {
          p_specialty_slug: filters.specialty || null,
          p_min_score: filters.minScore || 0,
          p_badge_level: filters.badgeLevel || null,
          p_limit: filters.limit || 20,
          p_offset: filters.offset || 0,
        });

      if (rpcError) throw rpcError;

      setResults(data?.results || []);
      setTotalCount(data?.total_count || 0);
    } catch (err) {
      logger.error('Error searching reputation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, totalCount, loading, error, search };
};

/**
 * Hook para obtener ranking de especialidad
 * Conecta con RPC get_specialty_ranking()
 */
export const useSpecialtyRanking = (specialtySlug, limit = 10) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!specialtySlug) {
      setLoading(false);
      return;
    }

    const fetchRanking = async () => {
      try {
        setLoading(true);
        const { data, error: rpcError } = await supabase
          .rpc('get_specialty_ranking', {
            p_specialty_slug: specialtySlug,
            p_limit: limit,
          });

        if (rpcError) throw rpcError;
        setRanking(data || []);
      } catch (err) {
        logger.error('Error fetching ranking:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [specialtySlug, limit]);

  return { ranking, loading, error };
};

export default useTherapistReputation;