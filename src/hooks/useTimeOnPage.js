import { useEffect, useRef } from 'react';

/**
 * @file src/hooks/useTimeOnPage.js
 *
 * Hook que mide el tiempo (en segundos) que el usuario estuvo en la página
 * y dispara un callback cuando la página queda "hidden" (cambio de tab) o
 * se hace `pagehide` (cierre de tab / navegación).
 *
 * Usa `visibilitychange` + `pagehide` en vez de `beforeunload` por
 * compatibilidad con Safari iOS (que ignora beforeunload). La entrega del
 * evento durante unload es responsabilidad del consumidor — para garantía
 * usar `navigator.sendBeacon()` o equivalente desde el callback.
 *
 * @param {(seconds: number) => void} onUnload - callback con segundos transcurridos
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] - si false, no engancha
 */
const useTimeOnPage = (onUnload, options = {}) => {
  const { enabled = true } = options;
  const callbackRef = useRef(onUnload);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onUnload;
  }, [onUnload]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    startRef.current = Date.now();
    firedRef.current = false;

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      const seconds = Math.max(0, Math.floor((Date.now() - startRef.current) / 1000));
      try {
        callbackRef.current(seconds);
      } catch {
        /* silent */
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') fire();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', fire);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', fire);
    };
  }, [enabled]);
};

export default useTimeOnPage;
