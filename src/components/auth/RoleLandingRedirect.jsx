import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPathByRole } from '@/utils/roleRouting';
import { Loader2 } from 'lucide-react';

const RoleLandingRedirect = () => {
  // Use 'loading' consistently from AuthContext
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine redirect path based on user role
  const homePath = getDashboardPathByRole(profile?.role);
  
  return <Navigate to={homePath} replace />;
};

export default RoleLandingRedirect;