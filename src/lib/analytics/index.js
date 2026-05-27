/**
 * @file src/lib/analytics/index.js
 *
 * API unificada para tracking de eventos en DentalSpot.
 *
 * Orquesta Meta Pixel + Google Analytics 4 respetando el sistema de consent
 * existente (CookieBanner.jsx). Cada plataforma se gobierna por su categoría
 * de consent:
 *   - Meta custom events → `marketing` consent
 *   - GA4 events → `analytics` consent
 *
 * Sin consent → no-op silencioso. No error, no log, no warning.
 *
 * Schema de eventos definidos en:
 *   specs/027-patient-dentist-landings/contracts/analytics-events.md
 */

import { initGA4, trackGA4, trackGA4PageView } from './ga4';
import { trackMeta } from './meta';

/**
 * Lee el estado de consent globalmente expuesto por CookieBanner.
 *
 * @returns {{ analytics: boolean, marketing: boolean, essential: boolean }}
 */
const getConsent = () => {
  if (typeof window === 'undefined') {
    return { analytics: false, marketing: false, essential: false };
  }
  return {
    analytics: window.__dentalspot_analytics_consent === true,
    marketing: window.__dentalspot_marketing_consent === true,
    essential: window.__dentalspot_essential_consent === true,
  };
};

/**
 * Helper público: ¿el user aceptó marketing cookies?
 * Útil para gateway externos antes de mostrar contenido tracking-dependent.
 */
export const hasMarketingConsent = () => getConsent().marketing;

/**
 * Helper público: ¿el user aceptó analytics cookies?
 */
export const hasAnalyticsConsent = () => getConsent().analytics;

/**
 * Inicializa GA4 si tenemos analytics consent + measurement ID configurado.
 * Idempotente. Llamada típica desde `CookieBanner` post-acceptance, o desde
 * el listener `dentalspot:consent-changed` para reactividad.
 */
export const initAnalytics = () => {
  if (!hasAnalyticsConsent()) return;
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (!measurementId) return;
  initGA4(measurementId);
};

/**
 * Envía un evento a Meta + GA4 simultáneamente, gateado por consent.
 *
 * Categorías:
 *  - Meta custom event → requiere `marketing` consent
 *  - GA4 event → requiere `analytics` consent
 *
 * Un evento puede llegar a una plataforma pero no la otra (consent parcial).
 *
 * @param {string} eventName - snake_case, ver contracts/analytics-events.md
 * @param {object} [props={}] - flat object con valores primitivos
 */
export const trackEvent = (eventName, props = {}) => {
  const consent = getConsent();
  if (consent.marketing) {
    trackMeta(eventName, props);
  }
  if (consent.analytics) {
    trackGA4(eventName, props);
  }
};

/**
 * Trackea page view en SPA navigation. Solo dispara a GA4 (Meta auto-trackea
 * pageviews vía `MetaPixelProvider`, no duplicamos).
 *
 * @param {string} pagePath - ej. "/para-dentistas"
 * @param {string} [pageTitle] - opcional, ej. document.title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!hasAnalyticsConsent()) return;
  trackGA4PageView(pagePath, pageTitle);
};
