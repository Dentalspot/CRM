import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook que lista los dentistas activos de una organización.
 *
 * Fuente de verdad: `clinic_therapists` (donde `is_active=true`) JOIN `profiles`.
 * Esto encaja con "Gestión de Personal" (ClinicTherapistsManagementPage) que lee
 * del mismo lugar — así todas las UIs muestran la misma lista de dentistas.
 *
 * Edge case: el dentista dueño de su clínica solo, si por alguna razón no tiene
 * row en `clinic_therapists` para sí mismo (data drift, onboarding incompleto),
 * lo agregamos como fallback consultando `profiles` por `currentUserId` si el rol
 * es 'therapist'. Esto previene dropdowns vacíos en el caso "dentista solo".
 *
 * @param {Object} opts
 * @param {string} opts.organizationId - obligatorio
 * @param {string|null} opts.currentUserId - opcional, marca isMe + fallback dentista solo
 * @returns {{ dentists: Array<{id,full_name,email,isMe}>, loading: boolean, error: any }}
 */
export const useDentistList = ({ organizationId, currentUserId = null }) => {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId) {
      setDentists([]);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Clínicas de la organización
        const { data: clinics, error: clinicsErr } = await supabase
          .from('clinics')
          .select('id')
          .eq('organization_id', organizationId);

        if (clinicsErr) throw clinicsErr;

        const clinicIds = (clinics || []).map((c) => c.id);

        // 2) clinic_therapists activos en esas clínicas, embebiendo profile
        let rows = [];
        if (clinicIds.length > 0) {
          const { data, error: ctErr } = await supabase
            .from('clinic_therapists')
            .select('therapist_id, profiles:therapist_id (id, full_name, email)')
            .in('clinic_id', clinicIds)
            .eq('is_active', true);
          if (ctErr) throw ctErr;
          rows = data || [];
        }

        // 3) Dedupe por id de profile (un dentista puede estar en varias clínicas de la org)
        const seen = new Set();
        const list = [];
        for (const r of rows) {
          const p = r.profiles;
          if (!p || seen.has(p.id)) continue;
          seen.add(p.id);
          list.push({
            id: p.id,
            full_name: p.full_name || p.email,
            email: p.email,
            isMe: currentUserId && p.id === currentUserId,
          });
        }

        // 4) Fallback dentista solo: si currentUser es therapist y no está en la lista,
        //    lo agregamos (cubre data drift / onboarding incompleto).
        if (currentUserId && !seen.has(currentUserId)) {
          try {
            const { data: me } = await supabase
              .from('profiles')
              .select('id, full_name, email, role')
              .eq('id', currentUserId)
              .maybeSingle();
            if (me?.role === 'therapist') {
              list.push({
                id: me.id,
                full_name: me.full_name || me.email,
                email: me.email,
                isMe: true,
              });
            }
          } catch (fbErr) {
            logger.warn('[useDentistList] fallback profile lookup failed:', fbErr?.message);
          }
        }

        // 5) Orden estable: yo primero, después por full_name
        list.sort((a, b) => {
          if (a.isMe && !b.isMe) return -1;
          if (!a.isMe && b.isMe) return 1;
          return (a.full_name || '').localeCompare(b.full_name || '');
        });

        if (!cancelled) setDentists(list);
      } catch (err) {
        logger.error('[useDentistList] error:', err);
        if (!cancelled) {
          setError(err);
          setDentists([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [organizationId, currentUserId]);

  return { dentists, loading, error };
};

export default useDentistList;
