import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { USER_ROLES } from '@/constants/roles';

/**
 * Redirects authenticated users away from public auth pages (login/register).
 * If logged in:
 * - Admin -> /admin
 * - Others -> /dashboard
 */
const AuthRedirect = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // Determine redirect destination based on role
    const isAdmin = profile?.role === USER_ROLES.ADMIN || user.user_metadata?.role === USER_ROLES.ADMIN;
    const dest = isAdmin ? '/admin' : '/dashboard';
    
    // Check if there was a previous location state to redirect back to, otherwise go to role dashboard
    const from = location.state?.from?.pathname || dest;
    
    return <Navigate to={from} replace />;
  }

  return children;
};

export default AuthRedirect;