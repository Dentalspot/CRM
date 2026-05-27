# `src/lib/analytics/`

Módulo unificado de analytics para DentalSpot.

## Propósito

Abstrae el envío de eventos a las dos plataformas (Meta Pixel + Google Analytics 4) detrás de una sola API (`trackEvent`, `trackPageView`). Respeta el sistema de consent de cookies existente (`window.__dentalspot_marketing_consent` y `window.__dentalspot_analytics_consent`).

## Archivos

| Archivo | Función |
|---|---|
| `index.js` | API pública unificada: `trackEvent`, `trackPageView`, `hasMarketingConsent`, `hasAnalyticsConsent` |
| `ga4.js` | Loader y wrapper de Google Analytics 4 (gtag.js). Carga dinámica solo si analytics consent granted |
| `meta.js` | Wrapper thin de `window.fbq` ya cargado por `MetaPixelProvider`. Solo dispara eventos custom si marketing consent granted |

## Consent gating

- **Eventos a Meta Pixel custom** → requieren `marketing` consent
- **Eventos a Google Analytics 4** → requieren `analytics` consent
- **Sin consent** → no-op silencioso (no error, no log)

## Uso

```js
import { trackEvent, trackPageView } from '@/lib/analytics';

// En cualquier componente:
trackEvent('patient_hero_cta_click', { has_symptom_input: true });

// Page view tracking en SPA:
trackPageView('/para-dentistas', 'DentalSpot para Profesionales');
```

## Pixel routing (Meta)

DentalSpot tiene 2 pixels de Meta (patients + professionals). El routing automático lo maneja `MetaPixelProvider`. Para eventos custom desde estas landings:

- `/` (patient home) → eventos van a PIXEL_PATIENTS
- `/para-dentistas` → eventos van a PIXEL_PROFESSIONALS

El módulo `meta.js` decide el target pixel basado en `window.location.pathname`.

## Eventos definidos

Ver `specs/027-patient-dentist-landings/contracts/analytics-events.md` para el schema completo de eventos.

## Hooks complementarios

Para tracking declarativo en componentes React, ver:
- `src/hooks/useScrollDepth.js` — dispara `scroll_depth` con prop `depth_pct`
- `src/hooks/useSectionVisible.js` — dispara `section_visible` con prop `section_name`
- `src/hooks/useTimeOnPage.js` — dispara `time_on_page` al unload
