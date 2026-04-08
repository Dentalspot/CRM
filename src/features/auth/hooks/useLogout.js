// src/features/auth/hooks/useLogout.js
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

/**
 * @typedef {Object} UseLogoutResult
 * @property {boolean} isLoggingOut - Indica si el proceso de cierre de sesión está en curso
 * @property {(redirectTo?: string) => Promise<void>} logout - Función para cerrar sesión
 * @property {() => void} cancelLogout - Función para cancelar el proceso de logout
 */

/**
 * Hook personalizado para manejar el cierre de sesión del usuario
 * con manejo robusto de errores y prevención de race conditions.
 *
 * @returns {UseLogoutResult} Estado y funciones de logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const cancelLogout = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoggingOut(false);
  }, []);

  const logout = useCallback(async (redirectTo = '/auth/login') => {
    // Prevenir llamadas múltiples
    if (isLoggingOut) {
      logger.warn('[LOGOUT] ⚠️ Already logging out, ignoring duplicate call');
      return;
    }

    // Si no hay usuario, solo redirigir
    if (!user) {
      logger.info('[LOGOUT] 📝 No active session, redirecting to login');
      navigate(redirectTo, { replace: true });
      return;
    }

    setIsLoggingOut(true);
    abortControllerRef.current = new AbortController();

    // Timeout de 10 segundos
    timeoutRef.current = setTimeout(() => {
      logger.error('[LOGOUT] ⏱️ Timeout reached, forcing logout');

      toast({
        variant: "destructive",
        title: "Timeout en cierre de sesión",
        description: "La operación tardó demasiado. Redirigiendo..."
      });

      // Forzar navegación
      window.location.href = redirectTo;
    }, 10000);

    try {
      logger.info('[LOGOUT] 🚀 Starting logout process...');

      // Usar la función signOut del contexto (que ya maneja la limpieza)
      const result = await signOut();

      // Verificar si fue cancelado
      if (abortControllerRef.current?.signal.aborted) {
        logger.info('[LOGOUT] 🛑 Logout cancelled');
        return;
      }

      if (result?.error) {
        throw new Error(result.error.message || 'Error al cerrar sesión');
      }

      // Éxito
      logger.info('[LOGOUT] ✅ Logout successful');

      toast({
        title: "¡Hasta pronto!",
        description: "Has cerrado sesión exitosamente.",
        duration: 3000
      });

      // Pequeño delay para que el usuario vea el toast
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100);

    } catch (error) {
      logger.error('[LOGOUT] ❌ Logout error:', error);

      // Verificar si fue cancelado
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Ocurrió un error inesperado"
      });

      // En caso de error grave, forzar logout local y redirigir
      setTimeout(() => {
        logger.warn('[LOGOUT] 🔄 Forcing redirect after error');
        window.location.href = redirectTo;
      }, 2000);

    } finally {
      // Limpiar referencias
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      abortControllerRef.current = null;
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user, signOut, navigate, toast]);

  return {
    isLoggingOut,
    logout,
    cancelLogout
  };
};

// Exportar tipo para TypeScript (si usas TS en el futuro)
export default useLogout;