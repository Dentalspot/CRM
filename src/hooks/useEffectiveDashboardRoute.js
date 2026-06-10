/**
 * @file src/hooks/useEffectiveDashboardRoute.js
 *
 * Resuelve la ruta de "Panel Principal" / "Agenda" del usuario actual con
 * priority swap (spec 028): clinic_admin > dentist > assistant > profile.role.
 *
 * NO depende del OrganizationContext (que solo vive dentro de /dashboard/*),
 * asi funciona tambien desde el Header marketing (/, /para-dentistas, /blog/*).
 *
 * Consulta organization_members directo a Supabase con un caching simple por
 * user.id (window-scoped, se invalida al recargar).
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';

// Cache en memoria por user.id → { roles, loadedAt }
const cache = new Map();
const CACHE_TTL_MS = 60_000; // 1 min, suficiente para nav SPA

function getDashboardPath(role) {
  if (role === USER_ROLES.CLINIC) return '/dashboard/clinic';
  if (role === USER_ROLES.ASSISTANT) return '/dashboard/assistant';
  if (role === USER_ROLES.THERAPIST) return '/dashboard/therapist';
  if (role === USER_ROLES.PATIENT) return '/dashboard/patient';
  if (role === USER_ROLES.ADMIN) return '/admin';
  return '/dashboard';
}

function getAgendaPath(role) {
  if (role === USER_ROLES.CLINIC) return '/dashboard/clinic/agendas';
  if (role === USER_ROLES.ASSISTANT) return '/dashboard/assistant/agenda';
  return '/dashboard/calendar';
}

/**
 * @returns {{
 *   resolvedRole: string|null,
 *   dashboardPath: string,
 *   agendaPath: string,
 *   loading: boolean
 * }}
 */
export default function useEffectiveDashboardRoute() {
  const { user } = useAuth();
  const profileRole = user?.role;
  const [orgRoles, setOrgRoles] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setOrgRoles(null);
      return;
    }

    // Cache lookup
    const cached = cache.get(user.id);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      setOrgRoles(cached.roles);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setOrgRoles([]);
          setLoading(false);
          return;
        }
        const roles = (data || []).map((r) => r.role);
        cache.set(user.id, { roles, loadedAt: Date.now() });
        setOrgRoles(roles);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Priority swap: clinic_admin > dentist > assistant > profile.role
  let resolvedRole = profileRole;
  if (orgRoles) {
    if (orgRoles.includes('clinic_admin')) resolvedRole = USER_ROLES.CLINIC;
    else if (orgRoles.includes('dentist')) resolvedRole = USER_ROLES.THERAPIST;
    else if (orgRoles.includes('assistant')) resolvedRole = USER_ROLES.ASSISTANT;
  }

  return {
    resolvedRole,
    dashboardPath: getDashboardPath(resolvedRole),
    agendaPath: getAgendaPath(resolvedRole),
    loading,
  };
}
