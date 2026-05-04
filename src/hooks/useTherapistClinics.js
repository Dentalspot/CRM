import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

/**
 * Hook compartido para obtener TODAS las clínicas donde el dentista trabaja.
 *
 * Combina:
 *   - Clínicas que él posee (clinics.therapist_id = user.id)
 *   - Clínicas a las que fue invitado y aceptó (clinic_therapists.is_active = true)
 *
 * Reemplaza el patrón antiguo `clinics.eq('therapist_id', user.id)` que solo
 * traía las owned y omitía las linked (multi-clínica). Si encuentras código
 * que hace ese query, sustitúyelo por este hook.
 *
 * @param {object} opts
 * @param {string} opts.select - columnas a seleccionar (default 'id, name, address, type')
 * @param {boolean} opts.enabled - si false, no carga (default true)
 */
export const useTherapistClinics = (opts = {}) => {
  const {
    select = 'id, name, address, type, modalidad, is_active, organization_id',
    enabled = true,
    organizationId = null, // si se pasa, filtra a clínicas de esa org
  } = opts;
  const { user } = useAuth();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClinics = useCallback(async () => {
    if (!user?.id || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [ownedRes, linkedRes] = await Promise.all([
        supabase.from('clinics').select(select).eq('therapist_id', user.id),
        supabase
          .from('clinic_therapists')
          .select(`clinic:clinics(${select})`)
          .eq('therapist_id', user.id)
          .eq('is_active', true),
      ]);

      if (ownedRes.error) throw ownedRes.error;
      if (linkedRes.error) throw linkedRes.error;

      const owned = ownedRes.data || [];
      const linked = (linkedRes.data || []).map(r => r.clinic).filter(Boolean);
      const all = [...owned, ...linked];
      const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
      const scoped = organizationId
        ? unique.filter(c => c.organization_id === organizationId)
        : unique;
      scoped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setClinics(scoped);
    } catch (err) {
      logger.warn('[useTherapistClinics] fetch error:', err.message);
      setError(err);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, enabled, select, organizationId]);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  return { clinics, loading, error, refresh: fetchClinics };
};

export default useTherapistClinics;
