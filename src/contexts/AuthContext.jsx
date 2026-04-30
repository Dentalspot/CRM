
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { USER_ROLES } from '@/constants/roles';
import useIdleTimeout from '@/hooks/useIdleTimeout';
import { setSentryUser } from '@/lib/sentry';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // REF to avoid stale closure in onAuthStateChange
  const userRef = useRef(null);
  // REF to avoid duplicate fetches when Supabase fires SIGNED_IN multiple times
  const fetchingProfileRef = useRef(false);

  // Keep ref synchronized with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Sincronizar user id a Sentry para error context. Solo id — no email por privacidad.
  useEffect(() => {
    setSentryUser(user?.id || null);
  }, [user?.id]);

  // Helper to fetch profile data
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          therapist_branding (
            avatar_url,
            primary_color,
            secondary_color
          )
        `)
        .eq('id', userId)
        .maybeSingle(); // Changed from .single() to .maybeSingle() to prevent errors if 0 rows

      if (error) {
        logger.warn('Profile fetch warning (user might be new):', error.message);
        return null;
      }

      if (!profileData) return null;

      const branding = Array.isArray(profileData.therapist_branding)
        ? profileData.therapist_branding[0]
        : profileData.therapist_branding;

      const avatarUrl = branding?.avatar_url || null;

      return {
        ...profileData,
        avatar_url: avatarUrl,
        branding: branding || {}
      };
    } catch (err) {
      logger.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  // Sign Up
  const signUp = async (email, password, additionalData = {}) => {
    try {
      // PRE-CHECK: Prevent "User already registered" error from Auth by checking profiles table first
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        logger.warn('Error checking existing profile:', checkError);
      }

      if (existingProfile) {
        return {
          data: null,
          error: new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.'),
          needsEmailConfirmation: false
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: additionalData.full_name,
            role: additionalData.role,
            rut: additionalData.rut,
            origin_app: 'dentalspot',
            origin_domain: window.location.origin
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
        }
        throw error;
      }

      const needsEmailConfirmation = data.user && !data.session;

      return {
        data,
        error: null,
        needsEmailConfirmation
      };
    } catch (error) {
      logger.error("SignUp error:", error.message);
      return { data: null, error };
    }
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error("Google SignIn error:", error.message);
      return { data: null, error };
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error("SignIn error:", error.message);
      return { data: null, error };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      userRef.current = null;

      return { error: null };
    } catch (error) {
      logger.error("SignOut error:", error.message);
      return { error };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Use onAuthStateChange with INITIAL_SESSION instead of separate getSession()
    // This avoids lock contention that causes "Lock was stolen" errors
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (import.meta.env.DEV) {
        logger.auth('[AUTH EVENT]', event);
      }

      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        userRef.current = null;
        setLoading(false);
        return;
      }

      // Redirect to reset password page on recovery event (PKCE flow)
      if (event === 'PASSWORD_RECOVERY') {
        logger.auth('[AUTH] PASSWORD_RECOVERY detected, redirecting to reset page');
        sessionStorage.removeItem('dentalspot_pending_recovery');
        window.location.replace('/auth/reset-password');
        return;
      }

      // Check for pending recovery flag (set in main.jsx for PKCE code exchange)
      if (event === 'SIGNED_IN' && sessionStorage.getItem('dentalspot_pending_recovery')) {
        logger.auth('[AUTH] Pending recovery detected after SIGNED_IN');
        sessionStorage.removeItem('dentalspot_pending_recovery');
        window.location.replace('/auth/reset-password');
        return;
      }

      setSession(newSession);

      if (newSession?.user) {
        const currentUser = userRef.current;
        const isSameUser = currentUser?.id === newSession.user.id;

        // Fast path: same user already hydrated with role — only refresh session data
        if (isSameUser && currentUser?.role) {
          setUser(prev => ({ ...newSession.user, ...prev, id: newSession.user.id }));
          setLoading(false);
          return;
        }

        // New or different user: drop stale profile before anything else
        if (!isSameUser) {
          setProfile(null);
        }

        // Set a minimal fallback user synchronously so navigation is not blocked
        // by the profile fetch. The profile will be merged in when it resolves.
        const fallbackUser = {
          ...newSession.user,
          role: newSession.user.user_metadata?.role || USER_ROLES.PATIENT,
        };
        if (mounted) {
          setUser(fallbackUser);
          userRef.current = fallbackUser;
          setLoading(false);
        }

        // Enrich with full profile in background. Failures must not keep the user
        // stuck at login — the fallbackUser above already grants navigation.
        if (fetchingProfileRef.current) return;
        fetchingProfileRef.current = true;

        fetchProfile(newSession.user.id)
          .then(async (userProfile) => {
            if (!mounted) return;
            if (userRef.current?.id !== newSession.user.id) return;

            // Bloqueo cuenta eliminada (Ley 21.719 — derecho ARCO)
            if (userProfile?.deleted_at) {
              logger.auth('[AUTH] Cuenta eliminada detectada, forzando logout');
              // 1) Limpiar state local PRIMERO (evita que otros componentes
              //    intenten re-render con datos eliminados)
              setUser(null);
              setProfile(null);
              userRef.current = null;
              // 2) signOut (limpia sesión Supabase). Suprimir error si ya está sin sesión.
              try { await supabase.auth.signOut(); } catch (_) { /* ignore */ }
              // 3) Solo redirigir si no estamos ya en /auth/* (evita loop)
              if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                if (!path.startsWith('/auth/')) {
                  window.location.replace('/auth/login?reason=account_deleted');
                }
              }
              return;
            }

            setProfile(userProfile);
            setUser((prev) => {
              if (!prev || prev.id !== newSession.user.id) return prev;
              const merged = {
                ...prev,
                ...(userProfile || {}),
                role: userProfile?.role || prev.role,
              };
              userRef.current = merged;
              return merged;
            });
          })
          .catch((err) => {
            logger.warn('Error fetching profile during auth change:', err?.message);
          })
          .finally(() => {
            fetchingProfileRef.current = false;
          });
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          userRef.current = null;
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Idle timeout: logout automático tras 30 min de inactividad
  useIdleTimeout({ hasSession: !!session, onLogout: signOut });

  const value = {
    session,
    user,
    profile,
    loading, // Ensure 'loading' is used consistently
    isAdmin: user?.role === USER_ROLES.ADMIN,
    isTherapist: user?.role === USER_ROLES.THERAPIST,
    isPatient: user?.role === USER_ROLES.PATIENT,
    isClinic: user?.role === USER_ROLES.CLINIC,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile: async () => {
      if (user?.id) {
        const userProfile = await fetchProfile(user.id);
        if (userProfile) {
          setProfile(userProfile);
          setUser(prev => ({ ...prev, ...userProfile }));
        }
      }
    }
  };

  // Safety timeout: if loading takes more than 8 seconds, force render
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#6B21A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
