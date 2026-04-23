/**
 * @file src/lib/sentry.js
 *
 * Inicialización de Sentry para capturar errores en prod/staging.
 *
 * Activa solo si `VITE_SENTRY_DSN` está seteado en env vars (Vercel).
 * Si no hay DSN (ej. dev local sin ganas de ruido), queda no-op.
 *
 * Setup instructions: docs/local-dev/sentry-setup.md
 */

import * as Sentry from '@sentry/react';
import logger from '@/lib/utils/logger';

let initialized = false;

/**
 * Inicializa Sentry. Llamar una sola vez, idealmente antes del render.
 * Idempotente: llamadas repetidas son no-op.
 */
export const initSentry = () => {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    logger.info('[Sentry] VITE_SENTRY_DSN no configurado — tracking deshabilitado');
    return;
  }

  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT
    || (import.meta.env.PROD ? 'production' : 'development');

  const release = import.meta.env.VITE_SENTRY_RELEASE || undefined;

  Sentry.init({
    dsn,
    environment,
    release,

    // Muestreo conservador para stay within free tier (5K errors/mes)
    // Cada sesión con error cuenta. tracesSampleRate es para performance spans.
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,  // Session Replay deshabilitado (costo + privacidad)
    replaysOnErrorSampleRate: 0,

    // Integrations mínimas — sin BrowserTracing por defecto (consume volumen)
    integrations: [],

    // Ignorar errores benignos conocidos
    ignoreErrors: [
      // Ruido típico de SPAs y extensiones de browser
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Errores de network transitorios que no nos interesan
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
      'Load failed',
    ],

    // Antes de enviar, scrubear datos sensibles (PHI defensive)
    beforeSend(event, hint) {
      // Strip PII de URL query strings (ej. ?email=...)
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          // Remover query params sensibles comunes
          ['email', 'token', 'code', 'access_token'].forEach((k) => {
            if (url.searchParams.has(k)) url.searchParams.set(k, '[REDACTED]');
          });
          event.request.url = url.toString();
        } catch { /* ignore URL parse errors */ }
      }

      // No mandar emails en user context — solo id
      if (event.user?.email) delete event.user.email;

      // No mandar breadcrumbs con possibly clinical data keywords
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter((bc) => {
          const msg = (bc.message || '') + JSON.stringify(bc.data || {});
          // Heurística conservadora: filtrar breadcrumbs que mencionen clinical tables
          return !/patients|clinical_records|odontogram|legal_signatures/i.test(msg);
        });
      }

      return event;
    },
  });

  initialized = true;
  logger.info(`[Sentry] Inicializado — env="${environment}" release="${release || 'unset'}"`);
};

/**
 * Capturar una excepción manualmente. Útil en catch blocks que no quieren
 * re-throw pero sí reportar. No-op si Sentry no está inicializado.
 *
 * @param {Error | any} error
 * @param {object} [context] - metadata extra
 */
export const captureException = (error, context = {}) => {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
    }
    if (context.extra) {
      Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
    }
    if (context.level) scope.setLevel(context.level);
    Sentry.captureException(error);
  });
};

/**
 * Identificar al user actual (por id solamente — no email por privacidad).
 * @param {string | null} userId - null para clear
 */
export const setSentryUser = (userId) => {
  if (!initialized) return;
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
};
