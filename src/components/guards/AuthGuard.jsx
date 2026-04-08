import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Guard that ensures the user is authenticated.
 * Unlike RoleGuard, this does not check for specific roles, just authentication status.
 */
const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login, saving the location they were trying to go to
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;