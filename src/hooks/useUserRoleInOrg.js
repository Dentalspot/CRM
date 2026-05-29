/**
 * @file src/hooks/useUserRoleInOrg.js
 *
 * Hook que devuelve los roles activos del user logueado en una org específica.
 * Usado por spec 028 para implementar default smart en selector de dentista:
 *   - rol dentist (puro o combinado con clinic_admin) → auto-self
 *   - rol clinic_admin puro o assistant → vacío con placeholder
 *
 * El rol vive en organization_members, no en JWT (puede cambiar sin re-login).
 * Por eso consultamos la tabla directamente en lugar de leer user_metadata.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

export default function useUserRoleInOrg(organizationId) {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!organizationId || !user?.id) {
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          logger.warn('useUserRoleInOrg failed:', error.message);
          setRoles([]);
        } else {
          setRoles((data || []).map((r) => r.role));
        }
      })
      .then(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [user?.id, organizationId]);

  return {
    roles,
    isDentist: roles.includes('dentist'),
    isClinicAdmin: roles.includes('clinic_admin'),
    isAssistant: roles.includes('assistant'),
    loading,
  };
}
