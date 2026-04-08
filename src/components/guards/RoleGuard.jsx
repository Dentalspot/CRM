import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const RoleGuard = ({ children, allowedRoles = [] }) => {
  // Use 'loading' consistently from AuthContext
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRole = profile?.role || user.user_metadata?.role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect unauthorized users to dashboard (or a dedicated unauthorized page)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;