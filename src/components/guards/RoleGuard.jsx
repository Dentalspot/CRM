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