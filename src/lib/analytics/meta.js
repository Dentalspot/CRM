/**
 * @file src/lib/analytics/meta.js
 *
 * Wrapper thin de Meta Pixel. NO carga el script — `MetaPixelProvider` ya lo
 * hace en mount de la app. Este módulo solo expone helpers para disparar
 * eventos custom que respetan el sistema de consent.
 *
 * Pixel routing:
 *  - En `/` (patient home) → dispara a PIXEL_PATIENTS
 *  - En `/para-dentistas` → dispara a PIXEL_PROFESSIONALS
 *  - En cualquier otra ruta → dispara a ambos (fallback)
 *
 * Para uso desde componentes, importar desde `@/lib/analytics` (no desde este
 * archivo directo) — `index.js` orquesta el routing entre Meta + GA4.
 */

import { PIXEL_PATIENTS, PIXEL_PROFESSIONALS } from '@/components/shared/MetaPixelProvider';

/**
 * Resuelve qué pixel(s) corresponden a la ruta actual.
 *
 * @returns {string[]} array de pixel IDs (1 o 2 elementos)
 */
const resolvePixelsForPath = () => {
  if (typeof window === 'undefined') return [];
  const path = window.location.pathname;
  if (path === '/para-dentistas' || path.startsWith('/para-dentistas/')) {
    return [PIXEL_PROFESSIONALS];
  }
  if (path === '/' || path === '') {
    return [PIXEL_PATIENTS];
  }
  // Fallback: ambos pixels (mantiene comportamiento previo en rutas no específicas)
  return [PIXEL_PATIENTS, PIXEL_PROFESSIONALS];
};

/**
 * Verifica si fbq está disponible (Meta Pixel base cargado).
 */
export const isMetaReady = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

/**
 * Envía un evento custom a Meta Pixel (al/los pixel(s) correspondiente(s) a la ruta).
 *
 * IMPORTANTE: Meta distingue "standard events" (Purchase, Lead, etc.) y "custom events"
 * (cualquier otro). Nuestros nombres `patient_hero_cta_click` etc. son custom.
 * Para custom events usamos `trackSingleCustom` con el pixel target.
 *
 * @param {string} eventName - snake_case, ver contracts/analytics-events.md
 * @param {object} [props={}] - flat object con valores primitivos
 */
export const trackMeta = (eventName, props = {}) => {
  if (!isMetaReady()) return;
  const pixels = resolvePixelsForPath();
  if (pixels.length === 0) return;
  try {
    pixels.forEach((pixelId) => {
      window.fbq('trackSingleCustom', pixelId, eventName, props);
    });
  } catch {
    /* silent */
  }
};
