import { useEffect, useRef } from 'react';

/**
 * @file src/hooks/useScrollDepth.js
 *
 * Hook que dispara un callback cuando el scroll del usuario cruza los
 * thresholds 25%, 50%, 75% y 100% de la altura del documento.
 *
 * Implementación con IntersectionObserver — más performante que listeners
 * `scroll` con throttle. Cada threshold dispara una sola vez por sesión de
 * página (montaje del componente). Al unmount, observer + markers se limpian.
 *
 * @param {(depthPct: number) => void} onDepth - callback con el % (25, 50, 75, 100)
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] - si false, no engancha (útil para gating consent)
 */
const SCROLL_MARKERS = [25, 50, 75, 100];
const MARKER_ATTR = 'data-dentalspot-scroll-marker';

const useScrollDepth = (onDepth, options = {}) => {
  const { enabled = true } = options;
  const callbackRef = useRef(onDepth);

  // Sincronizar callbackRef sin re-engancher el observer en cada re-render
  useEffect(() => {
    callbackRef.current = onDepth;
  }, [onDepth]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const fired = new Set();
    const markers = [];

    // Crear markers absolutos en el body, posicionados en % de scroll height
    const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    SCROLL_MARKERS.forEach((pct) => {
      const marker = document.createElement('div');
      marker.setAttribute(MARKER_ATTR, String(pct));
      marker.style.cssText = `position:absolute;top:${(scrollHeight * pct) / 100}px;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden;`;
      document.body.appendChild(marker);
      markers.push(marker);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const pct = Number(entry.target.getAttribute(MARKER_ATTR));
        if (!Number.isFinite(pct) || fired.has(pct)) return;
        fired.add(pct);
        try {
          callbackRef.current(pct);
        } catch {
          /* silent */
        }
      });
    });

    markers.forEach((m) => observer.observe(m));

    return () => {
      observer.disconnect();
      markers.forEach((m) => {
        if (m.parentNode) m.parentNode.removeChild(m);
      });
    };
  }, [enabled]);
};

export default useScrollDepth;
