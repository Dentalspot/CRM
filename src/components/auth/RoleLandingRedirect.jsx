import React, { useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPathByRole } from '@/utils/roleRouting';
import { USER_ROLES } from '@/constants/roles';
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

/**
 * Current app identifier — must match what's stored in user_metadata.origin_app
 * Each Comunicare app sets its own: 'fonokit', 'dentalspot', 'kinekit', etc.
 */
const CURRENT_APP = 'dentalspot';

/**
 * Map of origin_app to their domains for cross-app redirect
 */
const APP_DOMAINS = {
  fonokit: 'https://fonokit.cl',
  dentalspot: 'https://dentalspot.cl',
  kinekit: 'https://kinekit.cl',
  psikit: 'https://psikit.cl',
  ocupakit: 'https://ocupakit.cl',
  nutrikit: 'https://nutrikit.cl',
  medikit: 'https://medikit.cl',
};

const APP_NAMES = {
  fonokit: 'FonoKit',
  dentalspot: 'DentalSpot',
  kinekit: 'KineKit',
  psikit: 'PsiKit',
  ocupakit: 'OcupaKit',
  nutrikit: 'NutriKit',
  medikit: 'MediKit',
};

const RoleLandingRedirect = () => {
  const { profile, user, loading } = useAuth();
  const location = useLocation();
  const [orgRole, setOrgRole] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  /**
   * Helper: navega solo si NO estamos ya en la URL target.
   * Evita loops cuando otro componente (RoleGuard u otro) redirige de vuelta.
   */
  const safeNavigate = (target) => {
    if (location.pathname === target) {
      // Ya estamos ahí; no renderizar Navigate (evita loop).
      // En su lugar mostrar un fallback sutil para que React no monte/desmonte rápido.
      return (
        <div className="flex h-screen w-full items-center justify-center text-muted-foreground text-sm">
          <p>Cargando dashboard...</p>
        </div>
      );
    }
    return <Navigate to={target} replace />;
  };

  // Consultar organization_members para determinar rol operativo real
  useEffect(() => {
    if (!user?.id || loading) return;

    let cancelled = false;
    const fetchOrgRole = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (cancelled) return;

        if (error) {
          // RLS o tabla no accesible → fallback a profiles.role (no bloquea)
          console.warn('[RoleLandingRedirect] organization_members query error:', error.message);
          setOrgRole(null);
          return;
        }

        const roles = (data || []).map(r => r.role);

        // Prioridad explícita: dentist > clinic_admin > assistant
        if (roles.includes('dentist')) {
          setOrgRole(USER_ROLES.THERAPIST);
        } else if (roles.includes('clinic_admin')) {
          setOrgRole(USER_ROLES.CLINIC);
        } else if (roles.includes('assistant')) {
          setOrgRole(USER_ROLES.ASSISTANT);
        } else {
          setOrgRole(null); // sin membresía → fallback a profiles.role
        }
      } catch (err) {
        // Cualquier error inesperado: fallback a profile.role, NO bloquear
        console.warn('[RoleLandingRedirect] unexpected error:', err?.message);
        if (!cancelled) setOrgRole(null);
      } finally {
        // CRÍTICO: siempre pasar orgLoading a false para que el redirect ocurra
        if (!cancelled) setOrgLoading(false);
      }
    };

    fetchOrgRole();
    return () => { cancelled = true; };
  }, [user?.id, loading]);

  if (loading || orgLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = profile?.role;
  const originApp = user?.user_metadata?.origin_app;

  // Patients → universal dashboard, no origin check needed
  if (role === USER_ROLES.PATIENT) {
    return safeNavigate(getDashboardPathByRole(role));
  }

  // Professionals: check if they belong to THIS app
  if (role === USER_ROLES.THERAPIST || role === USER_ROLES.CLINIC || role === USER_ROLES.LAB) {
    // No origin_app = legacy user or registered before multi-app, let them through
    if (!originApp || originApp === CURRENT_APP) {
      // Si org_members define un rol operativo, usarlo. Si no, fallback a profiles.role.
      const effectiveRole = orgRole || role;
      return safeNavigate(getDashboardPathByRole(effectiveRole));
    }

    // Professional registered on a DIFFERENT app — show redirect message
    const correctDomain = APP_DOMAINS[originApp] || APP_DOMAINS.fonokit;
    const correctName = APP_NAMES[originApp] || originApp;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Tu cuenta profesional esta en {correctName}
          </h2>
          <p className="text-slate-600 mb-6">
            Te registraste como profesional en <strong>{correctName}</strong>.
            Tu dashboard y pacientes estan alla.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <a href={`${correctDomain}/dashboard`} className="flex items-center justify-center gap-2">
                Ir a {correctName} <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <p className="text-xs text-slate-400">
              ¿Tambien eres dentista?{' '}
              <Link to="/auth/register" className="text-primary hover:underline">
                Regístrate en DentalSpot
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin or default
  return safeNavigate(getDashboardPathByRole(role));
};

export default RoleLandingRedirect;
