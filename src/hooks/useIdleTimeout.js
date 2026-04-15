import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;   // 30 minutos
const WARNING_BEFORE_MS = 5 * 60 * 1000;  // Warning 5 min antes
const THROTTLE_MS = 30 * 1000;            // Throttle de eventos: 30 seg

/**
 * Hook de idle timeout para sesiones clínicas.
 * - Detecta inactividad (mouse, keyboard, touch, click)
 * - Muestra toast warning a los 25 min
 * - Ejecuta logout automático a los 30 min
 * - Solo activo si hay sesión (hasSession = true)
 */
const useIdleTimeout = ({ hasSession, onLogout }) => {
  const { toast } = useToast();

  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    try {
      await onLogout();
    } catch {
      // Si falla signOut, limpiar manualmente
    }
    window.location.replace('/auth/login?reason=idle');
  }, [onLogout, clearTimers]);

  const resetTimers = useCallback(() => {
    const now = Date.now();
    // Throttle: ignorar si la última actividad fue hace menos de THROTTLE_MS
    if (now - lastActivityRef.current < THROTTLE_MS) return;
    lastActivityRef.current = now;
    warningShownRef.current = false;

    clearTimers();

    // Timer de warning a los 25 min
    warningTimerRef.current = setTimeout(() => {
      warningShownRef.current = true;
      toast({
        title: 'Sesión por expirar',
        description: 'Tu sesión se cerrará en 5 minutos por inactividad. Mueve el mouse o escribe para continuar.',
        duration: 60000,
      });
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Timer de logout a los 30 min
    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, handleLogout, toast]);

  useEffect(() => {
    if (!hasSession) {
      clearTimers();
      return;
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimers, { passive: true }));

    // Verificar al volver a la pestaña si ya pasó el timeout
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && hasSession) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= IDLE_TIMEOUT_MS) {
          handleLogout();
        } else {
          resetTimers();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Iniciar timers
    resetTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimers));
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimers();
    };
  }, [hasSession, resetTimers, handleLogout, clearTimers]);
};

export default useIdleTimeout;
