import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { Loader2 } from 'lucide-react';

const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const { effectiveRole, loading: orgLoading } = useCurrentOrganization();
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

  // Usar effectiveRole de org_members si está disponible (dentist > clinic_admin > assistant)
  // Fallback a profiles.role si no hay contexto de organización
  const userRole = effectiveRole || profile?.role || user.user_metadata?.role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;