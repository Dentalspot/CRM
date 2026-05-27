import { useEffect, useRef } from 'react';

/**
 * @file src/hooks/useSectionVisible.js
 *
 * Hook que detecta cuando una sección entra al viewport con threshold
 * configurable (default 0.5 = 50% visible) y dispara un callback UNA SOLA
 * VEZ por sesión (montaje del componente).
 *
 * Útil para tracking de engagement por sección sin disparar repetidamente
 * con scroll up/down.
 *
 * @param {React.RefObject<HTMLElement>} ref - ref del elemento a observar
 * @param {(sectionName?: string) => void} onVisible - callback al entrar al viewport
 * @param {object} [options]
 * @param {string} [options.sectionName] - identificador opcional pasado al callback
 * @param {number} [options.threshold=0.5] - 0..1, % visible para considerar "visible"
 * @param {boolean} [options.enabled=true] - si false, no engancha
 */
const useSectionVisible = (ref, onVisible, options = {}) => {
  const { sectionName, threshold = 0.5, enabled = true } = options;
  const callbackRef = useRef(onVisible);
  const firedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined') return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const el = ref?.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          try {
            callbackRef.current(sectionName);
          } catch {
            /* silent */
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ref, sectionName, threshold, enabled]);
};

export default useSectionVisible;
