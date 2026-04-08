import { useState, useEffect, useCallback } from 'react';
import { fonoLevelApi } from '../api/fonoLevelApi';

/**
 * Hook to fetch the detailed DentalLevel and reputation data for a single therapist.
 * @param {string} therapistId - The UUID of the therapist.
 * @returns {{detail: object, loading: boolean, error: Error|null, refetch: function}}
 */
export const useDentalLevelDetail = (therapistId) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!therapistId) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const data = await fonoLevelApi.fetchTherapistLevelDetail(therapistId);
      setDetail(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
};