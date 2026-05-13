import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { Loader2 } from 'lucide-react';

// Mapeo de roles de organization_members a USER_ROLES del frontend
const ORG_ROLE_TO_FRONTEND = {
  dentist: 'therapist',
  clinic_admin: 'clinic',
  assistant: 'assistant',
};

// B11a: roles primarios que requieren onboarding de clínica completo
// (existir como member de al menos una org). Los demás (patient, admin,
// superadmin, lab) no se bloquean.
const ROLES_REQUIRING_CLINIC_ONBOARDING = ['therapist', 'clinic'];

// Rutas donde NO aplicamos el gate (el wizard mismo, settings, etc.)
const ONBOARDING_EXEMPT_PATHS = [
  '/dashboard/profile',
  '/dashboard/membership',
  '/dashboard/membresia',
];

const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const { effectiveRole, userOrgRoles = [], loading: orgLoading } = useCurrentOrganization();
  const location = useLocation();

  // Esperar a que tanto auth como org context terminen de cargar
  if (loading || orgLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Permitir acceso si CUALQUIERA de los roles del usuario matchea:
  //  - profile.role (rol primario)
  //  - effectiveRole (priority dentist > clinic_admin > assistant)
  //  - cualquier rol activo en organization_members (mapeado a frontend)
  const profileRole = profile?.role || user.user_metadata?.role;
  const orgEffectiveRole = effectiveRole;
  const allOrgRolesMapped = userOrgRoles.map(r => ORG_ROLE_TO_FRONTEND[r] || r);

  // B11a gate: usuarios pro sin organization_members deben completar wizard
  // "Mi Clínica" antes de poder usar el resto de la app. Sin esto, las RLS
  // de patients/appointments/etc. bloquean todo y la app queda "rota".
  const needsClinicOnboarding =
    profileRole &&
    ROLES_REQUIRING_CLINIC_ONBOARDING.includes(profileRole) &&
    userOrgRoles.length === 0;

  const isExemptPath = ONBOARDING_EXEMPT_PATHS.some((p) => location.pathname.startsWith(p));

  if (needsClinicOnboarding && !isExemptPath) {
    // Therapist va a "Mis Lugares de Atención" (crea clinic propia → trigger crea org_members).
    // Clinic admin va a "Datos de la Clínica" (mismo destino lógico, otro tab).
    const wizardTab = profileRole === 'clinic' ? 'clinic-info' : 'my-clinics';
    return <Navigate to={`/dashboard/profile?tab=${wizardTab}&onboarding=required`} replace />;
  }

  if (allowedRoles.length === 0) return children;

  const hasAccess =
    (profileRole && allowedRoles.includes(profileRole)) ||
    (orgEffectiveRole && allowedRoles.includes(orgEffectiveRole)) ||
    allOrgRolesMapped.some(r => allowedRoles.includes(r));

  if (!hasAccess) {
    // Evitar loop: si ya estamos en /dashboard, no redirigir de vuelta a /dashboard
    if (location.pathname === '/dashboard') {
      return (
        <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
          <p>No tienes acceso a esta sección.</p>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;