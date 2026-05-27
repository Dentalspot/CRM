# Contract — Analytics Events (Meta Pixel + GA4)

**Spec**: [../spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md) | **Date**: 2026-05-26

Schema completo de los eventos a instrumentar en las landings. Cada evento se dispara **simultáneamente** a Meta Pixel y a GA4 vía la API unificada `trackEvent(name, props)` del módulo `src/lib/analytics/index.js`.

---

## Convenciones globales

- **Nombre de evento**: `snake_case`, en español lowercase (sin acentos).
- **Props**: objeto plano (no nested objects). Valores: string, number, boolean.
- **Plataformas**: todos los eventos van a **AMBAS** plataformas (Meta + GA4) salvo que se indique lo contrario.
- **Consent gate**: ningún evento se dispara si el usuario no aceptó cookies de marketing. Esto está garantizado a nivel `trackEvent()` (early return si no hay consent).
- **Page tracking**: Page views se disparan automáticamente al `useEffect` del componente top-level de cada landing (`HomePage.jsx` y `DentistLandingPage.jsx`).

---

## Patient home (`/`)

### `patient_home_view`
- **Disparo**: useEffect al montar `HomePage.jsx` (después de check consent).
- **Props**: ninguno custom (page path se infiere automáticamente).
- **Plataforma**: Meta + GA4.
- **Propósito**: Baseline de tráfico patient.

### `patient_hero_cta_click`
- **Disparo**: click en el botón "Encontrar dentista" del hero.
- **Props**:
  - `has_symptom_input` (boolean) — ¿el input tenía texto al hacer click?
- **Plataforma**: Meta + GA4.
- **Propósito**: Mide CTR del hero CTA (per SC-003).

### `patient_section_visible`
- **Disparo**: cuando una sección entra al viewport (IntersectionObserver, threshold 0.5).
- **Props**:
  - `section_name` (string) — uno de: `como_funciona`, `por_que`, `faq`, `footer`.
- **Plataforma**: GA4 only (Meta no precisa tanto detalle).
- **Propósito**: Engagement por sección.

### `patient_faq_question_open`
- **Disparo**: click en una pregunta del FAQ que la expande.
- **Props**:
  - `question_id` (string) — slug de la pregunta (ej. `es_gratis`, `como_funciona_ia`).
- **Plataforma**: GA4 only.
- **Propósito**: Mide qué dudas tienen los pacientes.

### `patient_footer_to_dentist_click`
- **Disparo**: click en el cross-link "¿Eres dentista? → DentalSpot para profesionales" del footer.
- **Props**: ninguno.
- **Plataforma**: Meta + GA4.
- **Propósito**: Mide cuántos visitantes cross-navegan.

---

## Dentist landing (`/para-dentistas`)

### `dentist_home_view`
- **Disparo**: useEffect al montar `DentistLandingPage.jsx` (después de check consent).
- **Props**: ninguno.
- **Plataforma**: Meta + GA4.
- **Propósito**: Baseline de tráfico dentist.

### `dentist_hero_cta_register_click`
- **Disparo**: click en el botón "Crear cuenta gratis" del hero.
- **Props**: ninguno (el destino es siempre `/auth`).
- **Plataforma**: Meta + GA4.
- **Propósito**: Conversion principal (per SC-004).
- **Nota**: Cuando el user complete el registro en `/auth`, ahí debe trackear un evento separado `dentist_signup_complete` (fuera del scope de esta spec — vive en AuthForm).

### `dentist_section_visible`
- **Disparo**: cuando una sección entra al viewport (IntersectionObserver, threshold 0.5).
- **Props**:
  - `section_name` (string) — uno de: `stats`, `problemas`, `features`, `pricing`, `faq`, `cta_final`, `footer`.
- **Plataforma**: GA4 only.
- **Propósito**: Engagement por sección. Identificar qué sección retiene más.

### `dentist_faq_question_open`
- **Disparo**: click en una pregunta del FAQ profesional.
- **Props**:
  - `question_id` (string) — slug de la pregunta (ej. `cuanto_cuesta`, `comision_por_cita`, `cumple_ley_21719`).
- **Plataforma**: GA4 only.
- **Propósito**: Identificar objeciones comunes.

### `dentist_pricing_contact_click`
- **Disparo**: click en el CTA "Hablanos para precios" de la sección Pricing placeholder.
- **Props**: ninguno.
- **Plataforma**: Meta + GA4.
- **Propósito**: Lead generation pre-pricing público.

### `dentist_final_cta_click`
- **Disparo**: click en el CTA final "Empezá gratis 30 días" al cierre de la landing.
- **Props**: ninguno.
- **Plataforma**: Meta + GA4.
- **Propósito**: Conversion alternativa (visitantes que llegaron al final).

### `dentist_footer_to_patient_click`
- **Disparo**: click en el cross-link "¿Eres paciente? → Buscar dentista" del footer.
- **Props**: ninguno.
- **Plataforma**: Meta + GA4.
- **Propósito**: Mide cross-navegación inversa.

---

## Comunes a ambas landings

### `scroll_depth`
- **Disparo**: cuando el scroll del usuario cruza 25%, 50%, 75% o 100% del documento (cada uno una vez).
- **Props**:
  - `depth_pct` (number) — `25`, `50`, `75`, o `100`.
  - `page` (string) — `patient_home` o `dentist_landing`.
- **Plataforma**: GA4 only.
- **Propósito**: Profundidad de lectura, identificar dónde abandona el usuario.

### `time_on_page`
- **Disparo**: al evento `visibilitychange` con `state === 'hidden'` o `pagehide`.
- **Props**:
  - `seconds` (number) — segundos transcurridos desde montar la página.
  - `page` (string) — `patient_home` o `dentist_landing`.
- **Plataforma**: GA4 only.
- **Propósito**: Engagement temporal por audiencia.
- **Implementation**: vía `navigator.sendBeacon()` para garantizar entrega en cierre de tab.

---

## API unificada — `src/lib/analytics/index.js`

```js
/**
 * Track an event across Meta Pixel + GA4 simultaneously.
 * Respects the cookie consent state — no-op if marketing cookies rejected.
 *
 * @param {string} eventName — snake_case event name from this contract
 * @param {object} [props] — flat object with primitive values
 */
export const trackEvent = (eventName, props = {}) => {
  if (!hasMarketingConsent()) return;
  trackMeta(eventName, props);
  trackGA4(eventName, props);
};

/**
 * Track a page view. Called once per page mount.
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!hasMarketingConsent()) return;
  // Meta auto-trackea pageview en init, no necesitamos llamada extra.
  // GA4 sí requiere llamada explícita en SPA.
  trackGA4PageView(pagePath, pageTitle);
};
```

---

## Verificación post-deploy

Smoke a hacer en prod después del deploy:

1. **Aceptar cookies** en banner de consent → ambos scripts (Meta + GA4) deben cargar.
2. Abrir DevTools → Network → filtro `google-analytics.com` y `facebook.com/tr`.
3. **Click en hero CTA patient** → ver request `patient_hero_cta_click` en ambos.
4. **Scroll hasta el footer** → ver requests `scroll_depth` con depth_pct 25/50/75/100.
5. **Click cross-link footer** → ver `patient_footer_to_dentist_click`.
6. **Navegar a `/para-dentistas`** → ver `dentist_home_view`.
7. **Cerrar la tab** → ver `time_on_page` con sendBeacon en Network (puede aparecer como "beacon" type).
8. **Rechazar cookies** en otra incógnita → verificar que NO carga ni GA4 ni Meta.
9. Ir a GA4 dashboard → Real-time → ver los eventos llegando con sus props.
10. Ir a Meta Events Manager → Test Events → ver los eventos llegando.

---

## Out of scope (Fase 1)

- Eventos de booking/conversion del flujo IA (`/consulta-publica` — vive en otra spec).
- Eventos del flujo de registro completo en `/auth` (vive en spec separado).
- Funnels custom en GA4 (configuración del dashboard — operativo, no de código).
- Audiences custom en Meta para retargeting (operativo).
- Server-side tracking (Meta Conversions API, GA4 Measurement Protocol) — Fase 3 si hace falta para anti-adblock.
