import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Guard that ensures the user is authenticated.
 * Handles OAuth PKCE flow where ?code= needs time to exchange for a session.
 */
const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [waitingForOAuth, setWaitingForOAuth] = useState(false);

  // Detect if we're returning from OAuth (has ?code= in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') && !user) {
      setWaitingForOAuth(true);
      // Give Supabase time to exchange the code
      const timer = setTimeout(() => setWaitingForOAuth(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Stop waiting once user is loaded
  useEffect(() => {
    if (user && waitingForOAuth) setWaitingForOAuth(false);
  }, [user, waitingForOAuth]);

  if (loading || waitingForOAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
