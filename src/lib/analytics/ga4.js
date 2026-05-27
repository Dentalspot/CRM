/**
 * @file src/lib/analytics/ga4.js
 *
 * Google Analytics 4 loader y wrapper.
 *
 * Carga dinámica de gtag.js (no npm dep) inyectando <script> en <head>.
 * Solo se llama después de que el usuario aceptó la categoría "analytics"
 * del banner de cookies (CookieBanner.jsx).
 *
 * Idempotente: múltiples llamadas a initGA4() son no-op después de la primera.
 *
 * Para uso desde componentes, importar desde `@/lib/analytics` (no desde este
 * archivo directo) — `index.js` orquesta el routing entre Meta + GA4.
 */

let initialized = false;

/**
 * Inicializa GA4 inyectando gtag.js al DOM.
 *
 * @param {string} measurementId - Formato G-XXXXXXXXXX. Si vacío/falsy, no-op.
 */
export const initGA4 = (measurementId) => {
  if (initialized) return;
  if (!measurementId) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Inyectar el script async
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  // Setup gtag global
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    // anonymize_ip y otras opciones de privacidad por default modernas en GA4 — no requiere config explícita.
    // send_page_view: true es default; lo dejamos pasar para que GA4 trackee el primer load.
  });

  initialized = true;
};

/**
 * Verifica si GA4 fue inicializado (gtag disponible).
 * Útil para gateway externos que no quieren intentar trackear si no hay setup.
 */
export const isGA4Ready = () => initialized && typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Envía un evento custom a GA4.
 *
 * @param {string} eventName - snake_case, ver contracts/analytics-events.md
 * @param {object} [props={}] - flat object con valores primitivos
 */
export const trackGA4 = (eventName, props = {}) => {
  if (!isGA4Ready()) return;
  try {
    window.gtag('event', eventName, props);
  } catch {
    // Silent fail — analytics no debe romper la app
  }
};

/**
 * Trackea una SPA page view (GA4 no la dispara automáticamente en client routing).
 *
 * @param {string} pagePath - ej. "/para-dentistas"
 * @param {string} [pageTitle] - opcional, ej. document.title
 */
export const trackGA4PageView = (pagePath, pageTitle) => {
  if (!isGA4Ready()) return;
  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || (typeof document !== 'undefined' ? document.title : undefined),
    });
  } catch {
    /* silent */
  }
};
