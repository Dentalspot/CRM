import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook que devuelve las clínicas activas del dentista actual.
 * Lee de clinic_therapists JOIN clinics.
 */
export const useTherapistClinics = (therapistId) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!therapistId) return;
    let mounted = true;
    setLoading(true);

    supabase
      .from('clinic_therapists')
      .select('clinic_id, clinics:clinic_id(id, name)')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          logger.warn('[useTherapistClinics] error:', error);
          setClinics([]);
        } else {
          // Normalizar: { id, name }
          const list = (data || [])
            .map(row => row.clinics)
            .filter(Boolean);
          setClinics(list);
        }
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [therapistId]);

  return { clinics, loading };
};
